<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Subscription;
use App\Models\Plan;
use App\Models\User;
use App\Models\Outlet;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Stock;
use App\Enums\UserRole;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang mengelola data seluruh tenant.');
        }

        $query = Tenant::with(['owner', 'subscription.plan', 'stores']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('slug', 'ILIKE', "%{$search}%")
                  ->orWhere('domain', 'ILIKE', "%{$search}%");
        }

        $tenants = $query->latest()->paginate(15)->withQueryString();
        $plans = Plan::where('is_active', true)->get();

        return Inertia::render('Admin/TenantsIndex', [
            'tenants' => $tenants,
            'plans' => $plans,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Aksi ini hanya untuk Super Admin.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'domain' => ['nullable', 'string', 'max:255', 'unique:tenants,domain'],
            'plan_id' => ['required', 'exists:plans,id'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'owner_password' => ['required', 'string', 'min:6'],
        ]);

        $tenant = Tenant::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'domain' => $validated['domain'] ?? null,
            'status' => 'active',
        ]);

        $owner = User::create([
            'tenant_id' => $tenant->id,
            'name' => $validated['owner_name'],
            'email' => strtolower($validated['owner_email']),
            'password' => Hash::make($validated['owner_password']),
            'is_active' => true,
        ]);
        $owner->syncRoles([UserRole::OWNER->value]);

        $tenant->update(['owner_id' => $owner->id]);

        $plan = Plan::findOrFail($validated['plan_id']);
        Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'billing_cycle' => 'monthly',
            'starts_at' => now(),
            'expires_at' => now()->addDays(30),
            'trial_ends_at' => now()->addDays(7),
            'auto_renew' => true,
        ]);

        AuditLogService::log(
            action: 'TENANT_CREATE',
            modelType: 'Tenant',
            modelId: $tenant->id,
            newValues: ['name' => $tenant->name, 'owner' => $owner->email, 'plan' => $plan->name]
        );

        return redirect()->back()->with('success', "Tenant SaaS '{$tenant->name}' berhasil dibuat!");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Aksi ini hanya untuk Super Admin.');
        }

        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'domain' => ['nullable', 'string', 'max:255', 'unique:tenants,domain,' . $tenant->id],
            'status' => ['required', 'in:active,past_due,grace_period,suspended,expired,cancelled'],
        ]);

        $oldData = $tenant->only(['name', 'domain', 'status']);
        $tenant->update($validated);

        AuditLogService::log(
            action: 'TENANT_UPDATE',
            modelType: 'Tenant',
            modelId: $tenant->id,
            oldValues: $oldData,
            newValues: $tenant->only(['name', 'domain', 'status'])
        );

        return redirect()->back()->with('success', "Data tenant '{$tenant->name}' berhasil diperbarui!");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang menghapus data tenant.');
        }

        $tenant = Tenant::findOrFail($id);
        $tenantName = $tenant->name;

        DB::transaction(function () use ($tenant) {
            $tenantId = $tenant->id;
            $ownerId = $tenant->owner_id;

            // 1. Break cyclic reference from tenant to owner user
            $tenant->update(['owner_id' => null]);

            // 2. Delete sales & transactions
            DB::table('sale_items')->whereIn('sale_id', function ($q) use ($tenantId) {
                $q->select('id')->from('sales')->where('tenant_id', $tenantId);
            })->delete();
            DB::table('sales')->where('tenant_id', $tenantId)->delete();

            // 3. Delete purchases
            DB::table('purchase_items')->whereIn('purchase_id', function ($q) use ($tenantId) {
                $q->select('id')->from('purchases')->where('tenant_id', $tenantId);
            })->delete();
            DB::table('purchases')->where('tenant_id', $tenantId)->delete();

            // 4. Delete expenses & shifts
            DB::table('expenses')->where('tenant_id', $tenantId)->delete();
            DB::table('shifts')->where('tenant_id', $tenantId)->delete();

            // 5. Delete stock movements, opnames & transfers
            DB::table('stock_movements')->where('tenant_id', $tenantId)->delete();

            DB::table('stock_opname_items')->whereIn('stock_opname_id', function ($q) use ($tenantId) {
                $q->select('id')->from('stock_opnames')->where('tenant_id', $tenantId);
            })->delete();
            DB::table('stock_opnames')->where('tenant_id', $tenantId)->delete();

            DB::table('stock_transfer_items')->whereIn('stock_transfer_id', function ($q) use ($tenantId) {
                $q->select('id')->from('stock_transfers')->where('tenant_id', $tenantId);
            })->delete();
            DB::table('stock_transfers')->where('tenant_id', $tenantId)->delete();

            // 6. Delete master data
            DB::table('stocks')->where('tenant_id', $tenantId)->delete();
            DB::table('products')->where('tenant_id', $tenantId)->delete();
            DB::table('categories')->where('tenant_id', $tenantId)->delete();
            DB::table('units')->where('tenant_id', $tenantId)->delete();
            DB::table('suppliers')->where('tenant_id', $tenantId)->delete();
            DB::table('customers')->where('tenant_id', $tenantId)->delete();

            // 7. Delete billing & subscriptions
            DB::table('invoice_items')->whereIn('invoice_id', function ($q) use ($tenantId) {
                $q->select('id')->from('invoices')->where('tenant_id', $tenantId);
            })->delete();
            DB::table('invoices')->where('tenant_id', $tenantId)->delete();
            DB::table('subscriptions')->where('tenant_id', $tenantId)->delete();

            // 8. Delete audit logs & outlets
            DB::table('audit_logs')->where('tenant_id', $tenantId)->delete();
            DB::table('outlets')->where('tenant_id', $tenantId)->delete();

            // 9. Delete users & companies
            $companyIds = DB::table('users')->where('tenant_id', $tenantId)->pluck('company_id')->filter()->toArray();

            if ($ownerId) {
                DB::table('users')->where('id', $ownerId)->delete();
            }
            DB::table('users')->where('tenant_id', $tenantId)->delete();

            if (!empty($companyIds)) {
                DB::table('companies')->whereIn('id', $companyIds)->delete();
            }

            // 10. Finally delete the tenant record
            $tenant->delete();
        });

        AuditLogService::log('SAAS_TENANT_DELETE', 'Tenant', $id, ['name' => $tenantName]);

        return redirect()->back()->with('success', "Tenant toko '{$tenantName}' beserta seluruh relasi data berhasil dihapus!");
    }

    public function impersonate(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Aksi ini hanya untuk Super Admin.');
        }

        $tenant = Tenant::findOrFail($id);
        session(['active_tenant_id' => $tenant->id]);

        AuditLogService::log('SAAS_TENANT_IMPERSONATE', 'Tenant', $tenant->id, ['name' => $tenant->name]);

        return redirect()->route('dashboard')->with('success', "Berhasil beralih konteks (Impersonate) ke Tenant '{$tenant->name}'!");
    }

    public function stopImpersonate(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403);
        }

        session()->forget('active_tenant_id');

        return redirect()->route('admin.dashboard')->with('success', 'Kembali ke Konteks Super Admin SaaS.');
    }
}
