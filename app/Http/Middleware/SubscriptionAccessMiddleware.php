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

                // Allow viewing subscription, invoices, payments, display, OTP verification, and logout even if suspended/expired
                $allowedRoutes = ['subscription.index', 'subscription.pay', 'subscription.renew', 'invoices.index', 'invoices.show', 'logout', 'verify.otp', 'verify.otp.send', 'verify.otp.verify', 'pos.customer_display', 'pos.customer_display.broadcast', 'pos.customer_display.state'];
                $currentRoute = $request->route()?->getName();

                if (in_array($currentRoute, $allowedRoutes)) {
                    return $next($request);
                }

                // Check if expires_at has passed (even if status is still 'active' or 'trial')
                $isExpired = $sub->expires_at && now()->greaterThan($sub->expires_at);
                $isSuspended = in_array($sub->status, ['suspended', 'cancelled']);
                $isStatusExpired = $sub->status === 'expired';

                // If suspended, cancelled, or expired past grace period, block new transactions & feature access
                if ($isSuspended || $isStatusExpired || $isExpired) {
                    if ($request->wantsJson()) {
                        return response()->json([
                            'message' => 'Masa berlangganan SaaS Anda telah berakhir atau ditangguhkan. Silakan lakukan perpanjangan paket.',
                            'subscription_status' => $sub->status,
                            'expires_at' => $sub->expires_at,
                        ], 402);
                    }

                    return redirect()->route('subscription.expired')->with('error', 'Masa berlangganan SaaS toko Anda telah berakhir atau ditangguhkan.');
                }
            }
        }

        return $next($request);
    }
}
