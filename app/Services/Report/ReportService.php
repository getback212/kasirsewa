<?php

namespace App\Services\Report;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportService
{
    public function getAnalyticsSummary(int $outletId, ?string $startDate = null, ?string $endDate = null): array
    {
        $start = $startDate ? Carbon::parse($startDate)->startOfDay() : Carbon::now()->startOfMonth();
        $end = $endDate ? Carbon::parse($endDate)->endOfDay() : Carbon::now()->endOfDay();

        // 1. Sales & Revenue Summary
        $salesQuery = Sale::where('outlet_id', $outletId)
            ->where('transaction_status', 'completed')
            ->whereBetween('sale_date', [$start, $end]);

        $totalRevenue = (float) $salesQuery->sum('grand_total');
        $transactionCount = (int) $salesQuery->count();
        $averageOrderValue = $transactionCount > 0 ? $totalRevenue / $transactionCount : 0.00;

        // 2. COGS (Modal HPP) & Profit Calculation
        $cogs = (float) SaleItem::whereHas('sale', function ($q) use ($outletId, $start, $end) {
            $q->where('outlet_id', $outletId)
              ->where('transaction_status', 'completed')
              ->whereBetween('sale_date', [$start, $end]);
        })->sum(DB::raw('quantity * COALESCE(cost_price_snapshot, 0)'));

        $grossProfit = $totalRevenue - $cogs;
        $profitMargin = $totalRevenue > 0 ? ($grossProfit / $totalRevenue) * 100 : 0.00;

        // 2b. Operational Expenses & Net Profit Calculation
        $totalExpenses = (float) \App\Models\Expense::where('outlet_id', $outletId)
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->sum('amount');

        $netProfit = $grossProfit - $totalExpenses;
        $netProfitMargin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0.00;

        // 3. Payment Breakdown
        $paymentBreakdown = Payment::join('sales', 'payments.sale_id', '=', 'sales.id')
            ->where('sales.outlet_id', $outletId)
            ->where('sales.transaction_status', 'completed')
            ->whereBetween('sales.sale_date', [$start, $end])
            ->select(
                'payments.payment_method',
                DB::raw("SUM(CASE WHEN payments.payment_method = 'cash' THEN LEAST(payments.amount, sales.grand_total) ELSE payments.amount END) as total_amount"),
                DB::raw('COUNT(payments.id) as count')
            )
            ->groupBy('payments.payment_method')
            ->get()
            ->map(function ($p) use ($totalRevenue) {
                $totalAmount = (float) $p->total_amount;
                $percentage = $totalRevenue > 0 ? ($totalAmount / $totalRevenue) * 100 : 0.0;
                return [
                    'payment_method' => $p->payment_method,
                    'label' => match($p->payment_method) {
                        'cash' => 'Tunai (Cash)',
                        'qris' => 'QRIS Instant',
                        'debit' => 'EDC Debit',
                        'credit' => 'Kartu Kredit',
                        'bank_transfer' => 'Bank Transfer',
                        default => strtoupper($p->payment_method),
                    },
                    'total_amount' => $totalAmount,
                    'count' => (int) $p->count,
                    'percentage' => round($percentage, 1),
                ];
            });

        // 4. Top 5 Best Selling Products
        $topProducts = SaleItem::whereHas('sale', function ($q) use ($outletId, $start, $end) {
            $q->where('outlet_id', $outletId)
              ->where('transaction_status', 'completed')
              ->whereBetween('sale_date', [$start, $end]);
        })
        ->select('product_name_snapshot', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_sales'))
        ->groupBy('product_name_snapshot')
        ->orderByDesc('total_qty')
        ->limit(5)
        ->get();

        // 5. Daily Sales Trend Chart Data
        $dailyTrend = Sale::where('outlet_id', $outletId)
            ->where('transaction_status', 'completed')
            ->whereBetween('sale_date', [$start, $end])
            ->select(DB::raw('DATE(sale_date) as date'), DB::raw('SUM(grand_total) as revenue'), DB::raw('COUNT(*) as transactions'))
            ->groupBy(DB::raw('DATE(sale_date)'))
            ->orderBy(DB::raw('DATE(sale_date)'))
            ->get();

        // 6. Detailed Transaction History Report
        $transactions = Sale::with(['cashier:id,name', 'customer:id,name,phone', 'payments:id,sale_id,payment_method,amount'])
            ->where('outlet_id', $outletId)
            ->whereBetween('sale_date', [$start, $end])
            ->latest('sale_date')
            ->limit(100)
            ->get();

        // 7. Product Sales & Profitability Breakdown
        $productSales = SaleItem::whereHas('sale', function ($q) use ($outletId, $start, $end) {
            $q->where('outlet_id', $outletId)
              ->where('transaction_status', 'completed')
              ->whereBetween('sale_date', [$start, $end]);
        })
        ->select(
            'product_name_snapshot',
            DB::raw('SUM(quantity) as qty_sold'),
            DB::raw('SUM(subtotal) as total_sales'),
            DB::raw('SUM(quantity * COALESCE(cost_price_snapshot, 0)) as total_cogs'),
            DB::raw('SUM(subtotal - (quantity * COALESCE(cost_price_snapshot, 0))) as item_profit')
        )
        ->groupBy('product_name_snapshot')
        ->orderByDesc('total_sales')
        ->get();

        // 8. Shift Cashier Audit Records
        $shifts = \App\Models\Shift::with(['cashier:id,name'])
            ->where('outlet_id', $outletId)
            ->whereBetween('opened_at', [$start, $end])
            ->latest('opened_at')
            ->get();

        // 9. Expenses Category Breakdown for Income Statement
        $expensesCategory = \App\Models\Expense::where('outlet_id', $outletId)
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->select('category', DB::raw('SUM(amount) as total_amount'), DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->get();

        return [
            'totalRevenue' => $totalRevenue,
            'cogs' => $cogs,
            'grossProfit' => $grossProfit,
            'profitMargin' => round($profitMargin, 2),
            'totalExpenses' => $totalExpenses,
            'netProfit' => $netProfit,
            'netProfitMargin' => round($netProfitMargin, 2),
            'transactionCount' => $transactionCount,
            'averageOrderValue' => round($averageOrderValue, 2),
            'paymentBreakdown' => $paymentBreakdown,
            'topProducts' => $topProducts,
            'dailyTrend' => $dailyTrend,
            'transactions' => $transactions,
            'productSales' => $productSales,
            'shifts' => $shifts,
            'expensesCategory' => $expensesCategory,
            'startDate' => $start->toDateString(),
            'endDate' => $end->toDateString(),
        ];
    }
}
