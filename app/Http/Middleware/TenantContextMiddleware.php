<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantContextMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            if ($user->hasRole('SUPER_ADMIN')) {
                // Super Admin can switch active tenant or view all
                if ($request->hasHeader('X-Tenant-Id')) {
                    session(['active_tenant_id' => (int) $request->header('X-Tenant-Id')]);
                }
            } elseif ($user->tenant_id) {
                // Tenant users are strictly locked to their assigned tenant_id
                session(['active_tenant_id' => $user->tenant_id]);
            }
        }

        return $next($request);
    }
}
