<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * Resolve the active outlet ID for the given request, enforcing that the outlet
     * belongs to the authenticated user's company (or active tenant when no
     * company is set). Returns null if no valid outlet is found.
     */
    protected function resolveScopedOutletId(Request $request): ?int
    {
        $user = $request->user();
        if (! $user) {
            return null;
        }

        $sessionOutletId = session('active_outlet_id');

        if ($sessionOutletId) {
            $query = Outlet::where('id', $sessionOutletId)->where('is_active', true);
            if ($user->company_id) {
                $query->where('company_id', $user->company_id);
            } elseif ($user->tenant_id) {
                $query->where('tenant_id', $user->tenant_id);
            }
            if ($query->exists()) {
                return (int) $sessionOutletId;
            }
        }

        if ($user->outlet_id) {
            $query = Outlet::where('id', $user->outlet_id)->where('is_active', true);
            if ($user->company_id) {
                $query->where('company_id', $user->company_id);
            } elseif ($user->tenant_id) {
                $query->where('tenant_id', $user->tenant_id);
            }
            if ($query->exists()) {
                return (int) $user->outlet_id;
            }
        }

        if ($user->company_id) {
            $outlet = Outlet::where('company_id', $user->company_id)->where('is_active', true)->first();
            if ($outlet) {
                return (int) $outlet->id;
            }
        }

        if ($user->tenant_id) {
            $outlet = Outlet::where('tenant_id', $user->tenant_id)->where('is_active', true)->first();
            if ($outlet) {
                return (int) $outlet->id;
            }
        }

        return null;
    }
}
