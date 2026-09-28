<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Enums\UserRole;
use Tests\TestCase;

class TenantImpersonationTest extends TestCase
{
    public function test_super_admin_can_impersonate_and_stop_impersonating_tenant()
    {
        $superAdmin = User::factory()->create(['tenant_id' => null]);
        $superAdmin->assignRole(UserRole::SUPER_ADMIN->value);

        $tenant = Tenant::first() ?? Tenant::create([
            'name' => 'Toko Impersonate Test',
            'slug' => 'toko-impersonate-test',
            'status' => 'active',
        ]);

        // 1. Super Admin impersonates tenant
        $response = $this->actingAs($superAdmin)->post("/admin/tenants/{$tenant->id}/impersonate");
        $response->assertRedirect('/dashboard');
        $this->assertEquals($tenant->id, session('active_tenant_id'));

        // 2. Super Admin stops impersonating
        $response = $this->actingAs($superAdmin)->post('/admin/tenants/stop-impersonate');
        $response->assertRedirect('/admin/dashboard');
        $this->assertNull(session('active_tenant_id'));
    }
}
