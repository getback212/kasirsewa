<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang mengelola paket berlangganan SaaS.');
        }

        $plans = Plan::withCount('subscriptions')->latest()->get();

        return Inertia::render('Admin/PlansIndex', [
            'plans' => $plans,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Aksi ini hanya untuk Super Admin.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'yearly_price' => ['required', 'numeric', 'min:0'],
            'max_users' => ['required', 'integer', 'min:1'],
            'max_stores' => ['required', 'integer', 'min:1'],
            'max_products' => ['required', 'integer', 'min:10'],
            'max_transactions' => ['required', 'integer', 'min:100'],
            'features' => ['nullable', 'array'],
        ]);

        $plan = Plan::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'monthly_price' => $validated['monthly_price'],
            'yearly_price' => $validated['yearly_price'],
            'max_users' => $validated['max_users'],
            'max_stores' => $validated['max_stores'],
            'max_products' => $validated['max_products'],
            'max_transactions' => $validated['max_transactions'],
            'features' => $validated['features'] ?? ['Kasir POS Speed Touch', 'Stok Gudang Realtime'],
            'is_active' => true,
        ]);

        AuditLogService::log(
            action: 'PLAN_CREATE',
            modelType: 'Plan',
            modelId: $plan->id,
            newValues: ['name' => $plan->name, 'price' => $plan->monthly_price]
        );

        return redirect()->back()->with('success', "Paket SaaS baru '{$plan->name}' berhasil ditambahkan!");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Aksi ini hanya untuk Super Admin.');
        }

        $plan = Plan::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'yearly_price' => ['required', 'numeric', 'min:0'],
            'max_users' => ['required', 'integer', 'min:1'],
            'max_stores' => ['required', 'integer', 'min:1'],
            'max_products' => ['required', 'integer', 'min:10'],
            'max_transactions' => ['required', 'integer', 'min:100'],
            'is_active' => ['required', 'boolean'],
        ]);

        $oldData = $plan->only(['name', 'monthly_price', 'is_active']);
        $plan->update($validated);

        AuditLogService::log(
            action: 'PLAN_UPDATE',
            modelType: 'Plan',
            modelId: $plan->id,
            oldValues: $oldData,
            newValues: $plan->only(['name', 'monthly_price', 'is_active'])
        );

        return redirect()->back()->with('success', "Paket SaaS '{$plan->name}' berhasil diperbarui!");
    }
}
