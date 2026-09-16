<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductionWipeCommand extends Command
{
    protected $signature = 'db:production-wipe {--force : Jalankan pembersihan tanpa konfirmasi}';
    protected $description = 'Membersihkan seluruh data uji coba (penjualan, stok, faktur, shift, audit log) untuk persiapan produksi 100% bersih.';

    public function handle()
    {
        if (!$this->option('force') && !$this->confirm('⚠️ PERINGATAN BESAR!\n\nApakah Anda yakin ingin MENGHAPUS BERSIH seluruh data transaksi, stok, faktur restok, dan shift kasir dummy?\n\nTindakan ini tidak dapat dibatalkan!')) {
            $this->info('Proses pembersihan dibatalkan.');
            return 0;
        }

        $this->info('Memulai pembersihan data produksi...');

        $tables = [
            'shift_reconciliations',
            'shifts',
            'payments',
            'sale_items',
            'sales',
            'purchase_items',
            'purchases',
            'held_transaction_items',
            'held_transactions',
            'expenses',
            'stock_movements',
            'stock_opname_items',
            'stock_opnames',
            'stock_transfer_items',
            'stock_transfers',
            'audit_logs',
        ];

        DB::transaction(function () use ($tables) {
            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->delete();
                }
            }

            if (Schema::hasTable('stocks')) {
                DB::table('stocks')->update(['quantity' => 0.00]);
            }
        });

        $this->info('✅ SELURUH DATA TRANSAKSI & STOK BERHASIL DIBERSIHKAN 100%!');
        $this->info('Sistem POS kini 100% BERSIH dan SIAP DIPAKAI untuk operasional toko asli.');

        return 0;
    }
}
