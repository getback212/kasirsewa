<?php

namespace App\Services\Payment;

use App\Models\Invoice;
use App\Models\SaaSPayment;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\Audit\AuditLogService;
use Illuminate\Support\Facades\DB;
use Exception;

class PaymentService
{
    public function __construct(
        protected ManualPaymentGateway $manualGateway
    ) {}

    public function processPaymentSuccess(SaaSPayment $payment, ?string $paidAt = null): bool
    {
        return DB::transaction(function () use ($payment, $paidAt) {
            // Check Idempotency: If payment is already completed, skip duplicate processing
            if ($payment->status === 'completed') {
                return true;
            }

            $paymentTime = $paidAt ? \Carbon\Carbon::parse($paidAt) : now();

            $payment->update([
                'status' => 'completed',
                'paid_at' => $paymentTime,
            ]);

            $invoice = $payment->invoice;
            if ($invoice && $invoice->status !== 'paid') {
                $invoice->update([
                    'status' => 'paid',
                    'paid_at' => $paymentTime,
                ]);

                // Extend Subscription
                if ($invoice->subscription_id) {
                    $subscription = Subscription::find($invoice->subscription_id);
                    if ($subscription) {
                        $daysToAdd = $subscription->billing_cycle === 'yearly' ? 365 : 30;
                        
                        $newStartsAt = $subscription->expires_at && $subscription->expires_at->isFuture()
                            ? $subscription->starts_at
                            : now();

                        $newExpiresAt = $subscription->expires_at && $subscription->expires_at->isFuture()
                            ? $subscription->expires_at->addDays($daysToAdd)
                            : now()->addDays($daysToAdd);

                        $subscription->update([
                            'status' => 'active',
                            'starts_at' => $newStartsAt,
                            'expires_at' => $newExpiresAt,
                            'grace_until' => null,
                        ]);

                        // Update Tenant Status
                        Tenant::where('id', $invoice->tenant_id)->update(['status' => 'active']);
                    }
                }
            }

            AuditLogService::log(
                action: 'SAAS_PAYMENT_SUCCESS',
                modelType: 'SaaSPayment',
                modelId: $payment->id,
                newValues: ['payment_number' => $payment->payment_number, 'amount' => $payment->amount, 'invoice' => $invoice?->invoice_number]
            );

            return true;
        });
    }
}
