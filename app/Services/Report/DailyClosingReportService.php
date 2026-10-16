<?php

namespace App\Services\Report;

use App\Models\Expense;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\Shift;
use App\Services\Notification\NotificationDispatcherService;
use Illuminate\Support\Facades\Log;

class DailyClosingReportService
{
    public static function generateAndNotify(Shift $shift): array
    {
        try {
            // Generate report summary
            $summary = static::generateSummary($shift);

            // Send notification to owner
            NotificationDispatcherService::sendDailyClosingReport(
                $shift->outlet->tenant_id,
                $shift->outlet_id,
                $summary
            );

            Log::info('DailyClosingReport generated', [
                'shift_id' => $shift->id,
                'summary' => $summary,
            ]);

            return $summary;
        } catch (\Throwable $e) {
            Log::error('DailyClosingReport generation failed: '.$e->getMessage(), [
                'shift_id' => $shift->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    public static function generateSummary(Shift $shift): array
    {
        $startTime = $shift->opened_at;
        $endTime = $shift->closed_at ?? now();

        // 1. Sales transactions
        $sales = Sale::where('outlet_id', $shift->outlet_id)
            ->where('cashier_id', $shift->user_id)
            ->whereBetween('created_at', [$startTime, $endTime])
            ->where('status', 'completed')
            ->get();

        $totalSales = $sales->sum('grand_total');
        $totalItems = $sales->sum('total_items');
        $totalDiscount = $sales->sum('discount_amount');
        $totalTax = $sales->sum('tax_amount');

        // 2. Payment method breakdown
        $paymentBreakdown = Payment::whereHas('sale', function ($q) use ($shift, $startTime, $endTime) {
            $q->where('outlet_id', $shift->outlet_id)
                ->where('cashier_id', $shift->user_id)
                ->whereBetween('created_at', [$startTime, $endTime])
                ->where('status', 'completed');
        })->groupBy('payment_method')
            ->selectRaw('payment_method, SUM(amount) as total, COUNT(*) as count')
            ->get()
            ->mapWithKeys(fn ($p) => [$p->payment_method => ['total' => (float) $p->total, 'count' => (int) $p->count]]);

        // 3. Expenses
        $expenses = Expense::where('outlet_id', $shift->outlet_id)
            ->whereBetween('created_at', [$startTime, $endTime])
            ->get();

        $totalExpenses = $expenses->sum('amount');
        $expenseByCategory = $expenses->groupBy('category')
            ->map(fn ($group) => $group->sum('amount'));

        // 4. Calculate profit
        $profit = $totalSales - $totalExpenses;
        $profitMargin = $totalSales > 0 ? round(($profit / $totalSales) * 100, 2) : 0;

        // 5. Top products sold (if available)
        $topProducts = \DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.outlet_id', $shift->outlet_id)
            ->where('sales.cashier_id', $shift->user_id)
            ->whereBetween('sales.created_at', [$startTime, $endTime])
            ->where('sales.status', 'completed')
            ->groupBy('sale_items.product_id')
            ->selectRaw('product_id, SUM(sale_items.quantity) as qty, SUM(sale_items.subtotal) as total')
            ->orderByDesc('qty')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'product_id' => $item->product_id,
                'quantity' => (int) $item->qty,
                'total' => (float) $item->total,
            ]);

        return [
            'shift_id' => $shift->id,
            'cashier_name' => $shift->user->name,
            'outlet_name' => $shift->outlet->name,
            'date' => $shift->opened_at->format('Y-m-d'),
            'period' => "{$shift->opened_at->format('H:i')} - {$endTime->format('H:i')}",
            'opening_cash' => (float) $shift->opening_cash,
            'closing_cash' => (float) $shift->closing_cash,
            'expected_cash' => (float) $shift->expected_cash,
            'cash_difference' => (float) $shift->difference,
            'total_transactions' => $sales->count(),
            'total_items' => (int) $totalItems,
            'total_sales' => (float) $totalSales,
            'total_discount' => (float) $totalDiscount,
            'total_tax' => (float) $totalTax,
            'total_expenses' => (float) $totalExpenses,
            'profit' => (float) $profit,
            'profit_margin' => $profitMargin,
            'payment_breakdown' => $paymentBreakdown->toArray(),
            'expense_categories' => $expenseByCategory->toArray(),
            'top_products' => $topProducts->toArray(),
        ];
    }

    public static function generateCSV(Shift $shift): string
    {
        $summary = static::generateSummary($shift);

        $csv = "LAPORAN PENUTUPAN HARIAN TOKO\n";
        $csv .= "Tanggal: {$summary['date']}\n";
        $csv .= "Kasir: {$summary['cashier_name']}\n";
        $csv .= "Toko: {$summary['outlet_name']}\n";
        $csv .= "Periode: {$summary['period']}\n\n";

        $csv .= "RINGKASAN PENJUALAN\n";
        $csv .= "Total Transaksi,{$summary['total_transactions']}\n";
        $csv .= "Total Item,{$summary['total_items']}\n";
        $csv .= 'Total Penjualan,'.number_format($summary['total_sales'], 0)."\n";
        $csv .= 'Diskon,'.number_format($summary['total_discount'], 0)."\n";
        $csv .= 'Pajak,'.number_format($summary['total_tax'], 0)."\n\n";

        $csv .= "PENGELUARAN\n";
        $csv .= 'Total Biaya,'.number_format($summary['total_expenses'], 0)."\n";
        foreach ($summary['expense_categories'] as $category => $amount) {
            $csv .= "{$category},".number_format($amount, 0)."\n";
        }
        $csv .= "\n";

        $csv .= "KEUNTUNGAN\n";
        $csv .= 'Profit,'.number_format($summary['profit'], 0)."\n";
        $csv .= 'Profit Margin,'.$summary['profit_margin']."%\n\n";

        $csv .= "METODE PEMBAYARAN\n";
        foreach ($summary['payment_breakdown'] as $method => $data) {
            $csv .= "{$method},".number_format($data['total'], 0).",({$data['count']} transaksi)\n";
        }

        return $csv;
    }
}
