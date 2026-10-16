<?php

namespace App\Exceptions;

class InsufficientStockException extends KasirSewaException
{
    public function __construct(string $productName, int $requested, int $available)
    {
        parent::__construct(
            userMessage: "Stok produk '{$productName}' tidak cukup. Diminta: {$requested}, Tersedia: {$available}.",
            internalMessage: "Insufficient stock for {$productName}: requested {$requested}, available {$available}",
            code: 400
        );
    }
}
