<?php

namespace App\Exceptions;

class InventoryTransactionException extends KasirSewaException
{
    public function __construct(string $reason, string $internalMessage = '')
    {
        parent::__construct(
            userMessage: "Gagal memproses transaksi inventaris: {$reason}. Hubungi admin jika masalah berlanjut.",
            internalMessage: $internalMessage ?: "Inventory transaction failed: {$reason}",
            code: 400
        );
    }
}
