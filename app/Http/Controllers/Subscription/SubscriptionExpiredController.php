<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionExpiredController extends Controller
{
    /**
     * Display subscription expired/suspended page
     * Shown when:
     * - Subscription status is 'expired', 'suspended', or 'cancelled'
     * - Subscription expires_at date has passed
     * - Employee tries to access dashboard/POS/inventory while subscription is inactive
     */
    public function show(Request $request)
    {
        $user = $request->user();

        // Only authenticated users can see this page
        if (! $user) {
            return redirect()->route('login');
        }

        $subscription = $user->tenant?->subscription;

        return Inertia::render('Subscription/SubscriptionExpired', [
            'subscription' => $subscription ? [
                'status' => $subscription->status,
                'expires_at' => $subscription->expires_at?->format('Y-m-d H:i:s'),
                'plan_name' => $subscription->plan?->name,
                'plan_price' => $subscription->plan?->price,
                'billing_cycle' => $subscription->billing_cycle,
            ] : null,
            'tenant' => $user->tenant ? [
                'id' => $user->tenant->id,
                'name' => $user->tenant->name,
            ] : null,
        ]);
    }
}
