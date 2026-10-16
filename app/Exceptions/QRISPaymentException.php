<?php

namespace App\Exceptions;

class QRISPaymentException extends KasirSewaException
{
    public function __construct(string $reason, string $internalMessage = '')
    {
        parent::__construct(
            userMessage: "Pembayaran QRIS gagal: {$reason}. Silakan coba lagi atau hubungi support.",
            internalMessage: $internalMessage ?: "QRIS payment failed: {$reason}",
            code: 402
        );
    }
}
