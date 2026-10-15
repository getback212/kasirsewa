<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * Restore data SATU tenant dari file backup tenant (db:backup-tenant).
 *
 * Hanya memproses file milik tenant yang diminta (nama file + header
 * diverifikasi) dan hanya menghapus/menulis ulang baris milik tenant itu.
 * Data tenant lain dan baris global (tenants, companies) tidak disentuh.
 * Berjalan driver-agnostik (tanpa psql/COPY) sehingga bisa diuji di sqlite.
 */
class TenantRestoreCommand extends Command
{
    protected $signature = 'db:restore-tenant {filename : Path relatif file .sql.gz di storage/app/private} {--tenant= : ID tenant pemilik file}';
    protected $description = 'Memulihkan data satu tenant dari file backup tenant (format COPY SQL .sql.gz)';

    /** Tabel yang boleh di-restore, urutan hapus (anak dulu). */
    protected const DELETE_ORDER = [
        'sales_return_items', 'invoice_items', 'purchase_items', 'payments',
        'sale_items', 'held_transaction_items', 'stock_opname_items',
        'stock_transfer_items', 'product_tiered_prices', 'sales_returns',
        'cash_movements', 'held_transactions', 'invoices', 'purchases', 'sales',
        'stock_movements', 'stocks', 'stock_opnames', 'stock_transfers',
        'shifts', 'expenses', 'discounts', 'subscriptions', 'saas_payments',
        'notifications', 'audit_logs', 'customers', 'suppliers', 'products',
        'units', 'categories', 'outlets', 'users',
    ];

    public function handle(): int
    {
        $tenantId = (int) $this->option('tenant');
        if ($tenantId <= 0 || ! DB::table('tenants')->where('id', $tenantId)->exists()) {
            $this->error("Tenant #{$this->option('tenant')} tidak ditemukan.");
            return Command::FAILURE;
        }

        $relative = $this->argument('filename');
        $expectedDir = "backups/tenants/tenant_{$tenantId}/";
        $baseName = is_string($relative) ? basename($relative) : '';

        // File wajib berada di direktori tenant & bernama pola backup tenant.
        if (! is_string($relative) || $relative === ''
            || str_contains($relative, '..')
            || str_starts_with($relative, '/')
            || str_contains($relative, "\0")
            || ! str_starts_with($relative, $expectedDir)
            || ! preg_match('/^tenant_' . $tenantId . '_backup_.+\.sql(\.gz)?$/', $baseName)
        ) {
            $this->error('File backup tidak valid untuk tenant ini.');
            return Command::FAILURE;
        }

        // Resolve lewat Storage facade agar konsisten saat disk di-fake dalam testing.
        $disk = Storage::disk('local');
        if (! $disk->exists($relative)) {
            $this->error('File backup tidak ditemukan.');
            return Command::FAILURE;
        }

        $diskRoot = realpath($disk->path('.'));
        $fullPath = realpath($disk->path($relative));
        if ($fullPath === false || $diskRoot === false
            || ! str_starts_with($fullPath, $diskRoot . DIRECTORY_SEPARATOR)
        ) {
            $this->error('File backup tidak valid.');
            return Command::FAILURE;
        }

        try {
            $parsed = self::parseFile($fullPath);
        } catch (\RuntimeException $e) {
            $this->error($e->getMessage());
            return Command::FAILURE;
        }

        if ($parsed['header_tenant_id'] !== $tenantId || ! $parsed['is_tenant_backup']) {
            $this->error('File backup bukan milik tenant ini.');
            return Command::FAILURE;
        }

        $blocks = $parsed['blocks'];
        if (empty($blocks)) {
            $this->error('File backup tidak berisi data tenant yang valid.');
            return Command::FAILURE;
        }

        // Validasi isi SEBELUM transaksi: tolak file racikan yang menyelipkan
        // baris milik tenant lain (antisipasi upload file tenant yang diedit).
        $contentError = self::validateBelongsToTenant($parsed, $tenantId);
        if ($contentError !== null) {
            $this->error($contentError);
            return Command::FAILURE;
        }

        $restoredRows = 0;
        DB::transaction(function () use ($tenantId, $blocks, &$restoredRows) {
            $this->deleteTenantRows($tenantId);

            // File ditulis parent-first saat backup, jadi impor berurutan aman.
            foreach ($blocks as $table => $data) {
                foreach (array_chunk($data['rows'], 500) as $chunk) {
                    DB::table($table)->insert($chunk);
                    $restoredRows += count($chunk);
                }
            }
        });

        $this->fixSequences(array_keys($blocks));

        $this->info("Restore tenant #{$tenantId} berhasil: {$restoredRows} baris dari " . basename($fullPath));

        return Command::SUCCESS;
    }

