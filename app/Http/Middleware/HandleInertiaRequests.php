<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request) ?? (file_exists(public_path('build/manifest.json')) ? md5_file(public_path('build/manifest.json')) : null);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        
        $currentOutletId = session('active_outlet_id');
        $currentOutlet = null;
        $availableOutlets = [];
        $tenantSubscription = null;

        if ($user) {
            $user->load('roles');
            $companyId = $user->company_id;
            $tenantId = session('active_tenant_id', $user->tenant_id);

            $availableOutlets = Outlet::where('company_id', $companyId)
                ->where('is_active', true)
                ->get();

            // Non-owner staff (Cashier & Warehouse) are strictly locked to their assigned outlet
            if ($user->hasRole(['CASHIER', 'WAREHOUSE'])) {
                $currentOutlet = $availableOutlets->firstWhere('id', $user->outlet_id) ?? $availableOutlets->first();
                session(['active_outlet_id' => $currentOutlet?->id]);
            } else {
                if ($currentOutletId) {
                    $currentOutlet = $availableOutlets->firstWhere('id', $currentOutletId);
                }

                if (!$currentOutlet && $availableOutlets->count() > 0) {
                    $currentOutlet = $availableOutlets->firstWhere('id', $user->outlet_id) ?? $availableOutlets->first();
                    session(['active_outlet_id' => $currentOutlet?->id]);
                }
            }

            // Calculate Tenant Subscription Quota & Limits
            if ($tenantId) {
                $tenant = Tenant::with('subscription.plan')->find($tenantId);
                if ($tenant && $tenant->subscription && $tenant->subscription->plan) {
                    $plan = $tenant->subscription->plan;

                    $storesCount = Outlet::where('tenant_id', $tenantId)->count();

                    $usersCount = User::where('tenant_id', $tenantId)->count();

                    $productsCount = Product::where('tenant_id', $tenantId)->count();

                    $trialEndsAt = $tenant->subscription->trial_ends_at;
                    $expiresAt = $tenant->subscription->expires_at;

                    $remainingDays = 0;
                    $remainingHours = 0;
                    if ($trialEndsAt) {
                        $remainingHours = max(0, (int) round(now()->diffInHours($trialEndsAt, false)));
                        $remainingDays = max(0, (int) ceil($remainingHours / 24));
                    }

                    $tenantSubscription = [
                        'status' => $tenant->subscription->status,
                        'plan_name' => $plan->name,
                        'plan_id' => $plan->id,
                        'is_trial' => $tenant->subscription->status === 'trial',
                        'trial_ends_at' => $trialEndsAt ? $trialEndsAt->format('Y-m-d H:i:s') : null,
                        'expires_at' => $expiresAt ? $expiresAt->format('Y-m-d H:i:s') : null,
                        'remaining_trial_days' => $remainingDays,
                        'remaining_trial_hours' => $remainingHours,
                        'max_stores' => $plan->max_stores,
                        'max_users' => $plan->max_users,
                        'max_products' => $plan->max_products,
                        'max_transactions' => $plan->max_transactions,
                        'current_stores_count' => $storesCount,
                        'current_users_count' => $usersCount,
                        'current_products_count' => $productsCount,
                        'can_create_store' => $storesCount < $plan->max_stores,
                        'can_create_user' => $usersCount < $plan->max_users,
                        'can_create_product' => $productsCount < $plan->max_products,
                    ];
                }
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'roles' => $user ? $user->getRoleNames() : [],
                'permissions' => $user ? $user->getAllPermissions()->pluck('name') : [],
            ],
            'currentOutlet' => $currentOutlet,
            'availableOutlets' => $availableOutlets,
            'tenantSubscription' => $tenantSubscription,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
