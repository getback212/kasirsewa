<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\Audit\AuditLogService;
use DB;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);

        $tenant = Tenant::with(['subscription.plan', 'invoices.items', 'stores', 'users'])->findOrFail($tenantId);
        $plans = Plan::where('is_active', true)->get();

        return Inertia::render('Subscription/Index', [
            'tenant' => $tenant,
            'subscription' => $tenant->subscription,
            'plans' => $plans,
            'invoices' => $tenant->invoices()->latest()->take(10)->get(),
        ]);
    }

    public function renew(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
            abort(403, 'Hanya Pemilik Toko (Owner) yang berwenang melakukan perpanjangan paket.');
        }

        $validated = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'billing_cycle' => ['required', 'in:monthly,yearly'],
        ]);

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $tenant = Tenant::findOrFail($tenantId);
        $plan = Plan::findOrFail($validated['plan_id']);

        $price = $validated['billing_cycle'] === 'yearly' ? (float) $plan->yearly_price : (float) $plan->monthly_price;
        $invoiceNumber = 'INV/SAAS/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

        DB::transaction(function () use ($tenant, $plan, $validated, $price, $invoiceNumber) {
            $subscription = Subscription::where('tenant_id', $tenant->id)->first();

            if (! $subscription) {
                $subscription = Subscription::create([
                    'tenant_id' => $tenant->id,
                    'plan_id' => $plan->id,
                    'status' => 'trial',
                    'billing_cycle' => $validated['billing_cycle'],
                    'starts_at' => now(),
                    'trial_ends_at' => now()->addDays(7),
                ]);
            } else {
                // Retain current trial/active status while invoice is pending payment approval
                $subscription->update([
                    'plan_id' => $plan->id,
                    'billing_cycle' => $validated['billing_cycle'],
                ]);
            }

            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'tenant_id' => $tenant->id,
                'subscription_id' => $subscription->id,
                'plan_id' => $plan->id,
                'subtotal' => $price,
                'discount' => 0.00,
                'tax' => 0.00,
                'total' => $price,
                'status' => 'pending',
                'due_at' => now()->addDays(3),
            ]);

            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'description' => "Perpanjangan Paket SaaS '{$plan->name}' (".strtoupper($validated['billing_cycle']).')',
                'amount' => $price,
            ]);
        });

        AuditLogService::log(
            action: 'SUBSCRIPTION_RENEW_REQUEST',
            modelType: 'Subscription',
            modelId: $tenant->id,
            newValues: ['plan' => $plan->name, 'cycle' => $validated['billing_cycle'], 'total' => $price]
        );

        return redirect('/invoices')->with('success', "Tagihan invoice berlangganan paket '{$plan->name}' (Rp ".number_format($price, 0, ',', '.').') berhasil dibuat! Silakan lakukan pembayaran via QRIS atau Transfer Bank.');
    }
}
