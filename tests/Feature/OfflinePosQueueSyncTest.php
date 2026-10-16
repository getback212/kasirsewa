<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Stock;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Tests\TestCase;

class OfflinePosQueueSyncTest extends TestCase
{
    public function test_offline_buffered_transactions_can_be_synced_to_server_on_reconnection()
    {
        $this->seed(RolePermissionSeeder::class);

        $plan = Plan::firstOrCreate(['slug' => 'starter-basic'], ['name' => 'Starter Basic', 'monthly_price' => 99000, 'yearly_price' => 990000, 'max_stores' => 1, 'max_users' => 3, 'max_products' => 500, 'max_transactions' => 3000, 'is_active' => true]);
        $tenant = Tenant::create(['name' => 'Toko Offline Sync Test', 'slug' => 'toko-offline-sync-test', 'status' => 'active']);
        $company = Company::create(['tenant_id' => $tenant->id, 'name' => 'Toko Offline Sync Test']);
        $outlet = Outlet::create(['company_id' => $company->id, 'tenant_id' => $tenant->id, 'code' => 'OUT-88', 'name' => 'Outlet Offline Test', 'is_active' => true]);
        Subscription::create(['tenant_id' => $tenant->id, 'plan_id' => $plan->id, 'status' => 'trial', 'billing_cycle' => 'monthly', 'starts_at' => now(), 'expires_at' => now()->addDays(7)]);

        $owner = User::factory()->create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'email_verified_at' => now(),
        ]);
        $owner->assignRole(UserRole::OWNER->value);

        $product = Product::create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'sku' => 'PROD-OFF-01',
            'name' => 'Kopi Offline Espresso',
            'purchase_price' => 5000,
            'selling_price' => 15000,
            'minimum_stock' => 5,
            'is_active' => true,
        ]);

        Stock::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'product_id' => $product->id,
            'quantity' => 100,
        ]);

        // Simulating auto-syncing an offline payload buffered during connection loss
        $offlinePayload = [
            'customer_id' => null,
            'subtotal' => 30000,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'grand_total' => 30000,
            'paid_amount' => 50000,
            'change_amount' => 20000,
            'payments' => [['method' => 'cash', 'amount' => 50000]],
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'price' => 15000,
                    'discount_amount' => 0,
                    'subtotal' => 30000,
                ],
            ],
        ];

        $response = $this->actingAs($owner)->withSession(['active_tenant_id' => $tenant->id, 'active_outlet_id' => $outlet->id])
            ->postJson('/pos/checkout', $offlinePayload);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);

        $sale = Sale::where('tenant_id', $tenant->id)->first();
        $this->assertNotNull($sale);
        $this->assertEquals(30000, $sale->grand_total);
    }
}
