<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. TENANTS TABLE
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('domain')->nullable()->unique();
            $table->enum('status', ['active', 'past_due', 'grace_period', 'suspended', 'expired', 'cancelled'])->default('active');
            $table->foreignId('owner_id')->nullable(); // Set after owner user created
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. PLANS TABLE
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('monthly_price', 15, 2)->default(0.00);
            $table->decimal('yearly_price', 15, 2)->default(0.00);
            $table->integer('max_users')->default(3);
            $table->integer('max_stores')->default(1);
            $table->integer('max_products')->default(500);
            $table->integer('max_transactions')->default(5000);
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. SUBSCRIPTIONS TABLE
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('plans')->onDelete('cascade');
            $table->enum('status', [
                'trial', 'pending', 'active', 'past_due', 'grace_period', 'suspended', 'expired', 'cancelled'
            ])->default('trial');
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('grace_until')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->timestamps();
        });

        // 4. INVOICES TABLE
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->onDelete('set null');
            $table->foreignId('plan_id')->nullable()->constrained('plans')->onDelete('set null');
            $table->decimal('subtotal', 15, 2)->default(0.00);
            $table->decimal('discount', 15, 2)->default(0.00);
            $table->decimal('tax', 15, 2)->default(0.00);
            $table->decimal('total', 15, 2)->default(0.00);
            $table->enum('status', ['draft', 'pending', 'paid', 'failed', 'expired', 'cancelled'])->default('pending');
            $table->timestamp('due_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // 5. INVOICE ITEMS TABLE
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->string('description');
            $table->decimal('amount', 15, 2)->default(0.00);
            $table->timestamps();
        });

        // 6. SAAS PAYMENTS TABLE (Subscription Payments)
        Schema::create('saas_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->string('payment_number')->unique();
            $table->string('payment_method')->default('manual_transfer'); // manual_transfer, gateway, qris
            $table->string('gateway_name')->nullable(); // midtrans, xendit, manual
            $table->string('gateway_transaction_id')->nullable();
            $table->decimal('amount', 15, 2)->default(0.00);
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });

        // 7. NOTIFICATIONS TABLE
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('type'); // email, whatsapp, in_app
            $table->string('title');
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        // 8. Add tenant_id & store_id columns to existing users & business tables
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('company_id')->constrained('tenants')->onDelete('cascade');
        });

        Schema::table('outlets', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('company_id')->constrained('tenants')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::dropIfExists('notifications');
        Schema::dropIfExists('saas_payments');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('tenants');
    }
};
