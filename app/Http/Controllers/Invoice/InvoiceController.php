<?php

namespace App\Http\Controllers\Invoice;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\SaaSSetting;
use App\Services\Audit\AuditLogService;
use App\Services\Payment\ManualPaymentGateway;
use App\Services\Payment\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response | \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();
        $isSuperAdmin = $user->hasRole('SUPER_ADMIN');

        // SUPER_ADMIN redirected to payment proofs dashboard
        if ($isSuperAdmin) {
            return redirect()->route('admin.payment_proofs.index');
        }

        $query = Invoice::with(['tenant', 'subscription.plan', 'plan', 'items', 'payments']);

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $query->where('tenant_id', $tenantId);

        $invoices = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'isSuperAdmin' => false,
        ]);
    }

    public function show(Request $request, int $id): Response
    {
        $user = $request->user();
        $isSuperAdmin = $user->hasRole('SUPER_ADMIN');

        $query = Invoice::with(['tenant.owner', 'subscription.plan', 'items', 'payments']);

        if (! $isSuperAdmin) {
            $tenantId = session('active_tenant_id', $user->tenant_id);
            $query->where('tenant_id', $tenantId);
        }

        $invoice = $query->findOrFail($id);

        $defaultBankAccounts = [
            [
                'id' => 1,
                'bank_name' => 'Bank BCA',
                'account_number' => SaaSSetting::get('bank_bca_number', '123-456-7890'),
                'account_name' => SaaSSetting::get('bank_bca_name', 'PT KasirSewa Indonesia'),
                'is_active' => true,
            ],
            [
                'id' => 2,
                'bank_name' => 'Bank Mandiri',
                'account_number' => SaaSSetting::get('bank_mandiri_number', '987-000-111-22'),
                'account_name' => SaaSSetting::get('bank_mandiri_name', 'PT KasirSewa Indonesia'),
                'is_active' => true,
            ],
        ];

        $bankAccountsRaw = SaaSSetting::get('bank_accounts', null);
        $bankAccounts = $bankAccountsRaw ? json_decode($bankAccountsRaw, true) : $defaultBankAccounts;

        $paymentSettings = [
            'bank_accounts' => $bankAccounts,
            'bank_bca_number' => SaaSSetting::get('bank_bca_number', '123-456-7890'),
            'bank_bca_name' => SaaSSetting::get('bank_bca_name', 'PT KasirSewa Indonesia'),
            'bank_mandiri_number' => SaaSSetting::get('bank_mandiri_number', '987-000-111-22'),
            'bank_mandiri_name' => SaaSSetting::get('bank_mandiri_name', 'PT KasirSewa Indonesia'),
            'qris_payload' => SaaSSetting::get('qris_payload', ''),
            'qris_image_url' => SaaSSetting::get('qris_image_url', ''),
            'payment_instructions' => SaaSSetting::get('payment_instructions', 'Silakan melakukan transfer sesuai nominal invoice.'),
        ];

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
            'isSuperAdmin' => $isSuperAdmin,
            'paymentSettings' => $paymentSettings,
        ]);
    }

    public function submitPayment(Request $request, int $id, ManualPaymentGateway $manualGateway): RedirectResponse
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);

        $invoice = Invoice::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'payment_method' => ['required', 'string'],
            'sender_bank' => ['required', 'string', 'max:100'],
            'sender_name' => ['required', 'string', 'max:100'],
            'proof_file' => ['nullable', 'file', 'image', 'max:5120'], // max 5MB
        ]);

        $proofUrl = null;
        if ($request->hasFile('proof_file')) {
            $path = $request->file('proof_file')->store('payment_proofs', 'public');
            $proofUrl = "/storage/{$path}";
        }

        $payment = $invoice->payments()->latest()->first();

        if (! $payment) {
            $payment = $manualGateway->createPayment($invoice, $request->payment_method, [
                'sender_bank' => $request->sender_bank,
                'sender_name' => $request->sender_name,
                'proof_url' => $proofUrl,
            ]);
        } else {
            $payment->update([
                'payment_method' => $request->payment_method,
                'payload' => array_merge($payment->payload ?? [], [
                    'sender_bank' => $request->sender_bank,
                    'sender_name' => $request->sender_name,
                    'proof_url' => $proofUrl,
                ]),
                'status' => 'pending',
            ]);
        }

        $invoice->update(['status' => 'pending']);

        AuditLogService::log('SAAS_PAYMENT_SUBMITTED', 'Invoice', $invoice->id, [
            'invoice_number' => $invoice->invoice_number,
            'sender_name' => $request->sender_name,
        ]);

        return redirect()->back()->with('success', "Konfirmasi pembayaran Invoice #{$invoice->invoice_number} berhasil dikirim! Tim Super Admin akan memverifikasi pembayaran Anda.");
    }

    public function confirmPayment(Request $request, int $id, PaymentService $paymentService, ManualPaymentGateway $manualGateway): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang dapat mengonfirmasi verifikasi pembayaran invoice.');
        }

        $invoice = Invoice::with('payments')->findOrFail($id);
        $pendingPayment = $invoice->payments()->where('status', 'pending')->latest()->first();

        if (! $pendingPayment) {
            $pendingPayment = $manualGateway->createPayment($invoice, 'manual_transfer');
        }

        $paymentService->processPaymentSuccess($pendingPayment);

        return redirect()->back()->with('success', "Pembayaran invoice #{$invoice->invoice_number} berhasil dikonfirmasi LUNAS! Langganan SaaS tenant telah diperpanjang.");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang memiliki wewenang untuk menghapus riwayat tagihan invoice.');
        }

        $invoice = Invoice::with(['items', 'payments'])->findOrFail($id);
        $invoiceNumber = $invoice->invoice_number;

        DB::transaction(function () use ($invoice) {
            $invoice->items()->delete();
            $invoice->payments()->delete();
            $invoice->delete();
        });

        AuditLogService::log('SAAS_INVOICE_DELETE', 'Invoice', $id, ['invoice_number' => $invoiceNumber]);

        return redirect()->route('invoices.index')->with('success', "Riwayat tagihan invoice #{$invoiceNumber} berhasil dihapus dari sistem!");
    }
}
