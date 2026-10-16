<?php

namespace App\Support;

use App\Models\User;
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
 *
 * A sequence is only ever raised, never lowered. Rewinding it to max(id) after
 * rows were deleted makes the next INSERT reuse a dead row's id — and the
 * polymorphic pivots that hang off that id (model_has_roles,
 * model_has_permissions) are NOT removed when the user is deleted, so a
 * brand-new account silently inherits the old one's roles.
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

                if ($maxId < 1) {
                    continue;
                }

                $target = self::sequenceTarget($maxId, self::currentSequenceValue($sequence));

                DB::statement('SELECT setval(?, ?, true)', [$sequence, $target]);
            }
        } catch (\Throwable $e) {
            // Best effort: never let sequence maintenance break boot.
        }
    }

    /**
     * The value to write to a sequence: never below what the sequence already
     * handed out, so an id is never reused across the table's lifetime.
     */
    public static function sequenceTarget(int $maxId, int $currentValue): int
    {
        return max($maxId, $currentValue);
    }

    /**
     * Removes role/permission assignments whose owning user no longer exists.
     *
     * Deleting a user leaves these polymorphic pivot rows behind (Spatie never
     * cascades them, and there is no FK on model_id). They are inert until an
     * id gets reused — at which point the new account inherits them.
     */
    public static function purgeOrphanedRoleAssignments(): int
    {
        if (! Schema::hasTable('users')) {
            return 0;
        }

        $userMorph = (new User)->getMorphClass();
        $purged = 0;

        foreach (['model_has_roles', 'model_has_permissions'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $purged += DB::table($table)
                ->where('model_type', $userMorph)
                ->whereNotIn('model_id', DB::table('users')->select('id'))
                ->delete();
        }

        return $purged;
    }

    /**
     * Last value a sequence handed out. Sequences that never produced a value
     * report `is_called = false`, in which case there is nothing to preserve.
     */
    private static function currentSequenceValue(string $sequence): int
    {
        try {
            // $sequence is returned by pg_get_serial_sequence(), never by user
            // input, so interpolating it as an identifier is safe.
            $row = DB::selectOne("SELECT last_value, is_called FROM {$sequence}");

            return ($row && $row->is_called) ? (int) $row->last_value : 0;
        } catch (\Throwable $e) {
            return 0;
        }
    }
}
