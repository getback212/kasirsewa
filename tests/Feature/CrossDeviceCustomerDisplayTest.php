<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\User;
use App\Models\Plan;
use App\Models\Subscription;
use App\Enums\UserRole;
use Tests\TestCase;

class CrossDeviceCustomerDisplayTest extends TestCase
{
    public function test_guest_and_cashier_can_access_customer_display_and_read_state_without_login()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $plan = Plan::firstOrCreate(['slug' => 'starter-basic'], ['name' => 'Starter Basic', 'monthly_price' => 99000, 'yearly_price' => 990000, 'max_stores' => 1, 'max_users' => 3, 'max_products' => 500, 'is_active' => true]);
        $tenant = Tenant::create(['name' => 'Toko Dual Display Test', 'slug' => 'toko-dual-display-test', 'status' => 'active']);
        $company = Company::create(['tenant_id' => $tenant->id, 'name' => 'Toko Dual Display Test']);
        $outlet = Outlet::create(['company_id' => $company->id, 'tenant_id' => $tenant->id, 'code' => 'OUT-99', 'name' => 'Outlet Dual Display', 'is_active' => true]);
        Subscription::create(['tenant_id' => $tenant->id, 'plan_id' => $plan->id, 'status' => 'trial', 'billing_cycle' => 'monthly', 'starts_at' => now(), 'expires_at' => now()->addDays(7)]);

        $owner = User::factory()->create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'email_verified_at' => now(),
        ]);
        $owner->assignRole(UserRole::OWNER->value);

        // 1. Guest can access /pos/customer-display without login
        $guestPageResponse = $this->get('/pos/customer-display');
        $guestPageResponse->assertStatus(200);

        // 2. Owner posts broadcast state on device A
        $broadcastResponse = $this->actingAs($owner)->withSession(['active_tenant_id' => $tenant->id])->postJson('/pos/customer-display/state', [
            'type' => 'CART_UPDATE',
            'items' => [
                ['product_id' => 1, 'name' => 'Kopi Susu Merdeka', 'price' => 15000, 'quantity' => 2, 'subtotal' => 30000]
            ],
            'subtotal' => 30000,
            'grandTotal' => 30000,
        ]);
        $broadcastResponse->assertStatus(200);
        $broadcastResponse->assertJson(['status' => true]);

        // 3. Unauthenticated guest on device B reads state via GET API
        $getStateResponse = $this->getJson('/pos/customer-display/state?outlet_id=' . $outlet->id);
        $getStateResponse->assertStatus(200);
        $getStateResponse->assertJsonFragment(['name' => 'Kopi Susu Merdeka', 'grandTotal' => 30000]);
    }
}
