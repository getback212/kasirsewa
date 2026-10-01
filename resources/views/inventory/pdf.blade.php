<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Stok Barang Gudang - {{ $outletName }}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.5; padding: 20px; background: #fff; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; color: #0f172a; letter-spacing: 1px; }
        .header p { margin: 4px 0 0; color: #64748b; font-size: 11px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .card { border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; background: #f8fafc; }
        .card .title { font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; }
        .card .val { font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 2px; font-family: monospace; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; }
        th { background: #f1f5f9; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .text-right { text-align: right; }
        .badge-danger { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; }
        .badge-warning { background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; }
        .badge-success { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; }
        @media print {
            @page { size: A4 portrait; margin: 12mm; }
            .no-print { display: none !important; }
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="padding: 9px 18px; background: #059669; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">🖨️ Cetak / Simpan Ke PDF</button>
    </div>

    <div class="header">
        <h1>{{ $outletName }}</h1>
        <p>LAPORAN ASET INVENTARIS & AUDIT STOK BARANG GUDANG</p>
        <p>Tanggal Audit: <strong>{{ date('d/m/Y H:i') }} WIB</strong> | Total Item: <strong>{{ count($stocks) }} Produk</strong></p>
    </div>

    <div class="grid">
        <div class="card">
            <div class="title">Total Variasi Item Produk</div>
            <div class="val">{{ count($stocks) }} Item</div>
        </div>
        <div class="card">
            <div class="title">Total Kuantitas Unit Stok</div>
            <div class="val">{{ number_format($totalQuantity, 0, ',', '.') }} Units</div>
        </div>
        <div class="card">
            <div class="title">Total Nilai Aset Stok (HPP)</div>
            <div class="val" style="color: #059669;">Rp {{ number_format($totalAssetValue, 0, ',', '.') }}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 30px;">NO</th>
                <th>SKU / BARCODE</th>
                <th>NAMA PRODUK</th>
                <th>KATEGORI</th>
                <th class="text-right">STOK AKHIR</th>
                <th class="text-right">HARGA HPP</th>
                <th class="text-right">TOTAL NILAI ASET</th>
                <th style="text-align: center;">STATUS</th>
            </tr>
        </thead>
        <tbody>
            @foreach($stocks as $index => $item)
                @php
                    $product = $item->product;
                    $qty = (float) $item->quantity;
                    $minStock = (float) ($product->min_stock ?? 5);
                    $hpp = (float) ($product->buy_price ?? 0);
                    $assetVal = $qty * $hpp;
                @endphp
                <tr>
                    <td style="text-align: center;">{{ $index + 1 }}</td>
                    <td style="font-family: monospace; font-weight: bold;">{{ $product->sku ?? '-' }}</td>
                    <td><strong>{{ $product->name ?? 'Produk' }}</strong></td>
                    <td>{{ $product->category->name ?? 'Umum' }}</td>
                    <td class="text-right" style="font-family: monospace; font-weight: bold;">
                        {{ number_format($qty, 0, ',', '.') }} {{ $product->unit->short_name ?? 'pcs' }}
                    </td>
                    <td class="text-right" style="font-family: monospace;">Rp {{ number_format($hpp, 0, ',', '.') }}</td>
                    <td class="text-right" style="font-family: monospace; font-weight: bold;">Rp {{ number_format($assetVal, 0, ',', '.') }}</td>
                    <td style="text-align: center;">
                        @if($qty <= 0)
                            <span class="badge-danger">STOK HABIS</span>
                        @elseif($qty <= $minStock)
                            <span class="badge-warning font-mono">MENIPIS (<= {{ $minStock }})</span>
                        @else
                            <span class="badge-success">AMAN</span>
                        @endif
                    </td>
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
