<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Re-aligns PostgreSQL identity sequences with the current max(id) of each
 * table.
 *
 * Importing a dump (restore, clone to a new host) leaves the sequences behind,
 * so the next INSERT collides on the primary key. Fixing that walks every
 * table — `hasTable` + `pg_get_serial_sequence` + `max(id)`, roughly 75
 * queries plus a `setval` write each — so it must only ever run on the console.
 * Running it inside a web request costs ~0.5s per page load, and concurrent
 * `setval` calls race.
 */
final class PostgresSequenceHealer
{
    private const TABLES = [
        'companies', 'tenants', 'outlets', 'users', 'plans', 'subscriptions',
        'invoices', 'invoice_items', 'saas_payments', 'customers', 'categories',
        'units', 'products', 'stocks', 'suppliers', 'purchases', 'purchase_items',
        'sales', 'sale_items', 'payments', 'stock_movements', 'shifts',
        'cash_movements', 'expenses', 'audit_logs', 'notifications',
    ];

    public static function heal(): void
    {
        if (config('database.default') !== 'pgsql') {
            return;
        }

        try {
            foreach (self::TABLES as $table) {
                if (! Schema::hasTable($table)) {
                    continue;
                }

                $sequence = DB::selectOne("SELECT pg_get_serial_sequence(?, 'id') as seq_name", [$table])?->seq_name;

                if (! $sequence) {
                    continue;
                }

                $maxId = (int) (DB::table($table)->max('id') ?? 0);

                if ($maxId > 0) {
                    DB::statement('SELECT setval(?, ?, true)', [$sequence, $maxId]);
                }
            }
        } catch (\Throwable $e) {
            // Best effort: never let sequence maintenance break boot.
        }
    }
}
