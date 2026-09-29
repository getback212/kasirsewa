<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\User;
use App\Enums\UserRole;
use Tests\TestCase;

class StaffUserUpdateTest extends TestCase
{
    public function test_owner_can_update_staff_without_changing_password()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $tenant = Tenant::create(['name' => 'Toko Staff Update Test', 'slug' => 'toko-staff-update-test', 'status' => 'active']);
        $company = Company::create(['tenant_id' => $tenant->id, 'name' => 'Toko Staff Update Test']);
        $outlet = Outlet::create(['company_id' => $company->id, 'tenant_id' => $tenant->id, 'code' => 'OUT-77', 'name' => 'Outlet Staff Test', 'is_active' => true]);

        $owner = User::factory()->create(['company_id' => $company->id, 'tenant_id' => $tenant->id, 'outlet_id' => $outlet->id, 'email_verified_at' => now()]);
        $owner->assignRole(UserRole::OWNER->value);

        $staff = User::factory()->create(['company_id' => $company->id, 'tenant_id' => $tenant->id, 'outlet_id' => $outlet->id, 'name' => 'Staff Kasir Lama']);
        $staff->assignRole(UserRole::CASHIER->value);

        // Owner updates staff name and role without filling password field
        $response = $this->actingAs($owner)->withSession(['active_tenant_id' => $tenant->id])->put("/users/{$staff->id}", [
            'name' => 'Staff Kasir Baru Ter-Update',
            'email' => $staff->email,
            'role' => UserRole::MANAGER->value,
            'outlet_id' => $outlet->id,
            'is_active' => true,
        ]);

        $response->assertRedirect();

        $staff->refresh();
        $this->assertEquals('Staff Kasir Baru Ter-Update', $staff->name);
        $this->assertTrue($staff->hasRole(UserRole::MANAGER->value));
    }
}
