<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Support\TenantDomain;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantDomainResolver
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = strtolower($request->getHost());

        // Apex / local development hosts never resolve through tenant domains.
        if (TenantDomain::isMainHost($host)) {
            return $next($request);
        }

        $tenant = Tenant::whereRaw('LOWER(domain) = ?', [$host])->first();

        // A custom domain only binds once we have verified it (DNS + TLS by
        // Cloudflare for SaaS). Until then the name is merely a claim in the
        // database and must not hand out a tenant session — otherwise anyone
        // could spoof a Host header to land inside a store.
        if ($tenant && ! TenantDomain::isBaseHost($host) && $tenant->domain_status !== 'active') {
            $tenant = null;
        }

        // A host under our own base domain that maps to no tenant is a dead
        // subdomain — surface 404 instead of silently landing on the main app.
        if (! $tenant && str_ends_with($host, '.' . TenantDomain::BASE_DOMAIN)) {
            abort(404, 'Tenant tidak ditemukan.');
        }

        // Unknown external hosts (custom domains, direct IPs) fall through.
        if (! $tenant) {
            return $next($request);
        }

        $user = $request->user();
        if ($user && ! $user->hasRole('SUPER_ADMIN') && (int) $user->tenant_id !== (int) $tenant->id) {
            abort(403, 'Akun ini tidak memiliki akses ke tenant tersebut.');
        }

        session(['active_tenant_id' => $tenant->id]);

        return $next($request);
    }
}
