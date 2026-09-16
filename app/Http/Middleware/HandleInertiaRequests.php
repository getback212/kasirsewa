<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Outlet;

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

        if ($user) {
            $user->load('roles');
            $companyId = $user->company_id;

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
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
