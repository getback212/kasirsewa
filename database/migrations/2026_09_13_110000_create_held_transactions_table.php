<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('held_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->onDelete('cascade');
            $table->foreignId('cashier_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->string('reference_note')->nullable();
            $table->decimal('grand_total', 15, 2)->default(0.00);
            $table->timestamp('expired_at')->nullable();
            $table->timestamps();
        });

        Schema::create('held_transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('held_transaction_id')->constrained('held_transactions')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->decimal('quantity', 15, 2);
            $table->decimal('price', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0.00);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('held_transaction_items');
        Schema::dropIfExists('held_transactions');
    }
};
