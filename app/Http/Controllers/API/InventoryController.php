<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function stockLevels(Request $request): JsonResponse
    {
        $user = $request->user();
        $outletId = $request->integer('outlet_id', $user->outlet_id);
        $lowStockOnly = $request->boolean('low_stock_only', false);

        $query = Product::where('company_id', $user->company_id)
            ->where('is_active', true)
            ->select('id', 'sku', 'name', 'stock_quantity', 'min_stock');

        if ($lowStockOnly) {
            $query->whereRaw('stock_quantity <= min_stock');
        }

        $products = $query->get();

        return response()->json([
            'status' => 'success',
            'message' => 'Data stok produk berhasil diambil.',
            'data' => [
                'items' => $products->map(fn ($p) => [
                    'id' => $p->id,
                    'sku' => $p->sku,
                    'name' => $p->name,
                    'quantity' => (int) $p->stock_quantity,
                    'min_stock' => (int) $p->min_stock,
                    'status' => $p->stock_quantity <= $p->min_stock ? 'low' : 'normal',
                ]),
                'summary' => [
                    'total_products' => $products->count(),
                    'low_stock_count' => $products->where('stock_quantity', '<=', $p->min_stock ?? 0)->count(),
                ],
            ],
        ], 200);
    }

    public function stockHistory(Request $request, int $productId): JsonResponse
    {
        $user = $request->user();
        $page = $request->integer('page', 1);
        $limit = $request->integer('limit', 20);

        $product = Product::where('company_id', $user->company_id)
            ->where('id', $productId)
            ->first();

        if (! $product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Produk tidak ditemukan.',
                'data' => null,
            ], 404);
        }

        // In real scenario, fetch from inventory_transactions table
        // For now, return placeholder
        $transactions = collect([]);

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat stok produk berhasil diambil.',
            'data' => [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'current_stock' => (int) $product->stock_quantity,
                'transactions' => $transactions->map(fn ($t) => [
                    'date' => $t->created_at->toIso8601String(),
                    'type' => $t->type, // in/out
                    'quantity' => (int) $t->quantity,
                    'note' => $t->note,
                ]),
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => 0,
                ],
            ],
        ], 200);
    }
}
