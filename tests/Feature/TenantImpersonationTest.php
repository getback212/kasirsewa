<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TenantImpersonationTest extends TestCase
{
    #[Test]
    public function super_admin_impersonates_the_tenants_owner_and_can_stop_impersonating(): void
    {
        $superAdmin = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
        $superAdmin->assignRole(UserRole::SUPER_ADMIN->value);

        $tenant = Tenant::factory()->create(['status' => 'active']);
        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'is_active' => true,
        ]);
        $owner->assignRole(UserRole::OWNER->value);
        $tenant->update(['owner_id' => $owner->id]);

        // 1. Super Admin becomes the actual owner identity.
        $response = $this->actingAs($superAdmin)->post("/admin/tenants/{$tenant->id}/impersonate");
        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($owner);
        $this->assertEquals($superAdmin->id, session('impersonator_id'));
        $this->assertEquals($tenant->id, session('active_tenant_id'));

        // 2. Stop restores the original super-admin identity.
        $response = $this->post('/admin/tenants/stop-impersonate');
        $response->assertRedirect('/admin/dashboard');
        $this->assertAuthenticatedAs($superAdmin);
        $this->assertNull(session('impersonator_id'));
        $this->assertNull(session('active_tenant_id'));
    }

    #[Test]
    public function super_admin_cannot_impersonate_a_tenant_without_an_active_owner(): void
    {
        $superAdmin = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
        $superAdmin->assignRole(UserRole::SUPER_ADMIN->value);
        $tenant = Tenant::factory()->create(['owner_id' => null]);

        $response = $this->actingAs($superAdmin)->post("/admin/tenants/{$tenant->id}/impersonate");

        $response->assertRedirect('/admin/tenants');
        $response->assertSessionHas('error');
        $this->assertAuthenticatedAs($superAdmin);
    }
}