    /**
     * Parse file backup tenant tanpa memeriksa kepemilikan.
     *
     * @return array{is_tenant_backup: bool, header_tenant_id: ?int, blocks: array<string, array{columns: list<string>, rows: list<array<string, mixed>>}>}
     */
    public static function parseFile(string $fullPath): array
    {
        $isGz = str_ends_with($fullPath, '.gz');
        $handle = $isGz ? @gzopen($fullPath, 'rb') : @fopen($fullPath, 'rb');
        if ($handle === false) {
            throw new \RuntimeException('File backup tidak bisa dibaca.');
        }

        $readLine = fn () => $isGz ? gzgets($handle) : fgets($handle);

        $headerTenantId = null;
        $isTenantBackup = false;
        $blocks = [];
        $currentTable = null;
        $currentColumns = [];

        try {
            while (($line = $readLine()) !== false) {
                $line = rtrim($line, "\r\n");

                if (str_starts_with($line, '-- KasirSewa tenant backup')) {
                    $isTenantBackup = true;
                    continue;
                }
                if (preg_match('/^-- tenant_id: (\d+)$/', $line, $m)) {
                    $headerTenantId = (int) $m[1];
                    continue;
                }
                if (str_starts_with($line, '--') || $line === '') {
                    continue;
                }

                if ($currentTable === null) {
                    if (preg_match('/^COPY "([^"]+)" \((.+)\) FROM stdin;$/', $line, $m)) {
                        $table = $m[1];
                        if (! in_array($table, self::DELETE_ORDER, true)) {
                            // Blok global (tenants/companies) atau tak dikenal: lewati.
                            self::skipBlock($readLine);
                            continue;
                        }
                        $currentTable = $table;
                        $currentColumns = array_map(
                            fn ($c) => trim(trim($c), '"'),
                            explode('", "', trim($m[2], '"'))
                        );
                        $blocks[$currentTable] = ['columns' => $currentColumns, 'rows' => []];
                    }
                    continue;
                }

                if ($line === '\.') {
                    $currentTable = null;
                    $currentColumns = [];
                    continue;
                }

                $fields = explode("\t", $line);
                if (count($fields) !== count($currentColumns)) {
                    throw new \RuntimeException("Format file backup rusak pada tabel {$currentTable}.");
                }
                $blocks[$currentTable]['rows'][] = array_combine(
                    $currentColumns,
                    array_map([self::class, 'unescapeValue'], $fields)
                );
            }
        } finally {
            $isGz ? gzclose($handle) : fclose($handle);
        }

        return [
            'is_tenant_backup' => $isTenantBackup,
            'header_tenant_id' => $headerTenantId,
            'blocks' => $blocks,
        ];
    }

