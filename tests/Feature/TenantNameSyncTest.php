<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\Outlet;
use App\Models\User;
use App\Enums\UserRole;
use Tests\TestCase;

class TenantNameSyncTest extends TestCase
{
    public function test_updating_outlet_name_syncs_tenant_name_for_super_admin()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $tenant = Tenant::create([
            'name' => 'Toko Lawas Google',
            'slug' => 'toko-lawas-google',
            'status' => 'active',
        ]);

        $company = \App\Models\Company::create([
            'tenant_id' => $tenant->id,
            'name' => 'Toko Lawas Google',
        ]);

        $outlet = Outlet::create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'code' => 'OUT-101',
            'name' => 'Toko Lawas Google',
            'is_active' => true,
        ]);

        $owner = User::factory()->create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
        ]);
        $owner->assignRole(UserRole::OWNER->value);

        // Update Outlet Name via StoreController / OutletController
        $response = $this->actingAs($owner)->put("/outlets/{$outlet->id}", [
            'code' => 'OUT-101',
            'name' => 'Toko Minimarket Abadi Jaya',
            'phone' => '081234567890',
            'address' => 'Jl. Merdeka No. 45',
            'tax_percentage' => 0,
            'enable_ppn' => false,
            'is_active' => true,
        ]);

        $response->assertRedirect();

        // Verify Tenant name updated in DB
        $this->assertEquals('Toko Minimarket Abadi Jaya', $tenant->fresh()->name);
    }
}
