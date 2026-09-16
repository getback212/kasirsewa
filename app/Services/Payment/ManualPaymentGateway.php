<?php

namespace App\Services\Payment;

use App\Models\Invoice;
use App\Models\SaaSPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ManualPaymentGateway implements PaymentGatewayInterface
{
    public function createPayment(Invoice $invoice, string $method, array $extraData = []): SaaSPayment
    {
        $paymentNumber = 'PAY/MANUAL/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

        return SaaSPayment::create([
            'tenant_id' => $invoice->tenant_id,
            'invoice_id' => $invoice->id,
            'payment_number' => $paymentNumber,
            'payment_method' => $method ?: 'manual_transfer',
            'gateway_name' => 'manual',
            'gateway_transaction_id' => $paymentNumber,
            'amount' => $invoice->total,
            'status' => 'pending',
            'payload' => $extraData,
        ]);
    }

    public function checkPaymentStatus(SaaSPayment $payment): string
    {
        return $payment->status;
    }

    public function handleWebhook(Request $request): array
    {
        return [
            'status' => 'success',
            'payment_number' => $request->input('payment_number'),
            'action' => 'verify_manual',
        ];
    }

    public function refund(SaaSPayment $payment, ?float $amount = null): bool
    {
        $payment->update(['status' => 'refunded']);
        return true;
    }
}
