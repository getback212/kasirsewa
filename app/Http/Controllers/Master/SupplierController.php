<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('create-suppliers')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menambah data supplier.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('suppliers', 'code')->where('tenant_id', $tenantId)],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
        ]);

        Supplier::create([
            'company_id' => $user->company_id ?? 1,
            'tenant_id' => $tenantId,
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return redirect()->back()->with('success', "Supplier resmi '{$validated['name']}' berhasil ditambahkan!");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('edit-suppliers')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah data supplier.');
        }

        $supplier = Supplier::where('company_id', $user->company_id)->findOrFail($id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('suppliers', 'code')->ignore($supplier->id)],
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

        if (!$user->hasPermissionTo('delete-suppliers')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus data supplier.');
        }

        $supplier = Supplier::where('company_id', $user->company_id)->findOrFail($id);
        $supplierName = $supplier->name;
        $supplier->delete();

        return redirect()->back()->with('success', "Data supplier '{$supplierName}' berhasil dihapus!");
    }
}
