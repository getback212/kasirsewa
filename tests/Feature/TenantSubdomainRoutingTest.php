<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Tenant;
use App\Models\User;
use App\Enums\UserRole;
use App\Support\TenantDomain;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TenantSubdomainRoutingTest extends TestCase
{
    #[Test]
    public function it_normalizes_bare_subdomain_into_full_base_domain(): void
    {
        $this->assertSame('berkah-retail.superbackend.my.id', TenantDomain::normalize('Berkah-Retail'));
        $this->assertSame('berkah-retail.superbackend.my.id', TenantDomain::normalize('  https://berkah-retail.superbackend.my.id/  '));
        $this->assertNull(TenantDomain::normalize(null));
    }

    #[Test]
    public function it_rejects_reserved_invalid_and_ip_domains(): void
    {
        foreach (['www', 'admin', 'api', 'saas', 'superbackend.my.id', '127.0.0.1', 'bad_domain', 'sub domain'] as $bad) {
            try {
                TenantDomain::normalize($bad);
                $this->fail("Domain '{$bad}' seharusnya ditolak.");
            } catch (ValidationException $e) {
                $this->assertArrayHasKey('domain', $e->errors());
            }
        }
    }

    #[Test]
    public function tenant_subdomain_resolves_to_the_correct_tenant_context(): void
    {
        $tenant = Tenant::create([
            'name' => 'Toko Berkah',
            'slug' => 'toko-berkah',
            'domain' => 'berkah-retail.superbackend.my.id',
            'status' => 'active',
        ]);

        // Unauthenticated hit on a known tenant subdomain: the landing handler
        // redirects to login, and the resolver must have bound the tenant.
        $this->get('http://berkah-retail.superbackend.my.id/')
            ->assertRedirect(route('login'));

        $this->assertSame($tenant->id, session('active_tenant_id'));
    }

    #[Test]
    public function unknown_subdomain_returns_not_found(): void
    {
        // Unauthenticated request to an unknown subdomain should be 404
        $this->get('http://tidak-ada.superbackend.my.id/')->assertNotFound();
    }

    #[Test]
    public function user_cannot_access_another_tenants_subdomain(): void
    {
        $tenantA = Tenant::create(['name' => 'Toko A', 'slug' => 'toko-a', 'domain' => 'toko-a.superbackend.my.id', 'status' => 'active']);
        $tenantB = Tenant::create(['name' => 'Toko B', 'slug' => 'toko-b', 'domain' => 'toko-b.superbackend.my.id', 'status' => 'active']);

        $ownerA = User::factory()->create(['tenant_id' => $tenantA->id, 'is_active' => true]);
        $ownerA->assignRole(UserRole::OWNER->value);

        $this->actingAs($ownerA)
            ->get('http://toko-b.superbackend.my.id/dashboard')
            ->assertForbidden();
    }
}
