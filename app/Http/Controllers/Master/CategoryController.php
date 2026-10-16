<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('create-categories')) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuat kategori produk baru.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        Category::create([
            'company_id' => $user->company_id,
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "Kategori produk '{$validated['name']}' berhasil ditambahkan!");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('delete-categories')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus kategori produk.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $category = Category::where('company_id', $user->company_id)
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);
        $categoryName = $category->name;
        $category->delete();

        return redirect()->back()->with('success', "Kategori produk '{$categoryName}' berhasil dihapus!");
    }
}
