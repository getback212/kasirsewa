<?php

namespace App\Services\Payment;

use App\Models\Invoice;
use App\Models\SaaSPayment;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    public function createPayment(Invoice $invoice, string $method, array $extraData = []): SaaSPayment;

    public function checkPaymentStatus(SaaSPayment $payment): string;

    public function handleWebhook(Request $request): array;

    public function refund(SaaSPayment $payment, ?float $amount = null): bool;
}
