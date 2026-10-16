<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Company;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Tests\TestCase;

class UnitManagementTest extends TestCase
{
    public function test_owner_can_create_and_manage_units()
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::create(['name' => 'Toko Unit Test', 'slug' => 'toko-unit-test', 'status' => 'active']);
        $company = Company::create(['tenant_id' => $tenant->id, 'name' => 'Toko Unit Test']);

        $owner = User::factory()->create(['company_id' => $company->id, 'tenant_id' => $tenant->id, 'email_verified_at' => now()]);
        $owner->assignRole(UserRole::OWNER->value);

        // 1. Can view units index page
        $response = $this->actingAs($owner)->withSession(['active_tenant_id' => $tenant->id])->get('/units');
        $response->assertStatus(200);

        // 2. Can create new unit (e.g. Kilogram / kg)
        $createResponse = $this->actingAs($owner)->withSession(['active_tenant_id' => $tenant->id])->post('/units', [
            'name' => 'Kilogram',
            'short_name' => 'kg',
        ]);
        $createResponse->assertRedirect();

        $unit = Unit::where('name', 'Kilogram')->first();
        $this->assertNotNull($unit);
        $this->assertEquals('kg', $unit->short_name);

        // 3. Can update unit
        $updateResponse = $this->actingAs($owner)->withSession(['active_tenant_id' => $tenant->id])->put("/units/{$unit->id}", [
            'name' => 'Kilogram Super',
            'short_name' => 'kg',
        ]);
        $updateResponse->assertRedirect();
        $this->assertEquals('Kilogram Super', $unit->fresh()->name);
    }
}
