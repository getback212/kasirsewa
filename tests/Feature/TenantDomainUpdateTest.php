<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\Company;
use App\Models\User;
use App\Enums\UserRole;
use Tests\TestCase;

class TenantDomainUpdateTest extends TestCase
{
    public function test_owner_can_update_subdomain_and_custom_domain_successfully()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $tenant = Tenant::create([
            'name' => 'Toko Subdomain Test',
            'slug' => 'toko-subdomain-test',
            'domain' => 'toko-subdomain-test.superbackend.my.id',
            'status' => 'active',
        ]);

        $company = Company::create([
            'tenant_id' => $tenant->id,
            'name' => 'Toko Subdomain Test',
        ]);

        $owner = User::factory()->create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
        ]);
        $owner->assignRole(UserRole::OWNER->value);

        // Owner updates domain/subdomain
        $response = $this->actingAs($owner)->withSession(['active_tenant_id' => $tenant->id])->post('/outlets/domain', [
            'domain' => 'berkah-retail.superbackend.my.id',
        ]);

        $response->assertRedirect();

        $tenant->refresh();
        $this->assertEquals('berkah-retail.superbackend.my.id', $tenant->domain);
    }
}
