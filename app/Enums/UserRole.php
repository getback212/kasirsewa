<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMIN = 'SUPER_ADMIN';
    case OWNER = 'OWNER';
    case MANAGER = 'MANAGER';
    case CASHIER = 'CASHIER';
    case WAREHOUSE = 'WAREHOUSE';

    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'Super Admin',
            self::OWNER => 'Owner / Pemilik',
            self::MANAGER => 'Manager Toko',
            self::CASHIER => 'Kasir',
            self::WAREHOUSE => 'Staf Gudang',
        };
    }
}
