<?php

namespace App\Http\Controllers\Outlet;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OutletController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('view-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola data outlet toko.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);

        $outlets = Outlet::where('company_id', $user->company_id)
            ->where(function ($q) use ($tenantId) {
                if ($tenantId) {
                    $q->where('tenant_id', $tenantId);
                }
            })
            ->latest()
            ->get();

        return Inertia::render('Outlets/Index', [
            'outlets' => $outlets,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('create-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menambah outlet toko.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);

        // Enforce SaaS Plan Limit max_stores Guard
        if ($tenantId) {
            $tenant = Tenant::with('subscription.plan')->find($tenantId);
            if ($tenant && $tenant->subscription && $tenant->subscription->plan) {
                $maxStores = $tenant->subscription->plan->max_stores;
                $currentStores = Outlet::where(function ($q) use ($tenantId, $user) {
                    $q->where('tenant_id', $tenantId)->orWhere('company_id', $user->company_id);
                })->count();

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

        if (!$user->hasPermissionTo('edit-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah konfigurasi outlet toko.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $outlet = Outlet::where('company_id', $user->company_id)->findOrFail($id);

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
        if ($outlet->is_main || \App\Models\Outlet::where('tenant_id', $tenantId)->count() === 1) {
            $tenant = \App\Models\Tenant::find($tenantId);
            if ($tenant) {
                $tenant->update(['name' => $validated['name']]);
            }
            if ($user->company_id) {
                \App\Models\Company::where('id', $user->company_id)->update(['name' => $validated['name']]);
            }
        }

        AuditLogService::log('OUTLET_UPDATE', 'Outlet', $outlet->id, ['name' => $outlet->name, 'code' => $outlet->code]);

        return redirect()->back()->with('success', 'Konfigurasi data outlet toko berhasil diperbarui!');
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
