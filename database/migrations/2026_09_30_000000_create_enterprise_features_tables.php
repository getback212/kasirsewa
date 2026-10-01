<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Discounts & Promos Table
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->onDelete('cascade');
            $table->string('code')->nullable();
            $table->string('name');
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 12, 2)->default(0); // e.g. 10 (%) or 5000 (Rp)
            $table->decimal('min_spend', 12, 2)->default(0);
            $table->decimal('max_discount', 12, 2)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Product Tiered Wholesale Prices Table
        Schema::create('product_tiered_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('min_qty');
            $table->decimal('price', 12, 2);
            $table->timestamps();
        });

        // 3. Add Points & Credit Limit to Customers Table
        Schema::table('customers', function (Blueprint $table) {
            $table->integer('points')->default(0)->after('address');
            $table->decimal('credit_balance', 12, 2)->default(0)->after('points'); // Current unpaid debt
            $table->decimal('credit_limit', 12, 2)->default(1000000)->after('credit_balance'); // Max debt limit
        });

        // 4. Add Points Used to Sales Table
        Schema::table('sales', function (Blueprint $table) {
            $table->string('discount_code')->nullable()->after('discount_amount');
            $table->integer('points_used')->default(0)->after('discount_code');
            $table->decimal('points_discount_amount', 12, 2)->default(0)->after('points_used');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['discount_code', 'points_used', 'points_discount_amount']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['points', 'credit_balance', 'credit_limit']);
        });

        Schema::dropIfExists('product_tiered_prices');
        Schema::dropIfExists('discounts');
    }
};
