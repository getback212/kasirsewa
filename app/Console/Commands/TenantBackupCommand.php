<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * Backup data milik SATU tenant saja (tanpa data tenant lain).
 *
 * Berbeda dengan db:backup (pg_dump seluruh database untuk Super Admin),
 * command ini mengekspor baris-baris milik tenant ke format COPY PostgreSQL
 * (data-only, .sql.gz) memakai query driver-agnostik sehingga aman dipanggil
 * dari akun Owner. File yang dihasilkan HANYA berisi data tenant tersebut.
 */
class TenantBackupCommand extends Command
{
    protected $signature = 'db:backup-tenant {--tenant= : ID tenant yang dibackup} {--path= : Subdirektori penyimpanan file backup}';
    protected $description = 'Membuat backup data satu tenant saja (format COPY SQL terkompresi .sql.gz)';

    public function handle(): int
    {
        $tenantId = (int) $this->option('tenant');
        if ($tenantId <= 0 || ! DB::table('tenants')->where('id', $tenantId)->exists()) {
            $this->error("Tenant #{$this->option('tenant')} tidak ditemukan.");
            return Command::FAILURE;
        }

        $customPath = preg_replace('/[^a-zA-Z0-9_\/-]/', '', (string) $this->option('path')) ?: 'backups';
        // Pakai Storage facade (bukan path mentah) agar bisa di-fake saat testing
        // dan tidak pernah menyentuh direktori di luar disk backup.
        $disk = Storage::disk('local');
        if (! $disk->exists($customPath) && ! $disk->makeDirectory($customPath)) {
            $this->error('Gagal membuat direktori backup (permission ditolak). Hubungi administrator server.');
            return Command::FAILURE;
        }
        // Pastikan direktori bisa dibaca user web meskipun command dijalankan
        // sebagai root (mis. via scheduler/queue container).
        @chmod($disk->path($customPath), 0755);

        $timestamp = now()->format('Y-m-d_H-i-s');
        $fileName = "tenant_{$tenantId}_backup_{$timestamp}.sql.gz";
        $gzFilePath = $disk->path("{$customPath}/{$fileName}");

        $handle = gzopen($gzFilePath, 'wb9');
        if ($handle === false) {
            $this->error('Gagal membuat file backup.');
            return Command::FAILURE;
        }

        $this->writeHeader($handle, $tenantId);

        // Kumpulkan ID relasi milik tenant terlebih dulu.
        $outletIds = DB::table('outlets')->where('tenant_id', $tenantId)->pluck('id')->all();
        $userIds = DB::table('users')->where('tenant_id', $tenantId)->pluck('id')->all();
        $saleIds = DB::table('sales')->where('tenant_id', $tenantId)->pluck('id')->all();
        $purchaseIds = DB::table('purchases')->where('tenant_id', $tenantId)->pluck('id')->all();
        $invoiceIds = DB::table('invoices')->where('tenant_id', $tenantId)->pluck('id')->all();
        $heldIds = DB::table('held_transactions')->where('tenant_id', $tenantId)->pluck('id')->all();
        $opnameIds = DB::table('stock_opnames')->where('tenant_id', $tenantId)->pluck('id')->all();
        $transferIds = DB::table('stock_transfers')->where('tenant_id', $tenantId)->pluck('id')->all();
        $productIds = DB::table('products')->where('tenant_id', $tenantId)->pluck('id')->all();
        $shiftIds = DB::table('shifts')->where('tenant_id', $tenantId)->pluck('id')->all();
        $returnIds = DB::table('sales_returns')
            ->whereIn('outlet_id', $outletIds)
            ->orWhereIn('sale_id', $saleIds)
            ->pluck('id')->all();
        $companyIds = array_values(array_unique(array_filter(array_merge(
            DB::table('outlets')->where('tenant_id', $tenantId)->pluck('company_id')->all(),
            DB::table('users')->where('tenant_id', $tenantId)->pluck('company_id')->all()
        ))));

        $t = fn (string $table) => DB::table($table)->where('tenant_id', $tenantId);

        $tables = [
            // Master tenant & company.
            ['tenants', DB::table('tenants')->where('id', $tenantId)],
            ['companies', DB::table('companies')->whereIn('id', $companyIds)],
            ['users', $t('users')],
            ['outlets', $t('outlets')],
            ['categories', $t('categories')],
            ['units', $t('units')],
            ['suppliers', $t('suppliers')],
            ['customers', $t('customers')],
            ['products', $t('products')],
            ['product_tiered_prices', DB::table('product_tiered_prices')->whereIn('product_id', $productIds)],
            // Transaksi penjualan & pembelian.
            ['sales', $t('sales')],
            ['sale_items', DB::table('sale_items')->whereIn('sale_id', $saleIds)],
            ['payments', DB::table('payments')->whereIn('sale_id', $saleIds)],
            ['purchases', $t('purchases')],
            ['purchase_items', DB::table('purchase_items')->whereIn('purchase_id', $purchaseIds)],
            ['sales_returns', DB::table('sales_returns')->whereIn('id', $returnIds)],
            ['sales_return_items', DB::table('sales_return_items')->whereIn('sales_return_id', $returnIds)],
            // Stok & shift kasir.
            ['shifts', $t('shifts')],
            ['cash_movements', DB::table('cash_movements')->whereIn('shift_id', $shiftIds)->orWhereIn('user_id', $userIds)],
            ['stock_movements', $t('stock_movements')],
            ['stocks', $t('stocks')],
            ['stock_opnames', $t('stock_opnames')],
            ['stock_opname_items', DB::table('stock_opname_items')->whereIn('stock_opname_id', $opnameIds)],
            ['stock_transfers', $t('stock_transfers')],
            ['stock_transfer_items', DB::table('stock_transfer_items')->whereIn('stock_transfer_id', $transferIds)],
            ['held_transactions', $t('held_transactions')],
            ['held_transaction_items', DB::table('held_transaction_items')->whereIn('held_transaction_id', $heldIds)],
            // Keuangan & langganan tenant.
            ['expenses', $t('expenses')],
            ['discounts', $t('discounts')],
            ['subscriptions', $t('subscriptions')],
            ['invoices', $t('invoices')],
            ['invoice_items', DB::table('invoice_items')->whereIn('invoice_id', $invoiceIds)],
            ['saas_payments', $t('saas_payments')],
            ['notifications', $t('notifications')],
            ['audit_logs', $t('audit_logs')],
        ];

        $totalRows = 0;
        foreach ($tables as [$table, $query]) {
            $totalRows += $this->exportTable($handle, $table, $query);
        }

        gzclose($handle);
        @chmod($gzFilePath, 0644);

        // Hapus file tenant lebih lama dari 30 hari (retensi sama seperti backup global).
        $cutoff = now()->subDays(30)->timestamp;
        foreach ($disk->files($customPath) as $file) {
            $base = basename($file);
            if ($base === $fileName || ! str_starts_with($base, "tenant_{$tenantId}_backup_")) {
                continue;
            }
            if ($disk->lastModified($file) < $cutoff) {
                $disk->delete($file);
            }
        }

        $size = number_format(($disk->size("{$customPath}/{$fileName}") ?: 0) / 1024, 2);
        $this->info("Backup tenant #{$tenantId} berhasil: {$fileName} ({$totalRows} baris, {$size} KB)");

        return Command::SUCCESS;
    }

