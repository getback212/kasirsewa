<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Keuangan Toko - {{ $outletName }}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.5; padding: 20px; background: #fff; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; color: #0f172a; letter-spacing: 1px; }
        .header p { margin: 4px 0 0; color: #64748b; font-size: 11px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .card { border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; background: #f8fafc; }
        .card .title { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
        .card .val { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px; font-family: monospace; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
        th { background: #f1f5f9; font-size: 11px; font-weight: bold; }
        .text-right { text-align: right; }
        .section-title { font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #0f172a; border-left: 4px solid #2563eb; padding-left: 8px; }
        @media print {
            @page { size: A4 portrait; margin: 12mm; }
            .no-print { display: none !important; }
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">🖨️ Cetak / Simpan Ke PDF</button>
    </div>

    <div class="header">
        <h1>{{ $outletName }}</h1>
        <p>LAPORAN ANALITIK KEUANGAN & MARGIN LABA TOKO</p>
        <p>Periode: <strong>{{ $analytics['startDate'] }}</strong> s/d <strong>{{ $analytics['endDate'] }}</strong> | Dicetak: {{ date('d/m/Y H:i') }} WIB</p>
    </div>

    <div class="grid">
        <div class="card">
            <div class="title">Total Omzet Penjualan</div>
            <div class="val" style="color: #16a34a;">Rp {{ number_format($analytics['totalRevenue'], 0, ',', '.') }}</div>
        </div>
        <div class="card">
            <div class="title">Modal HPP (COGS)</div>
            <div class="val">Rp {{ number_format($analytics['cogs'], 0, ',', '.') }}</div>
        </div>
        <div class="card">
            <div class="title">Laba Kotor (Gross Profit)</div>
            <div class="val" style="color: #2563eb;">Rp {{ number_format($analytics['grossProfit'], 0, ',', '.') }}</div>
        </div>
        <div class="card">
            <div class="title">Laba Bersih (Net Profit)</div>
            <div class="val" style="color: {{ $analytics['netProfit'] >= 0 ? '#16a34a' : '#dc2626' }};">
                Rp {{ number_format($analytics['netProfit'], 0, ',', '.') }}
            </div>
        </div>
    </div>

    <div class="section-title">1. Ringkasan Transaksi, Biaya Operasional & Laba Bersih</div>
    <table>
        <tr>
            <th>Metrik Keuangan</th>
            <th class="text-right">Nilai / Nominal</th>
        </tr>
        <tr>
            <td>Total Transaksi Selesai</td>
            <td class="text-right"><strong>{{ $analytics['transactionCount'] }} Transaksi</strong></td>
        </tr>
        <tr>
            <td>Rata-rata Nominal Transaksi (AOV)</td>
            <td class="text-right"><strong>Rp {{ number_format($analytics['averageOrderValue'], 0, ',', '.') }}</strong></td>
        </tr>
        <tr>
            <td>Total Biaya Operasional Toko (Expenses)</td>
            <td class="text-right" style="color: #dc2626;"><strong>- Rp {{ number_format($analytics['totalExpenses'] ?? 0, 0, ',', '.') }}</strong></td>
        </tr>
        <tr>
            <td><strong>Laba Bersih Akhir (Net Profit)</strong></td>
            <td class="text-right" style="color: {{ ($analytics['netProfit'] ?? 0) >= 0 ? '#16a34a' : '#dc2626' }}; font-size: 13px;">
                <strong>Rp {{ number_format($analytics['netProfit'] ?? 0, 0, ',', '.') }} ({{ $analytics['netProfitMargin'] ?? 0 }}%)</strong>
            </td>
        </tr>
    </table>

    <div class="section-title">2. Breakdown Metode Pembayaran</div>
    <table>
        <thead>
            <tr>
                <th>Metode Pembayaran</th>
                <th class="text-right">Jumlah Transaksi</th>
                <th class="text-right">Total Omzet</th>
            </tr>
        </thead>
        <tbody>
            @foreach($analytics['paymentBreakdown'] as $pay)
                @php
                    $payArr = (array) $pay;
                    $methodName = $payArr['label'] ?? $payArr['payment_method'] ?? 'TUNAI';
                    $count = $payArr['count'] ?? 0;
                    $total = (float) ($payArr['total_amount'] ?? 0);
                @endphp
                <tr>
                    <td><strong>{{ strtoupper($methodName) }}</strong></td>
                    <td class="text-right">{{ $count }} Transaksi</td>
                    <td class="text-right"><strong>Rp {{ number_format($total, 0, ',', '.') }}</strong></td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="section-title">3. Top Produk Terlaris (Best Sellers)</div>
    <table>
        <thead>
            <tr>
                <th>Nama Produk</th>
                <th class="text-right">Total Qty Terjual</th>
                <th class="text-right">Total Omzet Penjualan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($analytics['topProducts'] as $prod)
                @php
                    $prodArr = (array) $prod;
                    $name = $prodArr['product_name_snapshot'] ?? $prod->product_name_snapshot ?? 'Produk';
                    $qty = $prodArr['total_qty'] ?? $prod->total_qty ?? 0;
                    $sales = (float) ($prodArr['total_sales'] ?? $prod->total_sales ?? 0);
                @endphp
                <tr>
                    <td>{{ $name }}</td>
                    <td class="text-right">{{ $qty }} Item</td>
                    <td class="text-right"><strong>Rp {{ number_format($sales, 0, ',', '.') }}</strong></td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 600);
        };
    </script>
</body>
</html>
