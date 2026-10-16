<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'categories', 'units', 'products', 'stocks', 'customers', 'suppliers',
            'purchases', 'sales', 'held_transactions', 'shifts',
            'expenses', 'stock_movements', 'stock_opnames', 'stock_transfers', 'audit_logs',
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && ! Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $table->foreignId('tenant_id')->nullable()->after('id')->constrained('tenants')->onDelete('cascade');
                    $table->index(['tenant_id'], "idx_{$tableName}_tenant_id");
                });
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'categories', 'units', 'products', 'stocks', 'customers', 'suppliers',
            'purchases', 'sales', 'held_transactions', 'shifts',
            'expenses', 'stock_movements', 'stock_opnames', 'stock_transfers', 'audit_logs',
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropForeign(['tenant_id']);
                    $table->dropColumn('tenant_id');
                });
            }
        }
    }
};
