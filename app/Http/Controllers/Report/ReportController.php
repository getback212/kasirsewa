<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Services\Report\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request, ReportService $reportService): Response
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('view-reports-financial')) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat Laporan Keuangan!');
        }

        $activeOutletId = session('active_outlet_id', $user->outlet_id);
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $analytics = $reportService->getAnalyticsSummary($activeOutletId, $startDate, $endDate);

        return Inertia::render('Reports/Index', [
            'analytics' => $analytics,
        ]);
    }

    public function exportExcel(Request $request, ReportService $reportService): StreamedResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('view-reports-financial')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengekspor Laporan Keuangan!');
        }

        $activeOutletId = session('active_outlet_id', $user->outlet_id);
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $analytics = $reportService->getAnalyticsSummary($activeOutletId, $startDate, $endDate);

        $fileName = 'Laporan_Keuangan_' . ($startDate ?? date('Y-m-01')) . '_s.d_' . ($endDate ?? date('Y-m-d')) . '.xlsx';

        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($analytics) {
            $file = fopen('php://output', 'w');
            
            // UTF-8 BOM for Excel Compatibility
            fputs($file, "\xEF\xBB\xBF");

            // Header Judul
            fputcsv($file, ['=======================================================']);
            fputcsv($file, ['        LAPORAN ANALITIK KEUANGAN & MARGIN LABA TOKO   ']);
            fputcsv($file, ['=======================================================']);
            fputcsv($file, ['Periode Tanggal:', $analytics['startDate'] . ' s/d ' . $analytics['endDate']]);
            fputcsv($file, ['Tanggal Dicetak:', date('d/m/Y H:i:s')]);
            fputcsv($file, []);

            // Ringkasan Utama Keuangan
            fputcsv($file, ['--- 1. RINGKASAN METRIK KEUANGAN & PROFIT MARGIN ---']);
            fputcsv($file, ['NAMA METRIK', 'NOMINAL / NILAI']);
            fputcsv($file, ['Total Omzet Penjualan', 'Rp ' . number_format($analytics['totalRevenue'], 0, ',', '.')]);
            fputcsv($file, ['Modal HPP (COGS)', 'Rp ' . number_format($analytics['cogs'], 0, ',', '.')]);
            fputcsv($file, ['Laba Kotor (Gross Profit)', 'Rp ' . number_format($analytics['grossProfit'], 0, ',', '.')]);
            fputcsv($file, ['Margin Laba Kotor (%)', $analytics['profitMargin'] . '%']);
            fputcsv($file, ['Total Biaya Operasional Toko (Expenses)', 'Rp ' . number_format($analytics['totalExpenses'] ?? 0, 0, ',', '.')]);
            fputcsv($file, ['Laba Bersih Toko (Net Profit)', 'Rp ' . number_format($analytics['netProfit'] ?? 0, 0, ',', '.')]);
            fputcsv($file, ['Margin Laba Bersih (%)', ($analytics['netProfitMargin'] ?? 0) . '%']);
            fputcsv($file, ['Total Transaksi Selesai', $analytics['transactionCount'] . ' Transaksi']);
            fputcsv($file, ['Rata-rata Transaksi (AOV)', 'Rp ' . number_format($analytics['averageOrderValue'], 0, ',', '.')]);
            fputcsv($file, []);

            // Breakdown Metode Pembayaran
            fputcsv($file, ['--- 2. BREAKDOWN METODE PEMBAYARAN ---']);
            fputcsv($file, ['METODE PEMBAYARAN', 'JUMLAH TRANSAKSI', 'TOTAL NOMINAL']);
            foreach ($analytics['paymentBreakdown'] as $pay) {
                $payArr = (array) $pay;
                $label = $payArr['label'] ?? $payArr['payment_method'] ?? 'TUNAI';
                $count = $payArr['count'] ?? 0;
                $total = (float) ($payArr['total_amount'] ?? 0);
                fputcsv($file, [
                    strtoupper($label),
                    $count . ' Transaksi',
                    'Rp ' . number_format($total, 0, ',', '.')
                ]);
            }
            fputcsv($file, []);

            // Top Produk Terlaris
            fputcsv($file, ['--- 3. TOP PRODUK TERLARIS (BEST SELLERS) ---']);
            fputcsv($file, ['NAMA PRODUK', 'TOTAL QTY TERJUAL', 'TOTAL OMZET PENJUALAN']);
            foreach ($analytics['topProducts'] as $prod) {
                $prodArr = (array) $prod;
                $name = $prodArr['product_name_snapshot'] ?? $prod->product_name_snapshot ?? 'Produk';
                $qty = $prodArr['total_qty'] ?? $prod->total_qty ?? 0;
                $sales = (float) ($prodArr['total_sales'] ?? $prod->total_sales ?? 0);
                fputcsv($file, [
                    $name,
                    $qty . ' Item',
                    'Rp ' . number_format($sales, 0, ',', '.')
                ]);
            }
            fputcsv($file, []);

            // Rincian Tren Harian
            fputcsv($file, ['--- 4. RINCIAN OMZET TREN HARIAN ---']);
            fputcsv($file, ['TANGGAL', 'JUMLAH TRANSAKSI', 'TOTAL OMZET HARIAN']);
            foreach ($analytics['dailyTrend'] as $trend) {
                $trendArr = (array) $trend;
                $date = $trendArr['date'] ?? $trend->date ?? date('Y-m-d');
                $tx = $trendArr['transactions'] ?? $trend->transactions ?? 0;
                $rev = (float) ($trendArr['revenue'] ?? $trend->revenue ?? 0);
                fputcsv($file, [
                    $date,
                    $tx . ' Transaksi',
                    'Rp ' . number_format($rev, 0, ',', '.')
                ]);
            }

            fclose($file);
        }, 200, $headers);
    }

    public function exportPdf(Request $request, ReportService $reportService)
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('view-reports-financial')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mencetak Laporan Keuangan!');
        }

        $activeOutletId = session('active_outlet_id', $user->outlet_id);
        $outlet = \App\Models\Outlet::find($activeOutletId);
        $outletName = $outlet?->name ?? 'KasirSewa Store';

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $analytics = $reportService->getAnalyticsSummary($activeOutletId, $startDate, $endDate);

        return view('reports.pdf', [
            'analytics' => $analytics,
            'outletName' => $outletName,
        ]);
    }
}
