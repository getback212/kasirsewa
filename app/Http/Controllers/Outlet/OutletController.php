<?php

namespace App\Http\Controllers\Outlet;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Services\Audit\AuditLogService;
use App\Services\Domain\TenantDomainProvisioner;
use App\Support\TenantDomain;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OutletController extends Controller
{
    public function __construct(private readonly TenantDomainProvisioner $domainProvisioner)
    {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('view-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola data outlet toko.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $tenant = Tenant::find($tenantId);

        $outlets = Outlet::when($user->company_id, fn ($q) => $q->where('company_id', $user->company_id))
            ->when($tenantId && ! $user->company_id, fn ($q) => $q->where('tenant_id', $tenantId))
            ->latest()
            ->get();

        return Inertia::render('Outlets/Index', [
            'outlets' => $outlets,
            'tenant' => $tenant,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('create-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menambah outlet toko.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);

        // Enforce SaaS Plan Limit max_stores Guard
        if ($tenantId) {
            $tenant = Tenant::with('subscription.plan')->find($tenantId);
            if ($tenant && $tenant->subscription && $tenant->subscription->plan) {
                $maxStores = $tenant->subscription->plan->max_stores;
                $currentStores = Outlet::where('company_id', $user->company_id)->count();

                if ($currentStores >= $maxStores) {
                    return back()->with('error', "Batas kuota outlet cabang toko Anda telah mencapai batas maksimal paket {$tenant->subscription->plan->name} ({$maxStores} Outlet Store). Silakan upgrade paket berlangganan SaaS Anda.");
                }
            }
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('outlets', 'code')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'tax_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'enable_ppn' => ['required', 'boolean'],
            'qris_payload' => ['nullable', 'string'],
            'qris_image_url' => ['nullable', 'string'],
        ]);

        $outlet = Outlet::create([
            'company_id' => $user->company_id,
            'tenant_id' => $tenantId,
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'tax_percentage' => $validated['tax_percentage'],
            'enable_ppn' => $validated['enable_ppn'],
            'qris_payload' => $validated['qris_payload'] ?? null,
            'qris_image_url' => $validated['qris_image_url'] ?? null,
            'is_active' => true,
        ]);

        AuditLogService::log('OUTLET_CREATE', 'Outlet', $outlet->id, ['name' => $outlet->name, 'code' => $outlet->code]);

        return redirect()->back()->with('success', 'Outlet toko cabang baru berhasil ditambahkan!');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('edit-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah konfigurasi outlet toko.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $outlet = Outlet::where('company_id', $user->company_id)
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('outlets', 'code')->ignore($outlet->id)->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'tax_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'enable_ppn' => ['required', 'boolean'],
            'qris_payload' => ['nullable', 'string'],
            'qris_image_url' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $outlet->update([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'tax_percentage' => $validated['tax_percentage'],
            'enable_ppn' => $validated['enable_ppn'],
            'qris_payload' => $validated['qris_payload'] ?? null,
            'qris_image_url' => $validated['qris_image_url'] ?? null,
            'is_active' => $validated['is_active'],
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
}
