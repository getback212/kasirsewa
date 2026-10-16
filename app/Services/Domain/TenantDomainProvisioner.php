<?php

namespace App\Services\Domain;

use App\Models\Tenant;
use App\Support\TenantDomain;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Decides how a tenant's public address becomes reachable.
 *
 * Two kinds of address exist:
 *
 *  - a **SaaS subdomain** (`toko.superbackend.my.id`): every name under the
 *    base domain is already covered by the wildcard DNS record and the tunnel
 *    ingress, so it is live the instant it is saved — nothing to provision.
 *
 *  - a **custom domain** (`tokoberkah.com`): the tenant owns the name, so TLS
 *    has to be issued for it. That is Cloudflare for SaaS custom hostnames.
 *    When no API token is configured we cannot do it, and we say so honestly
 *    (`pending_dns`) instead of pretending the domain is active.
 *
 * The class never marks a custom domain `active` unless Cloudflare reports it
 * so — a domain is only "working" when a certificate really exists.
 */
final class TenantDomainProvisioner
{
    public const TYPE_SAAS = 'saas_subdomain';

    public const TYPE_CUSTOM = 'custom';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_PENDING_DNS = 'pending_dns';

    public const STATUS_FAILED = 'failed';

    public const STATUS_NONE = 'none';

    public function classify(string $domain): string
    {
        return TenantDomain::isBaseHost($domain) ? self::TYPE_SAAS : self::TYPE_CUSTOM;
    }

    /** Cloudflare for SaaS provisioning requires an API token and a zone. */
    public function isConfigured(): bool
    {
        return filled(config('services.cloudflare.api_token'))
            && filled(config('services.cloudflare.zone_id'));
    }

    /** Hostname tenants point their custom domain's CNAME at, if configured. */
    public function dnsTarget(): ?string
    {
        $target = config('services.cloudflare.custom_domain_target');

        return filled($target) ? (string) $target : null;
    }

    public function provision(Tenant $tenant, string $domain): Tenant
    {
        if ($this->classify($domain) === self::TYPE_SAAS) {
            return $this->provisionSaasSubdomain($tenant, $domain);
        }

        return $this->provisionCustomDomain($tenant, $domain);
    }

    /** Re-read the live status (e.g. after the tenant created the CNAME). */
    public function refresh(Tenant $tenant): Tenant
    {
        if ($tenant->domain_type !== self::TYPE_CUSTOM
            || blank($tenant->custom_hostname_id)
            || ! $this->isConfigured()) {
            $tenant->forceFill(['domain_checked_at' => now()])->save();

            return $tenant;
        }

        $hostname = $this->fetchCustomHostname((string) $tenant->custom_hostname_id);

        $tenant->forceFill([
            'domain_status' => $hostname ? $this->mapStatus($hostname) : $tenant->domain_status,
            'domain_checked_at' => now(),
        ])->save();

        return $tenant;
    }

    private function provisionSaasSubdomain(Tenant $tenant, string $domain): Tenant
    {
        $tenant->forceFill([
            'domain' => $domain,
            'domain_type' => self::TYPE_SAAS,
            'domain_status' => self::STATUS_ACTIVE,
            'domain_dns_target' => $domain,
            'custom_hostname_id' => null,
            'domain_checked_at' => now(),
        ])->save();

        return $tenant;
    }

    private function provisionCustomDomain(Tenant $tenant, string $domain): Tenant
    {
        $attributes = [
            'domain' => $domain,
            'domain_type' => self::TYPE_CUSTOM,
            'domain_dns_target' => $this->dnsTarget(),
            'domain_checked_at' => now(),
        ];

        // No token: the CNAME is the tenant's job and we cannot issue a cert.
        if (! $this->isConfigured()) {
            $tenant->forceFill($attributes + [
                'domain_status' => self::STATUS_PENDING_DNS,
                'custom_hostname_id' => null,
            ])->save();

            return $tenant;
        }

        $existingId = $tenant->custom_hostname_id;

        $hostname = $existingId
            ? $this->updateCustomHostname((string) $existingId, $domain)
            : $this->createCustomHostname($domain);

        if ($hostname === null) {
            $tenant->forceFill($attributes + ['domain_status' => self::STATUS_FAILED])->save();

            return $tenant;
        }

        $tenant->forceFill($attributes + [
            'domain_status' => $this->mapStatus($hostname),
            'custom_hostname_id' => $hostname['id'] ?? $existingId,
        ])->save();

        return $tenant;
    }

    /** Cloudflare reports the hostname state; translate it to our vocabulary. */
    private function mapStatus(array $hostname): string
    {
        $status = strtolower((string) ($hostname['status'] ?? ''));
        $ssl = strtolower((string) ($hostname['ssl']['status'] ?? ''));

        if ($status === 'active' || $ssl === 'active') {
            return self::STATUS_ACTIVE;
        }

        if (in_array($status, ['blocked', 'moved'], true)
            || in_array($ssl, ['expired', 'deleted', 'validation_timed_out'], true)) {
            return self::STATUS_FAILED;
        }

        return self::STATUS_PENDING_DNS;
    }

    private function createCustomHostname(string $domain): ?array
    {
        return $this->request('post', $this->customHostnamesPath(), [
            'hostname' => $domain,
            'ssl' => ['method' => 'http', 'type' => 'dv'],
        ]);
    }

    private function updateCustomHostname(string $id, string $domain): ?array
    {
        return $this->request('patch', $this->customHostnamesPath().'/'.$id, [
            'hostname' => $domain,
        ]);
    }

    private function fetchCustomHostname(string $id): ?array
    {
        return $this->request('get', $this->customHostnamesPath().'/'.$id);
    }

    private function customHostnamesPath(): string
    {
        return '/zones/'.config('services.cloudflare.zone_id').'/custom_hostnames';
    }

    /**
     * @return array|null the `result` payload, or null when the call failed.
     */
    private function request(string $method, string $path, array $payload = []): ?array
    {
        try {
            $http = Http::withToken((string) config('services.cloudflare.api_token'))
                ->acceptJson()
                ->timeout(15);

            $response = match ($method) {
                'post' => $http->post($this->endpoint($path), $payload),
                'patch' => $http->patch($this->endpoint($path), $payload),
                default => $http->get($this->endpoint($path)),
            };
        } catch (\Throwable $e) {
            Log::warning('cloudflare.custom_hostname.unreachable', [
                'path' => $path,
                'message' => $e->getMessage(),
            ]);

            return null;
        }

        if (! $response->successful() || $response->json('success') !== true) {
            Log::warning('cloudflare.custom_hostname.rejected', [
                'path' => $path,
                'status' => $response->status(),
                'errors' => $response->json('errors'),
            ]);

            return null;
        }

        $result = $response->json('result');

        return is_array($result) ? $result : null;
    }

    private function endpoint(string $path): string
    {
        return rtrim((string) config('services.cloudflare.api_base', 'https://api.cloudflare.com/client/v4'), '/').$path;
    }
}
