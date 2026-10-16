<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Stock;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BarcodeController extends Controller
{
    /**
     * Lookup product by barcode (fast endpoint for POS scanning).
     * Returns product details + current stock level at active outlet.
     */
    public function lookup(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->hasPermissionTo('access-pos')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak.',
            ], 403);
        }

        $barcode = $request->input('barcode');
        if (! $barcode) {
            return response()->json([
                'status' => 'error',
                'message' => 'Barcode tidak boleh kosong.',
            ], 400);
        }

        $activeOutletId = $this->resolveScopedOutletId($request);
        if (! $activeOutletId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Outlet aktif tidak valid.',
            ], 403);
        }

        // Find product by barcode + company scope
        $product = Product::where('company_id', $user->company_id)
            ->where('barcode', $barcode)
            ->where('is_active', true)
            ->first();

        if (! $product) {
            // Log failed scan attempt
            AuditLogService::log(
                'POS_BARCODE_NOT_FOUND',
                'Product',
                null,
                null,
                ['barcode' => $barcode, 'outlet_id' => $activeOutletId]
            );

            return response()->json([
                'status' => 'error',
                'message' => "Produk dengan barcode '{$barcode}' tidak ditemukan.",
            ], 404);
        }

        // Get current stock at active outlet
        $stock = Stock::where('outlet_id', $activeOutletId)
            ->where('product_id', $product->id)
            ->first();

        $stockQty = $stock?->quantity ?? 0;

        // Log successful scan
        AuditLogService::log(
            'POS_BARCODE_SCANNED',
            'Product',
            $product->id,
            null,
            [
                'barcode' => $barcode,
                'product_name' => $product->name,
                'sku' => $product->sku,
                'stock_qty' => $stockQty,
            ]
        );

        return response()->json([
            'status' => 'success',
            'product' => [
                'id' => $product->id,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'name' => $product->name,
                'category' => $product->category?->name,
                'unit' => $product->unit?->short_name ?? 'pcs',
                'selling_price' => (float) $product->selling_price,
                'stock_quantity' => (int) $stockQty,
                'is_low_stock' => $stockQty <= $product->minimum_stock,
                'minimum_stock' => (int) $product->minimum_stock,
            ],
        ], 200);
    }

    /**
     * Validate barcode uniqueness during product creation/edit.
     */
    public function validate(Request $request): JsonResponse
    {
        $user = $request->user();
        $barcode = $request->input('barcode');
        $productId = $request->input('product_id'); // For edit, exclude current product

        if (! $barcode) {
            return response()->json([
                'status' => 'error',
                'valid' => false,
                'message' => 'Barcode tidak boleh kosong.',
            ], 400);
        }

        $query = Product::where('company_id', $user->company_id)
            ->where('barcode', $barcode);

        // If editing, exclude current product
        if ($productId) {
            $query->where('id', '!=', $productId);
        }

        $exists = $query->exists();

        if ($exists) {
            return response()->json([
                'status' => 'error',
                'valid' => false,
                'message' => 'Barcode sudah digunakan oleh produk lain.',
            ], 409);
        }

        return response()->json([
            'status' => 'success',
            'valid' => true,
            'message' => 'Barcode valid dan belum digunakan.',
        ], 200);
    }
}
