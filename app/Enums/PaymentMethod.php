<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CASH = 'cash';
    case QRIS = 'qris';
    case DEBIT = 'debit';
    case CREDIT = 'credit';
    case BANK_TRANSFER = 'bank_transfer';
    case EWALLET = 'ewallet';

    public function label(): string
    {
        return match ($this) {
            self::CASH => 'Tunai (Cash)',
            self::QRIS => 'QRIS Instant',
            self::DEBIT => 'Kartu Debit EDC',
            self::CREDIT => 'Kartu Kredit EDC',
            self::BANK_TRANSFER => 'Transfer Bank',
            self::EWALLET => 'E-Wallet (GoPay/OVO/Dana)',
        };
    }
}
