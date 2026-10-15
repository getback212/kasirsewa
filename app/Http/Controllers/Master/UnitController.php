<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);

        $query = Unit::where(function ($q) use ($tenantId, $user) {
            if ($tenantId) {
                $q->where('tenant_id', $tenantId);
            }
            if ($user->company_id) {
                $q->orWhere('company_id', $user->company_id);
            }
        });

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('short_name', 'ILIKE', "%{$search}%");
            });
        }

        $units = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Units/Index', [
            'units' => $units,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'short_name' => ['required', 'string', 'max:50'],
        ], [
            'name.required' => 'Nama satuan unit wajib diisi.',
            'short_name.required' => 'Singkatan satuan (misal: pcs, kg, dus) wajib diisi.',
        ]);

        $unit = Unit::create([
            'company_id' => $user->company_id ?? 1,
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'short_name' => strtolower($validated['short_name']),
        ]);

        AuditLogService::log('UNIT_CREATE', 'Unit', $unit->id, null, ['name' => $unit->name, 'short_name' => $unit->short_name]);

        return redirect()->back()->with('success', "Satuan unit barang '{$unit->name}' ({$unit->short_name}) berhasil ditambahkan!");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);

        $unit = Unit::where(function ($q) use ($tenantId, $user) {
            if ($tenantId) {
                $q->where('tenant_id', $tenantId);
            }
            if ($user->company_id) {
                $q->orWhere('company_id', $user->company_id);
            }
        })->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'short_name' => ['required', 'string', 'max:50'],
        ]);

        $unit->update([
            'name' => $validated['name'],
            'short_name' => strtolower($validated['short_name']),
        ]);

        AuditLogService::log('UNIT_UPDATE', 'Unit', $unit->id, null, ['name' => $unit->name, 'short_name' => $unit->short_name]);

        return redirect()->back()->with('success', "Satuan unit barang '{$unit->name}' berhasil diperbarui!");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);

        // Strict tenant isolation: unit must belong to current tenant AND company
        $unit = Unit::where('tenant_id', $tenantId)
            ->where('company_id', $user->company_id)
            ->findOrFail($id);

        $unitName = $unit->name;
        $unit->delete();

        AuditLogService::log('UNIT_DELETE', 'Unit', $id, ['name' => $unitName]);

        return redirect()->back()->with('success', "Satuan unit barang '{$unitName}' berhasil dihapus!");
    }
}
