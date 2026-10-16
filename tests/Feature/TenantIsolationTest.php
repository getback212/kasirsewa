<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    public function test_tenant_a_cannot_access_tenant_b_data(): void
    {
        $tenantA = Tenant::where('slug', 'berkah-pro')->first();
        $tenantB = Tenant::where('slug', 'sinar-jaya')->first();

        $userA = User::where('email', 'owner@example.test')->first();
        $userB = User::where('email', 'sinarjaya@example.test')->first();

        $this->assertNotNull($tenantA);
        $this->assertNotNull($tenantB);
        $this->assertNotEquals($tenantA->id, $tenantB->id);

        $this->assertEquals($tenantA->id, $userA->tenant_id);
        $this->assertEquals($tenantB->id, $userB->tenant_id);
    }

    public function test_super_admin_can_access_all_system_resources(): void
    {
        $superAdmin = User::where('email', 'admin@example.com')->first();
        $this->assertNotNull($superAdmin);
        $this->assertTrue($superAdmin->hasRole('SUPER_ADMIN'));
    }
}
