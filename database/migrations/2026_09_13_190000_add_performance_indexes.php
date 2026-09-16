<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->index(['outlet_id', 'transaction_status', 'sale_date'], 'sales_outlet_status_date_idx');
            $table->index(['cashier_id', 'sale_date'], 'sales_cashier_date_idx');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->index(['sale_id', 'product_id'], 'sale_items_sale_product_idx');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index(['sale_id', 'payment_method'], 'payments_sale_method_idx');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->index(['outlet_id', 'product_id', 'created_at'], 'stock_movements_outlet_prod_date_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['company_id', 'is_active', 'category_id'], 'products_company_active_cat_idx');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['company_id', 'action', 'created_at'], 'audit_logs_company_action_date_idx');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('audit_logs_company_action_date_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_company_active_cat_idx');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('stock_movements_outlet_prod_date_idx');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_sale_method_idx');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropIndex('sale_items_sale_product_idx');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('sales_outlet_status_date_idx');
            $table->dropIndex('sales_cashier_date_idx');
        });
    }
};
