<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Models\Product;
use App\Models\Category;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

use App\Services\Audit\AuditLogService;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (!$user->hasPermissionTo('view-products')) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat master data produk.');
        }

        $query = Product::with(['category', 'unit'])
            ->where('company_id', $user->company_id);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('sku', 'ilike', "%{$search}%")
                  ->orWhere('barcode', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        $products = $query->latest()->paginate(15)->withQueryString();

        $categories = Category::where('company_id', $user->company_id)->where('is_active', true)->get(['id', 'name']);
        $units = Unit::where('company_id', $user->company_id)->get(['id', 'name', 'short_name']);

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'units' => $units,
            'filters' => $request->only(['search', 'category_id']),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $user = $request->user();
        
        $tenantId = session('active_tenant_id', $user->tenant_id);

        if ($tenantId) {
            $tenant = \App\Models\Tenant::with('subscription.plan')->find($tenantId);
            if ($tenant && $tenant->subscription && $tenant->subscription->plan) {
                $maxProducts = $tenant->subscription->plan->max_products;
                $currentProductCount = Product::where('tenant_id', $tenantId)->count();

                if ($currentProductCount >= $maxProducts) {
                    return redirect()->back()->with('error', "Batas jumlah produk untuk paket '{$tenant->subscription->plan->name}' adalah {$maxProducts} produk. Silakan upgrade paket berlangganan SaaS Anda untuk menambah produk baru.");
                }
            }
        }

        $validated = $request->validated();

        $product = Product::create([
            'company_id' => $user->company_id,
            'tenant_id' => $tenantId,
            'category_id' => $validated['category_id'] ?? null,
            'unit_id' => $validated['unit_id'] ?? null,
            'sku' => strtoupper($validated['sku']),
            'barcode' => $validated['barcode'] ?? null,
            'name' => $validated['name'],
            'purchase_price' => $validated['purchase_price'],
            'selling_price' => $validated['selling_price'],
            'min_stock' => $validated['min_stock'] ?? 0,
            'description' => $validated['description'] ?? null,
            'is_active' => true,
        ]);

        AuditLogService::log(
            action: 'PRODUCT_CREATE',
            modelType: 'Product',
            modelId: $product->id,
            newValues: ['name' => $product->name, 'sku' => $product->sku, 'price' => $product->selling_price]
        );

        return redirect()->back()->with('success', 'Produk baru berhasil ditambahkan!');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasPermissionTo('edit-products')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengedit data produk.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $product = Product::where('company_id', $user->company_id)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', Rule::unique('products', 'sku')->where('tenant_id', $tenantId)->ignore($product->id)],
            'barcode' => ['nullable', 'string', 'max:100', Rule::unique('products', 'barcode')->where('tenant_id', $tenantId)->ignore($product->id)],
            'category_id' => ['nullable', Rule::exists('categories', 'id')->where('company_id', $user->company_id)],
            'unit_id' => ['nullable', Rule::exists('units', 'id')->where('company_id', $user->company_id)],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'minimum_stock' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $oldData = $product->only(['name', 'sku', 'selling_price', 'is_active']);

        $product->update([
            'category_id' => $validated['category_id'] ?? null,
            'unit_id' => $validated['unit_id'] ?? null,
            'sku' => strtoupper($validated['sku']),
            'barcode' => $validated['barcode'] ?? null,
            'name' => $validated['name'],
            'purchase_price' => $validated['purchase_price'],
            'selling_price' => $validated['selling_price'],
            'minimum_stock' => $validated['minimum_stock'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'],
        ]);

        AuditLogService::log(
            action: 'PRODUCT_UPDATE',
            modelType: 'Product',
            modelId: $product->id,
            oldValues: $oldData,
            newValues: $product->only(['name', 'sku', 'selling_price', 'is_active'])
        );

        return redirect()->back()->with('success', 'Data produk berhasil diperbarui!');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasPermissionTo('delete-products')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus produk.');
        }

        $product = Product::where('company_id', $user->company_id)->findOrFail($id);
        $deletedData = $product->only(['name', 'sku', 'selling_price']);
        $product->delete();

        AuditLogService::log(
            action: 'PRODUCT_DELETE',
            modelType: 'Product',
            modelId: $id,
            oldValues: $deletedData
        );

        return redirect()->back()->with('success', 'Produk berhasil dihapus!');
    }
}
