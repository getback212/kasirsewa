<?php

namespace App\Http\Controllers\Outlet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Outlet\StoreOutletRequest;
use App\Http\Requests\Outlet\UpdateOutletRequest;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Services\Audit\AuditLogService;
use App\Services\Domain\TenantDomainProvisioner;
use App\Support\TenantDomain;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OutletController extends Controller
{
    public function __construct(private readonly TenantDomainProvisioner $domainProvisioner) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('view-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola data outlet toko.');
        }

        // Super Admin: use session tenant, Owner: use their tenant
        $tenantId = $user->hasRole('SUPER_ADMIN')
            ? session('active_tenant_id')
            : $user->tenant_id;

        $tenant = Tenant::find($tenantId);

        // Filter outlets by tenant ONLY (not by company)
        $outlets = Outlet::where('tenant_id', $tenantId)
            ->latest()
            ->get();

        return Inertia::render('Outlets/Index', [
            'outlets' => $outlets,
            'tenant' => $tenant,
        ]);
    }

    public function store(StoreOutletRequest $request): RedirectResponse
    {
        $user = $request->user();

        // Super Admin: can set session('active_tenant_id') to create outlets for any tenant
        // Owner: can ONLY create outlets for their own tenant
        $tenantId = null;
        
        if ($user->hasRole('SUPER_ADMIN')) {
            // Super admin can use session to pick tenant, or must be explicit
            $tenantId = session('active_tenant_id');
            if (!$tenantId) {
                return back()->with('error', 'Super Admin: Harus pilih tenant terlebih dahulu.');
            }
        } else {
            // Owner: always use their tenant
            $tenantId = $user->tenant_id;
        }

        // Enforce SaaS Plan Limit max_stores Guard (per-tenant, not per-company)
        $tenant = Tenant::with('subscription.plan')->find($tenantId);
        if ($tenant && $tenant->subscription && $tenant->subscription->plan) {
            $maxStores = $tenant->subscription->plan->max_stores;
            // Count outlets for THIS TENANT ONLY
            $currentStores = Outlet::where('tenant_id', $tenantId)->count();

            if ($currentStores >= $maxStores) {
                return back()->with('error', "Batas kuota outlet cabang toko Anda telah mencapai batas maksimal paket {$tenant->subscription->plan->name} ({$maxStores} Outlet Store). Silakan upgrade paket berlangganan SaaS Anda.");
            }
        }

        $validated = $request->validated();

        // Auto-generate outlet code if not provided
        $code = $validated['code'] ?? null;
        if (!$code) {
            $lastOutlet = Outlet::where('tenant_id', $tenantId)
                ->orderBy('id', 'desc')
                ->first();
            $nextNumber = ($lastOutlet ? (int)substr($lastOutlet->code, -3) : 0) + 1;
            $code = 'OUT-'.str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
        }

        $outlet = Outlet::create([
            'company_id' => $user->company_id,
            'tenant_id' => $tenantId,
            'code' => strtoupper($code),
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'qris_payload' => $validated['qris_payload'] ?? null,
            'qris_image_url' => $validated['qris_image_url'] ?? null,
            'enable_ppn' => $validated['enable_ppn'] ?? true,
            'tax_percentage' => $validated['tax_percentage'] ?? 11,
            'is_active' => true,
        ]);

        AuditLogService::log('OUTLET_CREATE', 'Outlet', $outlet->id, ['name' => $outlet->name, 'code' => $outlet->code]);

        return redirect()->back()->with('success', "Outlet cabang {$outlet->name} ({$outlet->code}) berhasil ditambahkan!");
    }

    public function update(UpdateOutletRequest $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('edit-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengedit data outlet toko.');
        }

        // Super Admin: can edit outlets in selected tenant (via session)
        // Owner: can ONLY edit outlets in their own tenant
        $tenantId = $user->hasRole('SUPER_ADMIN') 
            ? session('active_tenant_id')
            : $user->tenant_id;

        $outlet = Outlet::where('tenant_id', $tenantId)
            ->findOrFail($id);

        $validated = $request->validated();

        $outlet->update([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'qris_payload' => $validated['qris_payload'] ?? null,
            'qris_image_url' => $validated['qris_image_url'] ?? null,
            'enable_ppn' => $validated['enable_ppn'] ?? true,
            'tax_percentage' => $validated['tax_percentage'] ?? 11,
        ]);

        // Sync main outlet name update with Tenant & Company models for Super Admin UI
        if ($outlet->is_main || Outlet::where('tenant_id', $tenantId)->count() === 1) {
            $tenant = Tenant::find($tenantId);
            if ($tenant) {
                $tenant->update(['name' => $validated['name']]);
            }
            if ($user->company_id) {
                Company::where('id', $user->company_id)->update(['name' => $validated['name']]);
            }
        }

        AuditLogService::log('OUTLET_UPDATE', 'Outlet', $outlet->id, ['name' => $outlet->name, 'code' => $outlet->code]);

        return redirect()->back()->with('success', 'Konfigurasi data outlet toko berhasil diperbarui!');
    }

    public function updateDomain(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
            abort(403, 'Hanya Pemilik Toko (Owner) atau Super Admin yang berwenang mengubah subdomain toko.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $tenant = Tenant::findOrFail($tenantId);

        $validated = $request->validate([
            'domain' => ['required', 'string', 'max:255'],
        ], [
            'domain.required' => 'Subdomain / Domain khusus wajib diisi.',
        ]);

        $cleanDomain = TenantDomain::normalize($validated['domain']);

        if (Tenant::whereRaw('LOWER(domain) = ?', [$cleanDomain])->whereKeyNot($tenant->id)->exists()) {
            return redirect()->back()->withErrors(['domain' => 'Subdomain / domain tersebut sudah digunakan oleh toko lain.']);
        }

        $previousDomain = $tenant->domain;
        $tenant = $this->domainProvisioner->provision($tenant, $cleanDomain);

        AuditLogService::log(
            'TENANT_DOMAIN_UPDATE',
            'Tenant',
            $tenant->id,
            ['domain' => $previousDomain],
            ['domain' => $cleanDomain, 'domain_status' => $tenant->domain_status],
        );

        return redirect()->back()->with('success', $this->domainStatusMessage($tenant));
    }

    /**
     * Re-check a custom domain against Cloudflare so the tenant can see when
     * their CNAME/certificate has gone live.
     */
    public function refreshDomain(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
            abort(403, 'Hanya Pemilik Toko (Owner) atau Super Admin yang berwenang memverifikasi domain toko.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $tenant = Tenant::findOrFail($tenantId);

        $tenant = $this->domainProvisioner->refresh($tenant);

        AuditLogService::log(
            'TENANT_DOMAIN_REFRESH',
            'Tenant',
            $tenant->id,
            null,
            ['domain_status' => $tenant->domain_status],
        );

        return redirect()->back()->with('success', $this->domainStatusMessage($tenant));
    }

    private function domainStatusMessage(Tenant $tenant): string
    {
        return match ($tenant->domain_status) {
            TenantDomainProvisioner::STATUS_ACTIVE => "Alamat '{$tenant->domain}' aktif dan siap dipakai.",
            TenantDomainProvisioner::STATUS_PENDING_DNS => "Alamat '{$tenant->domain}' disimpan, tetapi belum aktif. Arahkan CNAME domain Anda lalu tekan \"Cek Status\".",
            TenantDomainProvisioner::STATUS_FAILED => "Alamat '{$tenant->domain}' tersimpan, namun Cloudflare menolak/menghentikan penerbitan sertifikat. Periksa kembali pengaturan DNS Anda.",
            default => "Alamat '{$tenant->domain}' tersimpan.",
        };
    }

    public function switchOutlet(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        $outlet = Outlet::where('company_id', $user->company_id)
            ->where('is_active', true)
            ->findOrFail($id);

        session(['active_outlet_id' => $outlet->id]);

        return redirect()->back()->with('success', "Berhasil berpindah ke outlet aktif: {$outlet->name}");
    }

    public function toggleActive(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('edit-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah status outlet toko.');
        }

        $tenantId = $user->hasRole('SUPER_ADMIN')
            ? session('active_tenant_id')
            : $user->tenant_id;

        $outlet = Outlet::where('tenant_id', $tenantId)
            ->findOrFail($id);

        $newStatus = !$outlet->is_active;
        $outlet->update(['is_active' => $newStatus]);

        $status = $newStatus ? 'diaktifkan' : 'dinonaktifkan';
        AuditLogService::log('OUTLET_TOGGLE', 'Outlet', $outlet->id, ['is_active' => $newStatus]);

        return redirect()->back()->with('success', "Outlet {$outlet->name} berhasil {$status}!");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('delete-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus outlet toko.');
        }

        $tenantId = $user->hasRole('SUPER_ADMIN')
            ? session('active_tenant_id')
            : $user->tenant_id;

        $outlet = Outlet::where('tenant_id', $tenantId)
            ->findOrFail($id);

        // Check if outlet has active transactions (sales)
        $saleTxCount = DB::table('sales')->where('outlet_id', $outlet->id)->count();
        if ($saleTxCount > 0) {
            return redirect()->back()->with('error', "Outlet {$outlet->name} tidak dapat dihapus karena masih memiliki {$saleTxCount} transaksi penjualan. Nonaktifkan outlet saja.");
        }

        // Check if outlet has active transactions (purchases)
        $purchaseTxCount = DB::table('purchases')->where('outlet_id', $outlet->id)->count();
        if ($purchaseTxCount > 0) {
            return redirect()->back()->with('error', "Outlet {$outlet->name} tidak dapat dihapus karena masih memiliki {$purchaseTxCount} transaksi pembelian. Nonaktifkan outlet saja.");
        }

        $outletName = $outlet->name;
        $outletCode = $outlet->code;

        AuditLogService::log('OUTLET_DELETE', 'Outlet', $outlet->id, ['name' => $outletName, 'code' => $outletCode]);

        $outlet->delete();

        return redirect()->back()->with('success', "Outlet {$outletName} ({$outletCode}) berhasil dihapus!");
    }
}
