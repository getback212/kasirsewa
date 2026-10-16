<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $page = $request->integer('page', 1);
        $limit = $request->integer('limit', 50);
        $search = $request->string('search', '');

        $query = Product::where('company_id', $user->company_id)
            ->where('is_active', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                    ->orWhere('sku', 'ILIKE', "%{$search}%")
                    ->orWhere('barcode', 'ILIKE', "%{$search}%");
            });
        }

        $products = $query->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'status' => 'success',
            'message' => 'Daftar produk berhasil diambil.',
            'data' => [
                'items' => $products->items()->map(fn ($p) => [
                    'id' => $p->id,
                    'sku' => $p->sku,
                    'barcode' => $p->barcode,
                    'name' => $p->name,
                    'purchase_price' => (float) $p->purchase_price,
                    'selling_price' => (float) $p->selling_price,
                    'stock_quantity' => (int) $p->stock_quantity,
                    'category_id' => $p->category_id,
                    'unit_id' => $p->unit_id,
                ]),
                'pagination' => [
                    'page' => $products->currentPage(),
                    'limit' => $products->perPage(),
                    'total' => $products->total(),
                    'pages' => $products->lastPage(),
                ],
            ],
        ], 200);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $product = Product::where('company_id', $user->company_id)
            ->where('id', $id)
            ->where('is_active', true)
            ->first();

        if (! $product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Produk tidak ditemukan.',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Detail produk berhasil diambil.',
            'data' => [
                'id' => $product->id,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'name' => $product->name,
                'description' => $product->description,
                'purchase_price' => (float) $product->purchase_price,
                'selling_price' => (float) $product->selling_price,
                'stock_quantity' => (int) $product->stock_quantity,
                'min_stock' => (int) $product->min_stock,
                'category_id' => $product->category_id,
                'unit_id' => $product->unit_id,
                'created_at' => $product->created_at->toIso8601String(),
            ],
        ], 200);
    }

    public function search(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $request->string('q', '');

        if (strlen($query) < 2) {
            return response()->json([
                'status' => 'error',
                'message' => 'Query minimal 2 karakter.',
                'data' => [],
            ], 400);
        }

        $products = Product::where('company_id', $user->company_id)
            ->where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'ILIKE', "%{$query}%")
                    ->orWhere('sku', 'ILIKE', "%{$query}%")
                    ->orWhere('barcode', 'ILIKE', "%{$query}%");
            })
            ->limit(20)
            ->get(['id', 'sku', 'barcode', 'name', 'selling_price', 'stock_quantity']);

        return response()->json([
            'status' => 'success',
            'message' => 'Pencarian produk berhasil.',
            'data' => $products->map(fn ($p) => [
                'id' => $p->id,
                'sku' => $p->sku,
                'barcode' => $p->barcode,
                'name' => $p->name,
                'price' => (float) $p->selling_price,
                'stock' => (int) $p->stock_quantity,
            ]),
        ], 200);
    }
}
