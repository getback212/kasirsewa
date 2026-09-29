<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\Company;
use App\Models\User;
use App\Models\Supplier;
use App\Enums\UserRole;
use Tests\TestCase;

class SupplierCreationTest extends TestCase
{
    public function test_owner_role_can_create_supplier_successfully()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $tenant = Tenant::create([
            'name' => 'Toko Supplier Test',
            'slug' => 'toko-supplier-test',
            'status' => 'active',
        ]);

        $company = Company::create([
            'tenant_id' => $tenant->id,
            'name' => 'Toko Supplier Test',
        ]);

        $owner = User::factory()->create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
        ]);
        $owner->assignRole(UserRole::OWNER->value);

        // Owner creates supplier with code SUPP-001
        $response = $this->actingAs($owner)->post('/suppliers', [
            'code' => 'SUPP-001',
            'name' => 'PT Distributor Sembako Nusantara',
            'phone' => '081234567890',
            'email' => 'supplier@example.com',
            'address' => 'Jl. Industri Sembako No. 12',
        ]);

        $response->assertRedirect();

        $supplier = Supplier::where('code', 'SUPP-001')->where('tenant_id', $tenant->id)->first();
        $this->assertNotNull($supplier);
        $this->assertEquals('PT Distributor Sembako Nusantara', $supplier->name);
    }
}
