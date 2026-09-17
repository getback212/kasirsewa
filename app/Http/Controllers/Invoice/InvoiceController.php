<?php

namespace App\Http\Controllers\Invoice;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\SaaSPayment;
use App\Services\Payment\PaymentService;
use App\Services\Payment\ManualPaymentGateway;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSuperAdmin = $user->hasRole('SUPER_ADMIN');

        $query = Invoice::with(['tenant', 'subscription.plan', 'plan', 'items', 'payments']);

        if (!$isSuperAdmin) {
            $tenantId = session('active_tenant_id', $user->tenant_id);
            $query->where('tenant_id', $tenantId);
        }

        $invoices = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    public function show(Request $request, int $id): Response
    {
        $user = $request->user();
        $isSuperAdmin = $user->hasRole('SUPER_ADMIN');

        $query = Invoice::with(['tenant.owner', 'subscription.plan', 'items', 'payments']);

        if (!$isSuperAdmin) {
            $tenantId = session('active_tenant_id', $user->tenant_id);
            $query->where('tenant_id', $tenantId);
        }

        $invoice = $query->findOrFail($id);

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
            'isSuperAdmin' => $isSuperAdmin,
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

        if (!$payment) {
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

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang dapat mengonfirmasi verifikasi pembayaran invoice.');
        }

        $invoice = Invoice::with('payments')->findOrFail($id);
        $pendingPayment = $invoice->payments()->where('status', 'pending')->latest()->first();

        if (!$pendingPayment) {
            $pendingPayment = $manualGateway->createPayment($invoice, 'manual_transfer');
        }

        $paymentService->processPaymentSuccess($pendingPayment);

        return redirect()->back()->with('success', "Pembayaran invoice #{$invoice->invoice_number} berhasil dikonfirmasi LUNAS! Langganan SaaS tenant telah diperpanjang.");
    }
}
