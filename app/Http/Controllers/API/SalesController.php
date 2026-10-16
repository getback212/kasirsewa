<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SalesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $outletId = $request->integer('outlet_id', $user->outlet_id);
        $page = $request->integer('page', 1);
        $limit = $request->integer('limit', 50);
        $dateFrom = $request->date('date_from');
        $dateTo = $request->date('date_to');

        $query = Sale::where('company_id', $user->company_id)
            ->where('outlet_id', $outletId);

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $sales = $query->orderBy('created_at', 'desc')->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'status' => 'success',
            'message' => 'Daftar penjualan berhasil diambil.',
            'data' => [
                'items' => $sales->items()->map(fn ($s) => [
                    'id' => $s->id,
                    'receipt_number' => $s->receipt_number,
                    'customer_name' => $s->customer_name ?? 'Walk-in',
                    'total_items' => (int) $s->total_items,
                    'subtotal' => (float) $s->subtotal,
                    'discount_amount' => (float) $s->discount_amount,
                    'tax_amount' => (float) $s->tax_amount,
                    'grand_total' => (float) $s->grand_total,
                    'payment_method' => $s->payment_method,
                    'status' => $s->status, // completed, hold, cancelled
                    'created_at' => $s->created_at->toIso8601String(),
                ]),
                'pagination' => [
                    'page' => $sales->currentPage(),
                    'limit' => $sales->perPage(),
                    'total' => $sales->total(),
                    'pages' => $sales->lastPage(),
                ],
                'summary' => [
                    'total_sales' => (float) $sales->items()->sum('grand_total'),
                    'total_count' => $sales->total(),
                ],
            ],
        ], 200);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $sale = Sale::where('company_id', $user->company_id)
            ->where('id', $id)
            ->first();

        if (!$sale) {
            return response()->json([
                'status' => 'error',
                'message' => 'Transaksi penjualan tidak ditemukan.',
                'data' => null,
            ], 404);
        }

        $items = $sale->items()->select('id', 'product_id', 'quantity', 'unit_price', 'subtotal')->get();

        return response()->json([
            'status' => 'success',
            'message' => 'Detail transaksi berhasil diambil.',
            'data' => [
                'id' => $sale->id,
                'receipt_number' => $sale->receipt_number,
                'customer_name' => $sale->customer_name,
                'items' => $items->map(fn ($i) => [
                    'product_id' => $i->product_id,
                    'quantity' => (int) $i->quantity,
                    'unit_price' => (float) $i->unit_price,
                    'subtotal' => (float) $i->subtotal,
                ]),
                'subtotal' => (float) $sale->subtotal,
                'discount_amount' => (float) $sale->discount_amount,
                'tax_amount' => (float) $sale->tax_amount,
                'grand_total' => (float) $sale->grand_total,
                'payment_method' => $sale->payment_method,
                'status' => $sale->status,
                'created_at' => $sale->created_at->toIso8601String(),
            ],
        ], 200);
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $outletId = $request->integer('outlet_id', $user->outlet_id);
        $dateFrom = $request->date('date_from');
        $dateTo = $request->date('date_to');

        $query = Sale::where('company_id', $user->company_id)
            ->where('outlet_id', $outletId)
            ->where('status', 'completed');

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $stats = [
            'total_transactions' => (int) $query->count(),
            'total_items' => (int) $query->sum('total_items'),
            'total_revenue' => (float) $query->sum('grand_total'),
            'total_discount' => (float) $query->sum('discount_amount'),
            'total_tax' => (float) $query->sum('tax_amount'),
        ];

        return response()->json([
            'status' => 'success',
            'message' => 'Ringkasan penjualan berhasil diambil.',
            'data' => $stats,
        ], 200);
    }
}
