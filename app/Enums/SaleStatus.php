<?php

namespace App\Enums;

enum SaleStatus: string
{
    case COMPLETED = 'completed';
    case VOID = 'void';
    case REFUNDED = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::COMPLETED => 'Selesai (Completed)',
            self::VOID => 'Dibatalkan (Void)',
            self::REFUNDED => 'Diretur (Refunded)',
        };
    }
}
