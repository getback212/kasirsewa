<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\User;
use App\Enums\UserRole;
use Tests\TestCase;

class CrossDeviceCustomerDisplayTest extends TestCase
{
    public function test_cashier_can_broadcast_and_read_customer_display_state_across_devices()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $tenant = Tenant::create(['name' => 'Toko Dual Display Test', 'slug' => 'toko-dual-display-test', 'status' => 'active']);
        $company = Company::create(['tenant_id' => $tenant->id, 'name' => 'Toko Dual Display Test']);
        $outlet = Outlet::create(['company_id' => $company->id, 'tenant_id' => $tenant->id, 'code' => 'OUT-99', 'name' => 'Outlet Dual Display', 'is_active' => true]);

        $cashier = User::factory()->create(['company_id' => $company->id, 'tenant_id' => $tenant->id, 'outlet_id' => $outlet->id]);
        $cashier->assignRole(UserRole::CASHIER->value);

        // 1. Cashier posts broadcast state on device A
        $broadcastResponse = $this->actingAs($cashier)->post('/pos/customer-display/state', [
            'type' => 'CART_UPDATE',
            'items' => [
                ['product_id' => 1, 'name' => 'Kopi Susu Merdeka', 'price' => 15000, 'quantity' => 2, 'subtotal' => 30000]
            ],
            'subtotal' => 30000,
            'grandTotal' => 30000,
        ]);
        $broadcastResponse->assertJson(['status' => true]);

        // 2. Customer display on device B fetches state via GET API
        $getStateResponse = $this->actingAs($cashier)->get('/pos/customer-display/state');
        $getStateResponse->assertJsonFragment(['name' => 'Kopi Susu Merdeka', 'grandTotal' => 30000]);
    }
}
