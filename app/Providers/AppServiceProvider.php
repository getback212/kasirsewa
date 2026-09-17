<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
            URL::forceScheme('https');
        } elseif (env('APP_ENV') === 'production') {
            URL::forceScheme('https');
        }

        // Auto-heal PostgreSQL sequences if sequence primary keys drift
        if (config('database.default') === 'pgsql') {
            try {
                $tables = [
                    'companies', 'tenants', 'outlets', 'users', 'plans', 'subscriptions',
                    'invoices', 'invoice_items', 'saas_payments', 'customers', 'categories',
                    'units', 'products', 'stocks', 'suppliers', 'purchases', 'purchase_items',
                    'sales', 'sale_items', 'payments', 'stock_movements', 'shifts',
                    'cash_movements', 'expenses', 'audit_logs', 'notifications'
                ];

                foreach ($tables as $table) {
                    if (Schema::hasTable($table)) {
                        $seq = DB::selectOne("SELECT pg_get_serial_sequence(?, 'id') as seq_name", [$table])?->seq_name;
                        if ($seq) {
                            $maxId = (int) (DB::table($table)->max('id') ?? 0);
                            if ($maxId > 0) {
                                DB::statement("SELECT setval(?, ?, true)", [$seq, $maxId]);
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Silently ignore during migration boot
            }
        }
    }
}