    /**
     * Pastikan SELURUH isi file hanya milik tenant yang diminta.
     * Mengembalikan pesan error, atau null bila valid. Dipakai saat restore
     * dan saat Owner meng-upload file (file racikan langsung ditolak).
     */
    public static function validateBelongsToTenant(array $parsed, int $tenantId): ?string
    {
        if (! $parsed['is_tenant_backup'] || $parsed['header_tenant_id'] !== $tenantId) {
            return 'File backup bukan milik tenant ini.';
        }

        $blocks = $parsed['blocks'];

        // 1. Setiap baris bertenant_id wajib milik tenant ini.
        foreach ($blocks as $table => $data) {
            if (! in_array('tenant_id', $data['columns'], true)) {
                continue;
            }
            foreach ($data['rows'] as $row) {
                if ((string) ($row['tenant_id'] ?? '') !== (string) $tenantId) {
                    return "File backup mengandung baris {$table} milik tenant lain. File ditolak.";
                }
            }
        }

        // 2. Baris anak wajib menunjuk induk milik tenant ini (di file yang
        // sama atau yang sudah ada di database tenant ini).
        $pools = self::tenantIdPools($tenantId, $blocks);

        $parentChecks = [
            'sale_items' => ['sale_id' => 'sales', 'product_id' => 'products'],
            'payments' => ['sale_id' => 'sales'],
            'purchase_items' => ['purchase_id' => 'purchases', 'product_id' => 'products'],
            'invoice_items' => ['invoice_id' => 'invoices'],
            'held_transaction_items' => ['held_transaction_id' => 'held_transactions', 'product_id' => 'products'],
            'sales_return_items' => ['sales_return_id' => 'sales_returns', 'sale_item_id' => 'sale_items', 'product_id' => 'products'],
            'stock_opname_items' => ['stock_opname_id' => 'stock_opnames', 'product_id' => 'products'],
            'stock_transfer_items' => ['stock_transfer_id' => 'stock_transfers', 'product_id' => 'products'],
            'product_tiered_prices' => ['product_id' => 'products'],
            'sales_returns' => ['outlet_id' => 'outlets', 'sale_id' => 'sales'],
            'cash_movements' => ['shift_id' => 'shifts', 'user_id' => 'users'],
        ];

        foreach ($parentChecks as $table => $columns) {
            if (! isset($blocks[$table])) {
                continue;
            }
            foreach ($blocks[$table]['rows'] as $row) {
                foreach ($columns as $column => $parentTable) {
                    $value = $row[$column] ?? null;
                    if ($value === null || $value === '') {
                        continue;
                    }
                    if (! in_array((string) $value, $pools[$parentTable] ?? [], true)) {
                        return "File backup mengandung baris {$table} yang menunjuk data milik tenant lain. File ditolak.";
                    }
                }
            }
        }

        return null;
    }

    /**
     * Kumpulan id yang sah milik tenant: dari file + dari database saat ini.
     *
     * @return array<string, list<string>>
     */
    protected static function tenantIdPools(int $tenantId, array $blocks): array
    {
        $dumpIds = function (string $table) use ($blocks): array {
            if (! isset($blocks[$table]) || ! in_array('id', $blocks[$table]['columns'], true)) {
                return [];
            }
            return array_map(strval(...), array_column($blocks[$table]['rows'], 'id'));
        };

        $pluck = fn ($table, $where) => DB::table($table)->where(...$where)->pluck('id')->map(strval(...))->all();

        $outletIds = $pluck('outlets', ['tenant_id', $tenantId]);
        $userIds = $pluck('users', ['tenant_id', $tenantId]);
        $saleIds = $pluck('sales', ['tenant_id', $tenantId]);
        $purchaseIds = $pluck('purchases', ['tenant_id', $tenantId]);
        $invoiceIds = $pluck('invoices', ['tenant_id', $tenantId]);
        $heldIds = $pluck('held_transactions', ['tenant_id', $tenantId]);
        $opnameIds = $pluck('stock_opnames', ['tenant_id', $tenantId]);
        $transferIds = $pluck('stock_transfers', ['tenant_id', $tenantId]);
        $productIds = $pluck('products', ['tenant_id', $tenantId]);
        $shiftIds = $pluck('shifts', ['tenant_id', $tenantId]);
        $saleItemIds = DB::table('sale_items')->whereIn('sale_id', $saleIds)->pluck('id')->map(strval(...))->all();
        $returnIds = DB::table('sales_returns')
            ->whereIn('outlet_id', $outletIds)
            ->orWhereIn('sale_id', $saleIds)
            ->pluck('id')->map(strval(...))->all();

        $merge = fn (array $a, array $b) => array_values(array_unique(array_merge($a, $b)));

        return [
            'sales' => $merge($saleIds, $dumpIds('sales')),
            'purchases' => $merge($purchaseIds, $dumpIds('purchases')),
            'invoices' => $merge($invoiceIds, $dumpIds('invoices')),
            'held_transactions' => $merge($heldIds, $dumpIds('held_transactions')),
            'stock_opnames' => $merge($opnameIds, $dumpIds('stock_opnames')),
            'stock_transfers' => $merge($transferIds, $dumpIds('stock_transfers')),
            'products' => $merge($productIds, $dumpIds('products')),
            'shifts' => $merge($shiftIds, $dumpIds('shifts')),
            'outlets' => $merge($outletIds, $dumpIds('outlets')),
            'users' => $merge($userIds, $dumpIds('users')),
            'sale_items' => $merge($saleItemIds, $dumpIds('sale_items')),
            'sales_returns' => $merge($returnIds, $dumpIds('sales_returns')),
        ];
    }

