<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Company;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Domain\TenantDomainProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TenantDomainProvisioningTest extends TestCase
{
    use RefreshDatabase;

    private function ownerFor(Tenant $tenant): User
    {
        $company = Company::create([
            'tenant_id' => $tenant->id,
            'name' => $tenant->name,
        ]);

        $owner = User::factory()->create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'is_active' => true,
        ]);
        $owner->assignRole(UserRole::OWNER->value);

        return $owner;
    }

    private function tenant(string $domain = 'toko-uji.superbackend.my.id'): Tenant
    {
        return Tenant::create([
            'name' => 'Toko Uji',
            'slug' => 'toko-uji',
            'domain' => $domain,
            'status' => 'active',
        ]);
    }

    public function test_classify_separates_saas_subdomains_from_custom_domains(): void
    {
        $provisioner = app(TenantDomainProvisioner::class);

        $this->assertSame(TenantDomainProvisioner::TYPE_SAAS, $provisioner->classify('toko.superbackend.my.id'));
        $this->assertSame(TenantDomainProvisioner::TYPE_CUSTOM, $provisioner->classify('tokoberkah.com'));
    }

    public function test_saving_a_saas_subdomain_activates_it_immediately(): void
    {
        $tenant = $this->tenant();
        $owner = $this->ownerFor($tenant);

        $this->actingAs($owner)
            ->withSession(['active_tenant_id' => $tenant->id])
            ->post('/outlets/domain', ['domain' => 'branding-baru.superbackend.my.id'])
            ->assertRedirect();

        $tenant->refresh();
        $this->assertSame('branding-baru.superbackend.my.id', $tenant->domain);
        $this->assertSame(TenantDomainProvisioner::TYPE_SAAS, $tenant->domain_type);
        $this->assertSame(TenantDomainProvisioner::STATUS_ACTIVE, $tenant->domain_status);
        $this->assertNotNull($tenant->domain_checked_at);
    }

    public function test_custom_domain_without_cloudflare_config_stays_pending_and_calls_nothing(): void
    {
        Http::fake();

        config()->set('services.cloudflare.api_token', null);
        config()->set('services.cloudflare.zone_id', null);

        $tenant = $this->tenant();
        $owner = $this->ownerFor($tenant);

        $this->actingAs($owner)
            ->withSession(['active_tenant_id' => $tenant->id])
            ->post('/outlets/domain', ['domain' => 'tokoberkah.com'])
            ->assertRedirect();

        $tenant->refresh();
        $this->assertSame('tokoberkah.com', $tenant->domain);
        $this->assertSame(TenantDomainProvisioner::TYPE_CUSTOM, $tenant->domain_type);
        // Fail-safe: never "active" when we cannot prove the certificate exists.
        $this->assertSame(TenantDomainProvisioner::STATUS_PENDING_DNS, $tenant->domain_status);
        $this->assertNull($tenant->custom_hostname_id);
        Http::assertNothingSent();
    }

    public function test_custom_domain_is_registered_with_cloudflare_when_configured(): void
    {
        config()->set('services.cloudflare.api_token', 'cf-token');
        config()->set('services.cloudflare.zone_id', 'zone-123');
        config()->set('services.cloudflare.custom_domain_target', 'customers.superbackend.my.id');

        Http::fake([
            'api.cloudflare.com/*' => Http::response([
                'success' => true,
                'result' => ['id' => 'ch_abc123', 'hostname' => 'tokoberkah.com', 'status' => 'pending', 'ssl' => ['status' => 'pending_validation']],
            ], 200),
        ]);

        $tenant = $this->tenant();
        $owner = $this->ownerFor($tenant);

        $this->actingAs($owner)
            ->withSession(['active_tenant_id' => $tenant->id])
            ->post('/outlets/domain', ['domain' => 'tokoberkah.com'])
            ->assertRedirect();

        $tenant->refresh();
        $this->assertSame('ch_abc123', $tenant->custom_hostname_id);
        $this->assertSame(TenantDomainProvisioner::STATUS_PENDING_DNS, $tenant->domain_status);
        $this->assertSame('customers.superbackend.my.id', $tenant->domain_dns_target);

        Http::assertSent(fn ($request) => str_contains($request->url(), '/custom_hostnames')
            && $request['hostname'] === 'tokoberkah.com');
    }

    public function test_refresh_promotes_custom_domain_to_active_when_cloudflare_confirms(): void
    {
        config()->set('services.cloudflare.api_token', 'cf-token');
        config()->set('services.cloudflare.zone_id', 'zone-123');

        $tenant = $this->tenant('tokoberkah.com');
        $tenant->forceFill([
            'domain_type' => TenantDomainProvisioner::TYPE_CUSTOM,
            'domain_status' => TenantDomainProvisioner::STATUS_PENDING_DNS,
            'custom_hostname_id' => 'ch_abc123',
        ])->save();

        $owner = $this->ownerFor($tenant);

        Http::fake([
            'api.cloudflare.com/*' => Http::response([
                'success' => true,
                'result' => ['id' => 'ch_abc123', 'hostname' => 'tokoberkah.com', 'status' => 'active', 'ssl' => ['status' => 'active']],
            ], 200),
        ]);

        $this->actingAs($owner)
            ->withSession(['active_tenant_id' => $tenant->id])
            ->post('/outlets/domain/refresh')
            ->assertRedirect();

        $this->assertSame(TenantDomainProvisioner::STATUS_ACTIVE, $tenant->refresh()->domain_status);
    }

    public function test_provisioning_failure_is_recorded_and_not_reported_as_active(): void
    {
        config()->set('services.cloudflare.api_token', 'cf-token');
        config()->set('services.cloudflare.zone_id', 'zone-123');

        Http::fake([
            'api.cloudflare.com/*' => Http::response([
                'success' => false,
                'errors' => [['code' => 1000, 'message' => 'nope']],
            ], 400),
        ]);

        $tenant = $this->tenant();
        $owner = $this->ownerFor($tenant);

        $this->actingAs($owner)
            ->withSession(['active_tenant_id' => $tenant->id])
            ->post('/outlets/domain', ['domain' => 'tokoberkah.com'])
            ->assertRedirect();

        $tenant->refresh();
        $this->assertSame(TenantDomainProvisioner::STATUS_FAILED, $tenant->domain_status);
        $this->assertNull($tenant->custom_hostname_id);
    }

    public function test_unverified_custom_domain_does_not_bind_a_tenant_session(): void
    {
        $tenant = $this->tenant('tokoberkah.com');
        $tenant->forceFill([
            'domain_type' => TenantDomainProvisioner::TYPE_CUSTOM,
            'domain_status' => TenantDomainProvisioner::STATUS_PENDING_DNS,
        ])->save();

        // A spoofed Host header for an unverified domain must not resolve: the
        // request lands on the main app (login redirect) with no tenant bound.
        $this->get('http://tokoberkah.com/')->assertRedirect(route('login'));
        $this->assertNull(session('active_tenant_id'));
    }

    public function test_verified_custom_domain_binds_the_tenant(): void
    {
        $tenant = $this->tenant('tokoberkah.com');
        $tenant->forceFill([
            'domain_type' => TenantDomainProvisioner::TYPE_CUSTOM,
            'domain_status' => TenantDomainProvisioner::STATUS_ACTIVE,
        ])->save();

        $this->get('http://tokoberkah.com/')->assertRedirect(route('login'));
        $this->assertSame($tenant->id, session('active_tenant_id'));
    }

    public function test_non_owner_cannot_change_the_domain(): void
    {
        $tenant = $this->tenant();
        $company = Company::create(['tenant_id' => $tenant->id, 'name' => $tenant->name]);

        $cashier = User::factory()->create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'is_active' => true,
        ]);
        $cashier->assignRole(UserRole::CASHIER->value);

        $this->actingAs($cashier)
            ->withSession(['active_tenant_id' => $tenant->id])
            ->post('/outlets/domain', ['domain' => 'diubah.superbackend.my.id'])
            ->assertForbidden();
    }

    public function test_reserved_subdomain_label_is_rejected(): void
    {
        $tenant = $this->tenant();
        $owner = $this->ownerFor($tenant);

        $this->actingAs($owner)
            ->withSession(['active_tenant_id' => $tenant->id])
            ->post('/outlets/domain', ['domain' => 'admin.superbackend.my.id'])
            ->assertSessionHasErrors('domain');

        $this->assertSame('toko-uji.superbackend.my.id', $tenant->refresh()->domain);
    }
}