    protected function writeHeader($handle, int $tenantId): void
    {
        $lines = [
            '-- KasirSewa tenant backup (DATA ONLY, format COPY PostgreSQL)',
            "-- tenant_id: {$tenantId}",
            '-- created_at: ' . now()->toDateTimeString(),
            '-- Berisi HANYA data milik tenant di atas, tanpa data tenant lain.',
            '-- Untuk restore darurat hubungi Super Admin (impor via psql dengan skema yang sama).',
            '',
        ];
        foreach ($lines as $line) {
            gzwrite($handle, $line . "\n");
        }
    }

    /**
     * @param mixed $handle
     */
    protected function exportTable($handle, string $table, $query): int
    {
        try {
            $columns = Schema::getColumnListing($table);
        } catch (\Throwable) {
            $this->warn("Tabel {$table} tidak ada, dilewati.");
            return 0;
        }

        if (empty($columns)) {
            return 0;
        }

        try {
            $count = (clone $query)->count();
        } catch (\Throwable) {
            $this->warn("Tabel {$table} tidak bisa dibaca, dilewati.");
            return 0;
        }

        if ($count === 0) {
            return 0;
        }

        $quoted = implode(', ', array_map(fn ($c) => '"' . str_replace('"', '""', $c) . '"', $columns));
        gzwrite($handle, "COPY \"{$table}\" ({$quoted}) FROM stdin;\n");

        $rows = 0;
        try {
            foreach ($query->orderBy('id')->cursor() as $row) {
                $values = [];
                foreach ($columns as $column) {
                    $values[] = $this->formatValue($row->{$column} ?? null);
                }
                gzwrite($handle, implode("\t", $values) . "\n");
                $rows++;
            }
        } catch (\Throwable) {
            // orderBy id gagal (mis. tabel tanpa kolom id): ulangi tanpa ordering.
            foreach ($query->cursor() as $row) {
                $values = [];
                foreach ($columns as $column) {
                    $values[] = $this->formatValue($row->{$column} ?? null);
                }
                gzwrite($handle, implode("\t", $values) . "\n");
                $rows++;
            }
        }

        gzwrite($handle, "\\.\n\n");

        return $rows;
    }

    protected function formatValue(mixed $value): string
    {
        if ($value === null) {
            return '\N';
        }
        if (is_bool($value)) {
            return $value ? 't' : 'f';
        }
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }
        if (is_array($value)) {
            $value = json_encode($value);
        }
        if (is_object($value)) {
            $value = method_exists($value, '__toString') ? (string) $value : json_encode($value);
        }

        return str_replace(
            ['\\', "\t", "\n", "\r"],
            ['\\\\', '\t', '\n', '\r'],
            (string) $value
        );
    }
}
