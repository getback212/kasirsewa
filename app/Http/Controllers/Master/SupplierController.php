<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('create-suppliers')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menambah data supplier.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $companyId = $user->company_id;

        // Validate company_id exists (prevent owner tenant new without company_id)
        if (!$companyId) {
            abort(422, 'Data perusahaan Anda tidak ditemukan. Hubungi administrator.');
        }

        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
        ]);

        // Auto-generate code if empty: SUP-{YYYYMMDD}-{RANDOM4}
        if (!$validated['code']) {
            // Generate unique code with timestamp + random
            $baseCode = 'SUP-' . date('Ymd') . '-' . strtoupper(\Illuminate\Support\Str::random(4));
            $supplierCode = $baseCode;
            
            // If collision, append sequence: -01, -02, etc
            $counter = 1;
            while (Supplier::where('tenant_id', $tenantId)->where('code', $supplierCode)->exists()) {
                $supplierCode = $baseCode . '-' . str_pad($counter, 2, '0', STR_PAD_LEFT);
                $counter++;
            }
        } else {
            $supplierCode = strtoupper($validated['code']);
        }

        Supplier::create([
            'company_id' => $companyId,
            'tenant_id' => $tenantId,
            'code' => $supplierCode,
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return redirect()->back()->with('success', "Supplier resmi '{$validated['name']}' (Kode: {$supplierCode}) berhasil ditambahkan!");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('edit-suppliers')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah data supplier.');
        }

        $supplier = Supplier::where('company_id', $user->company_id)->findOrFail($id);

        $tenantId = session('active_tenant_id', $user->tenant_id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
        ]);

        $supplier->update([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return redirect()->back()->with('success', "Data supplier '{$supplier->name}' berhasil diperbarui!");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('delete-suppliers')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus data supplier.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $supplier = Supplier::where('company_id', $user->company_id)
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);
        $supplierName = $supplier->name;
        $supplier->delete();

        return redirect()->back()->with('success', "Data supplier '{$supplierName}' berhasil dihapus!");
    }
}
