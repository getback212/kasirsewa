<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->onDelete('cascade');
            $table->foreignId('cashier_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->string('invoice_number')->unique();
            $table->decimal('subtotal', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0.00);
            $table->decimal('tax_amount', 15, 2)->default(0.00);
            $table->decimal('grand_total', 15, 2);
            $table->decimal('paid_amount', 15, 2);
            $table->decimal('change_amount', 15, 2)->default(0.00);
            $table->string('payment_status')->default('paid'); // paid, partial, unpaid
            $table->string('transaction_status')->default('completed'); // completed, void, refunded
            $table->timestamp('sale_date')->useCurrent();
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('product_name_snapshot');
            $table->string('sku_snapshot');
            $table->decimal('price_snapshot', 15, 2);
            $table->decimal('cost_price_snapshot', 15, 2)->default(0.00);
            $table->decimal('quantity', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0.00);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->string('payment_method'); // cash, qris, debit, credit, bank_transfer, ewallet
            $table->decimal('amount', 15, 2);
            $table->string('reference_number')->nullable();
            $table->string('status')->default('completed');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};
