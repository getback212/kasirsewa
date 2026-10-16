<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DiscountController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);

        $query = Discount::where('tenant_id', $tenantId)
            ->where('company_id', $user->company_id);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                    ->orWhere('code', 'ILIKE', "%{$search}%");
            });
        }

        $discounts = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Discounts/Index', [
            'discounts' => $discounts,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'type' => ['required', 'in:percentage,fixed'],
            'value' => ['required', 'numeric', 'min:0'],
            'min_spend' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
        ], [
            'name.required' => 'Nama promo / diskon wajib diisi.',
            'value.required' => 'Nilai diskon wajib diisi.',
        ]);

        $discount = Discount::create([
            'company_id' => $user->company_id ?? 1,
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'code' => $validated['code'] ? strtoupper(trim($validated['code'])) : null,
            'type' => $validated['type'],
            'value' => (float) $validated['value'],
            'min_spend' => (float) ($validated['min_spend'] ?? 0),
            'max_discount' => $validated['max_discount'] ? (float) $validated['max_discount'] : null,
            'starts_at' => $validated['starts_at'] ?? null,
            'ends_at' => $validated['ends_at'] ?? null,
            'is_active' => true,
        ]);

        AuditLogService::log('DISCOUNT_CREATE', 'Discount', $discount->id, null, ['name' => $discount->name]);

        return redirect()->back()->with('success', "Promo diskon '{$discount->name}' berhasil ditambahkan!");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);

        $discount = Discount::where('tenant_id', $tenantId)
            ->where('company_id', $user->company_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'type' => ['required', 'in:percentage,fixed'],
            'value' => ['required', 'numeric', 'min:0'],
            'min_spend' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $discount->update([
            'name' => $validated['name'],
            'code' => $validated['code'] ? strtoupper(trim($validated['code'])) : null,
            'type' => $validated['type'],
            'value' => (float) $validated['value'],
            'min_spend' => (float) ($validated['min_spend'] ?? 0),
            'max_discount' => $validated['max_discount'] ? (float) $validated['max_discount'] : null,
            'is_active' => $validated['is_active'],
        ]);

        AuditLogService::log('DISCOUNT_UPDATE', 'Discount', $discount->id, null, ['name' => $discount->name]);

        return redirect()->back()->with('success', "Promo diskon '{$discount->name}' berhasil diperbarui!");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);

        $discount = Discount::where('tenant_id', $tenantId)
            ->where('company_id', $user->company_id)
            ->findOrFail($id);

        $name = $discount->name;
        $discount->delete();

        AuditLogService::log('DISCOUNT_DELETE', 'Discount', $id, ['name' => $name]);

        return redirect()->back()->with('success', "Promo diskon '{$name}' berhasil dihapus!");
    }
}
