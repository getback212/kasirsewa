<?php

namespace App\Http\Controllers\Invoice;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\SaaSPayment;
use App\Services\Payment\PaymentService;
use App\Services\Payment\ManualPaymentGateway;
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
