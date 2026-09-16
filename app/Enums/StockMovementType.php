<?php

namespace App\Enums;

enum StockMovementType: string
{
    case PURCHASE = 'purchase';
    case SALE = 'sale';
    case SALE_RETURN = 'sale_return';
    case PURCHASE_RETURN = 'purchase_return';
    case ADJUSTMENT = 'adjustment';
    case STOCK_OPNAME = 'stock_opname';
    case TRANSFER = 'transfer';

    public function label(): string
    {
        return match ($this) {
            self::PURCHASE => 'Restok Pembelian',
            self::SALE => 'Penjualan Kasir',
            self::SALE_RETURN => 'Retur Penjualan',
            self::PURCHASE_RETURN => 'Retur Pembelian',
            self::ADJUSTMENT => 'Penyesuaian Manual',
            self::STOCK_OPNAME => 'Stock Opname Fisik',
            self::TRANSFER => 'Transfer Outlet',
        };
    }
}
