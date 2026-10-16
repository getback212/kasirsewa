<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Scoping for staff-user management (list, edit, toggle, delete).
 *
 * The old shape was `if ($tenantId) { where tenant_id } if ($companyId) { orWhere company_id }`.
 * Besides making every user of a company visible across tenants, it had no
 * clause at all when the acting user had neither `tenant_id` nor `company_id`
 * (the SaaS super admin), so the query fell through to *every* user in the
 * database — including tenants the caller never belonged to.
 *
 * Scope by tenant alone: company_id identifies a single store, so it adds
 * nothing once the tenant is fixed (all of a tenant's companies are its own).
 */
final class StaffScope
{
    /**
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public static function apply(Builder $query, ?int $tenantId): Builder
    {
        if ($tenantId === null) {
            // Never fall back to "all users in the database". A caller with no
            // tenant context may only manage staff inside its own company.
            return $query->whereNull('tenant_id');
        }

        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Tenant a user may manage staff in: the session's active tenant, else the
     * account's own tenant.
     */
    public static function tenantIdFor(User $user): ?int
    {
        $active = session('active_tenant_id');

        return $active !== null ? (int) $active : ($user->tenant_id !== null ? (int) $user->tenant_id : null);
    }
}
