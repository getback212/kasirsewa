<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Tenant;

class SubscriptionAccessMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Super Admin bypasses subscription checks
        if ($user && $user->hasRole('SUPER_ADMIN')) {
            return $next($request);
        }

        if ($user && $user->tenant_id) {
            $tenant = Tenant::with('subscription.plan')->find($user->tenant_id);

            if ($tenant && $tenant->subscription) {
                $sub = $tenant->subscription;

                // Allow viewing subscription, invoices, payments, and logout even if suspended/expired
                $allowedRoutes = ['subscription.index', 'subscription.pay', 'subscription.renew', 'invoices.index', 'invoices.show', 'logout'];
                $currentRoute = $request->route()?->getName();

                if (in_array($currentRoute, $allowedRoutes)) {
                    return $next($request);
                }

                // If suspended or expired past grace period, block new transactions & feature access
                if (in_array($sub->status, ['suspended', 'expired', 'cancelled'])) {
                    if ($request->wantsJson()) {
                        return response()->json([
                            'message' => 'Masa berlangganan SaaS Anda telah berakhir atau ditangguhkan. Silakan lakukan perpanjangan paket.',
                            'subscription_status' => $sub->status,
                        ], 402);
                    }

                    return redirect()->route('subscription.index')->with('error', 'Masa berlangganan SaaS toko Anda telah berakhir. Silakan lakukan perpanjangan paket berlangganan.');
                }
            }
        }

        return $next($request);
    }
}
