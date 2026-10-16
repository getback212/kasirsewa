<?php

namespace App\Exceptions;

class CreditLimitExceededException extends KasirSewaException
{
    public function __construct(string $customerName, float $limit, float $balance, float $transactionAmount)
    {
        $limitStr = number_format($limit, 0, ',', '.');
        $balanceStr = number_format($balance, 0, ',', '.');
        $amountStr = number_format($transactionAmount, 0, ',', '.');

        parent::__construct(
            userMessage: "Batas limit kredit pelanggan '{$customerName}' telah terlampaui. Limit: Rp {$limitStr}, Saldo: Rp {$balanceStr}, Transaksi: Rp {$amountStr}.",
            internalMessage: "Credit limit exceeded for {$customerName}: limit={$limit}, balance={$balance}, transaction={$transactionAmount}",
            code: 400
        );
    }
}