    protected static function skipBlock(callable $readLine): void
    {
        while (($line = $readLine()) !== false) {
            if (rtrim($line, "\r\n") === '\.') {
                return;
            }
        }
    }

    protected static function unescapeValue(string $value): mixed
    {
        if ($value === '\N') {
            return null;
        }

        return str_replace(['\\\\', '\t', '\n', '\r'], ['\\', "\t", "\n", "\r"], $value);
    }

    protected function deleteTenantRows(int $tenantId): void
    {
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

        $t = fn (string $table) => DB::table($table)->where('tenant_id', $tenantId);

        $deletes = [
            'sales_return_items' => DB::table('sales_return_items')->whereIn('sales_return_id', $returnIds),
            'invoice_items' => DB::table('invoice_items')->whereIn('invoice_id', $invoiceIds),
            'purchase_items' => DB::table('purchase_items')->whereIn('purchase_id', $purchaseIds),
            'payments' => DB::table('payments')->whereIn('sale_id', $saleIds),
            'sale_items' => DB::table('sale_items')->whereIn('sale_id', $saleIds),
            'held_transaction_items' => DB::table('held_transaction_items')->whereIn('held_transaction_id', $heldIds),
            'stock_opname_items' => DB::table('stock_opname_items')->whereIn('stock_opname_id', $opnameIds),
            'stock_transfer_items' => DB::table('stock_transfer_items')->whereIn('stock_transfer_id', $transferIds),
            'product_tiered_prices' => DB::table('product_tiered_prices')->whereIn('product_id', $productIds),
            'sales_returns' => DB::table('sales_returns')->whereIn('id', $returnIds),
            'cash_movements' => DB::table('cash_movements')->whereIn('shift_id', $shiftIds)->orWhereIn('user_id', $userIds),
            'held_transactions' => $t('held_transactions'),
            'invoices' => $t('invoices'),
            'purchases' => $t('purchases'),
            'sales' => $t('sales'),
            'stock_movements' => $t('stock_movements'),
            'stocks' => $t('stocks'),
            'stock_opnames' => $t('stock_opnames'),
            'stock_transfers' => $t('stock_transfers'),
            'shifts' => $t('shifts'),
            'expenses' => $t('expenses'),
            'discounts' => $t('discounts'),
            'subscriptions' => $t('subscriptions'),
            'saas_payments' => $t('saas_payments'),
            'notifications' => $t('notifications'),
            'audit_logs' => $t('audit_logs'),
            'customers' => $t('customers'),
            'suppliers' => $t('suppliers'),
            'products' => $t('products'),
            'units' => $t('units'),
            'categories' => $t('categories'),
            'outlets' => $t('outlets'),
            'users' => $t('users'),
        ];

        foreach (self::DELETE_ORDER as $table) {
            if (! isset($deletes[$table])) {
                continue;
            }
            try {
                $deletes[$table]->delete();
            } catch (\Throwable) {
                // Tabel/kolom tak ada di skema ini: lewati.
            }
        }
    }

    /** Majukan sequence PK agar insert berikutnya tidak tabrakan id (pgsql). */
    protected function fixSequences(array $tables): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($tables as $table) {
            try {
                if (! Schema::hasColumn($table, 'id')) {
                    continue;
                }
                DB::statement("SELECT setval('{$table}_id_seq', (SELECT COALESCE(MAX(id), 1) FROM \"{$table}\"))");
            } catch (\Throwable) {
                // Sequence tak ada / tabel tak ada: abaikan.
            }
        }
    }
}
