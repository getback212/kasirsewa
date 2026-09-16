<?php

namespace App\Http\Controllers\Outlet;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
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

        $outlets = Outlet::where('company_id', $user->company_id)
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

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:outlets,code'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'tax_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'enable_ppn' => ['required', 'boolean'],
            'qris_payload' => ['nullable', 'string'],
            'qris_image_url' => ['nullable', 'string'],
        ]);

        Outlet::create([
            'company_id' => $user->company_id,
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

        return redirect()->back()->with('success', 'Outlet toko cabang baru berhasil ditambahkan!');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('edit-outlets')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah konfigurasi outlet toko.');
        }

        $outlet = Outlet::where('company_id', $user->company_id)->findOrFail($id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('outlets', 'code')->ignore($outlet->id)],
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

        return redirect()->back()->with('success', "Konfigurasi outlet cabang {$outlet->name} berhasil diperbarui!");
    }

    public function switchOutlet(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
            return redirect()->back()->with('error', 'Hanya Pemilik Toko (Owner) yang berwenang mengganti akses outlet cabang secara global.');
        }

        $outlet = Outlet::where('company_id', $user->company_id)->findOrFail($id);

        session(['active_outlet_id' => $outlet->id]);

        return redirect()->back()->with('success', "Outlet aktif berhasil diubah ke {$outlet->name}!");
    }
}
