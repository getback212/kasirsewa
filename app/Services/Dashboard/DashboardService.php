<?php

namespace App\Services\Dashboard;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Stock;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardService
{
    public function getDashboardData(User $user, int $outletId): array
    {
        $todayStart = Carbon::today()->startOfDay();
        $todayEnd = Carbon::today()->endOfDay();

        $isManagement = $user->hasRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']);

        // 1. Sales Query Scope
        $salesQuery = Sale::where('outlet_id', $outletId)
            ->where('transaction_status', 'completed')
            ->whereBetween('sale_date', [$todayStart, $todayEnd]);

        if (! $isManagement) {
            // Cashier role only sees their own sales
            $salesQuery->where('cashier_id', $user->id);
        }

        $todaySalesTotal = (float) $salesQuery->sum('grand_total');
        $todayTransactionCount = (int) $salesQuery->count();
        $averageTransaction = $todayTransactionCount > 0 ? $todaySalesTotal / $todayTransactionCount : 0.00;

        // 2. Gross Profit & COGS (Management Only)
        $todayCogs = 0.00;
        $todayGrossProfit = 0.00;

        if ($isManagement) {
            $todayCogs = (float) SaleItem::whereHas('sale', function ($q) use ($outletId, $todayStart, $todayEnd) {
                $q->where('outlet_id', $outletId)
                  ->where('transaction_status', 'completed')
                  ->whereBetween('sale_date', [$todayStart, $todayEnd]);
            })->sum(DB::raw('quantity * cost_price_snapshot'));

            $todayGrossProfit = max(0, $todaySalesTotal - $todayCogs);
        }

        // 3. Low Stock Items Alert List
        $lowStockProducts = Product::with(['unit'])
            ->where('company_id', $user->company_id)
            ->where('is_active', true)
            ->get()
            ->filter(function ($product) use ($outletId) {
                $stockQty = Stock::where('outlet_id', $outletId)
                    ->where('product_id', $product->id)
                    ->value('quantity') ?? 0.00;
                return $stockQty <= $product->minimum_stock;
            })
            ->map(function ($product) use ($outletId) {
                $stockQty = Stock::where('outlet_id', $outletId)
                    ->where('product_id', $product->id)
                    ->value('quantity') ?? 0.00;

                return [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'stock' => (float) $stockQty,
                    'minimum_stock' => $product->minimum_stock,
                    'unit' => $product->unit ? $product->unit->short_name : 'pcs',
                ];
            })
            ->values();

        // 4. Recent Transactions Feed
        $recentSalesQuery = Sale::with(['cashier', 'customer', 'payments'])
            ->where('outlet_id', $outletId)
            ->latest('sale_date')
            ->limit(10);

        if (! $isManagement) {
            $recentSalesQuery->where('cashier_id', $user->id);
        }

        $recentSales = $recentSalesQuery->get()->map(function ($s) {
            $payment = $s->payments->first();
            return [
                'id' => $s->id,
                'invoice_number' => $s->invoice_number,
                'sale_date' => $s->sale_date->format('d/m/Y H:i'),
                'cashier_name' => $s->cashier ? $s->cashier->name : 'Kasir',
                'customer_name' => $s->customer ? $s->customer->name : 'Pelanggan Umum',
                'grand_total' => (float) $s->grand_total,
                'payment_method' => $payment ? strtoupper($payment->payment_method) : 'CASH',
                'status' => $s->transaction_status,
            ];
        });

        // 5. Hourly Sales Trend Today (Cross DB dialect support for PgSQL & SQLite Tests)
        $hourExpression = DB::getDriverName() === 'sqlite'
            ? "strftime('%H', sale_date)"
            : "EXTRACT(HOUR FROM sale_date)";

        $hourlySales = Sale::where('outlet_id', $outletId)
            ->where('transaction_status', 'completed')
            ->whereBetween('sale_date', [$todayStart, $todayEnd])
            ->select(DB::raw("{$hourExpression} as hour"), DB::raw('SUM(grand_total) as total'))
            ->groupBy(DB::raw($hourExpression))
            ->orderBy(DB::raw($hourExpression))
            ->get();

        return [
            'todaySalesTotal' => $todaySalesTotal,
            'todayTransactionCount' => $todayTransactionCount,
            'averageTransaction' => round($averageTransaction, 2),
            'todayGrossProfit' => $todayGrossProfit,
            'todayCogs' => $todayCogs,
            'lowStockCount' => $lowStockProducts->count(),
            'lowStockProducts' => $lowStockProducts->take(5),
            'recentSales' => $recentSales,
            'hourlySales' => $hourlySales,
            'isManagement' => $isManagement,
        ];
    }
}
