<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('view-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola data toko/outlet.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $stores = Outlet::where('tenant_id', $tenantId)->latest()->get();

        return Inertia::render('Outlets/Index', [
            'outlets' => $stores,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('create-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menambah toko/outlet.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $tenant = Tenant::with('subscription.plan')->find($tenantId);

        if ($tenant && $tenant->subscription && $tenant->subscription->plan) {
            $maxStores = $tenant->subscription->plan->max_stores;
            $currentStoreCount = Outlet::where('tenant_id', $tenantId)->count();

            if ($currentStoreCount >= $maxStores) {
                return redirect()->back()->with('error', "Batas jumlah toko untuk paket '{$tenant->subscription->plan->name}' adalah {$maxStores} toko. Silakan upgrade paket berlangganan SaaS Anda untuk menambah outlet baru.");
            }
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('outlets', 'code')->where('tenant_id', $tenantId)],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'tax_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'enable_ppn' => ['required', 'boolean'],
            'qris_payload' => ['nullable', 'string'],
            'qris_image_url' => ['nullable', 'string'],
        ]);

        $store = Outlet::create([
            'company_id' => $user->company_id ?? 1,
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

        AuditLogService::log(
            action: 'STORE_CREATE',
            modelType: 'Outlet',
            modelId: $store->id,
            newValues: ['name' => $store->name, 'code' => $store->code]
        );

        return redirect()->back()->with('success', "Toko / Outlet '{$store->name}' berhasil ditambahkan!");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('edit-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengedit data toko/outlet.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $store = Outlet::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('outlets', 'code')->where('tenant_id', $tenantId)->ignore($store->id)],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'tax_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'enable_ppn' => ['required', 'boolean'],
            'qris_payload' => ['nullable', 'string'],
            'qris_image_url' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $oldData = $store->only(['name', 'code', 'phone', 'address']);
        $store->update([
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

        // Sync main store name update with Tenant & Company models for Super Admin UI
        if ($store->is_main || \App\Models\Outlet::where('tenant_id', $tenantId)->count() === 1) {
            $tenant = \App\Models\Tenant::find($tenantId);
            if ($tenant) {
                $tenant->update(['name' => $validated['name']]);
            }
            if ($user->company_id) {
                \App\Models\Company::where('id', $user->company_id)->update(['name' => $validated['name']]);
            }
        }

        AuditLogService::log(
            action: 'STORE_UPDATE',
            modelType: 'Outlet',
            modelId: $store->id,
            oldValues: $oldData,
            newValues: $store->only(['name', 'code', 'phone', 'address'])
        );

        return redirect()->back()->with('success', "Data toko / outlet '{$store->name}' berhasil diperbarui!");
    }
}
