<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_sku_unique');
            $table->dropUnique('products_barcode_unique');
            $table->unique(['tenant_id', 'sku'], 'products_tenant_id_sku_unique');
            $table->unique(['tenant_id', 'barcode'], 'products_tenant_id_barcode_unique');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_tenant_id_sku_unique');
            $table->dropUnique('products_tenant_id_barcode_unique');
            $table->unique('sku', 'products_sku_unique');
            $table->unique('barcode', 'products_barcode_unique');
        });
    }
};
