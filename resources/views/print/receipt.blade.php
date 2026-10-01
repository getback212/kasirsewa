<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Struk Thermal #{{ $sale->invoice_number }}</title>
    <style>
        @page {
            size: {{ $paperWidth ?? 58 }}mm auto;
            margin: 0;
        }
        body {
            font-family: 'Consolas', 'Courier New', Courier, 'Lucida Console', ui-monospace, monospace;
            font-size: {{ ($paperWidth ?? 58) == 80 ? '14px' : '12px' }};
            color: #000;
            background: #fff;
            margin: 0;
            padding: 8px;
            width: {{ $paperWidth ?? 58 }}mm;
            box-sizing: border-box;
            line-height: 1.25;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-bottom: 1px dashed #000; margin: 6px 0; }
        .double-line { border-bottom: 2px solid #000; margin: 6px 0; }
        .flex { display: flex; justify-content: space-between; gap: 4px; }
        .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            color: #fff;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-family: sans-serif;
            width: 100%;
            box-sizing: border-box;
        }
        .btn {
            padding: 8px 14px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            border: none;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
        }
        .btn-print { background: #059669; color: #fff; }
        .btn-back { background: #334155; color: #fff; }
        .btn-paper { background: #1e293b; color: #cbd5e1; border: 1px solid #475569; }
        .btn-active { background: #2563eb; color: #fff; border-color: #2563eb; }

        @media print {
            .toolbar { display: none !important; }
            body { padding: 0; width: 100%; }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="toolbar">
        <a href="/pos" class="btn btn-back">← Kembali Ke Kasir</a>
        <div style="display: flex; gap: 6px;">
            <a href="?width=58" class="btn btn-paper {{ ($paperWidth ?? 58) == 58 ? 'btn-active' : '' }}">58mm</a>
            <a href="?width=80" class="btn btn-paper {{ ($paperWidth ?? 58) == 80 ? 'btn-active' : '' }}">80mm</a>
            <button onclick="window.print()" class="btn btn-print">🖨️ Cetak Struk</button>
        </div>
    </div>

    <div class="text-center bold">
        <div style="font-size: 16px; text-transform: uppercase;">{{ $sale->outlet->name ?? 'KASIRSEWA POS' }}</div>
        @if($sale->outlet->address)<div style="font-size: 11px; font-weight: normal;">{{ $sale->outlet->address }}</div>@endif
        @if($sale->outlet->phone)<div style="font-size: 11px; font-weight: normal;">Telp: {{ $sale->outlet->phone }}</div>@endif
    </div>

    <div class="double-line"></div>

    <div>No Nota : <strong>{{ $sale->invoice_number }}</strong></div>
    <div>Tgl Trans: {{ $sale->sale_date ? \Carbon\Carbon::parse($sale->sale_date)->format('d/m/Y H:i') : date('d/m/Y H:i') }}</div>
    <div>Kasir   : {{ $sale->cashier->name ?? 'Kasir Store' }}</div>
    @if($sale->customer)<div>Pembeli : {{ $sale->customer->name }}</div>@endif

    <div class="line"></div>

    <div class="bold">ITEM BELANJAAN:</div>
    @foreach($sale->items as $item)
        <div style="margin-top: 4px;">
            <div class="bold">{{ $item->product_name_snapshot }}</div>
            <div class="flex" style="color: #000; font-size: 12px;">
                <span>{{ (float)$item->quantity }} x Rp {{ number_format($item->price_snapshot, 0, ',', '.') }}</span>
                <span class="bold">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</span>
            </div>
        </div>
    @endforeach

    <div class="line"></div>

    <div class="flex">
        <span>Subtotal</span>
        <span>Rp {{ number_format($sale->subtotal, 0, ',', '.') }}</span>
    </div>

    @if($sale->discount_amount > 0)
        <div class="flex" style="color: #000;">
            <span>Diskon</span>
            <span>-Rp {{ number_format($sale->discount_amount, 0, ',', '.') }}</span>
        </div>
    @endif

    @if($sale->tax_amount > 0)
        <div class="flex">
            <span>PPN ({{ $sale->outlet->tax_percentage ?? 11 }}%)</span>
            <span>Rp {{ number_format($sale->tax_amount, 0, ',', '.') }}</span>
        </div>
    @endif

    <div class="double-line"></div>

    <div class="flex bold" style="font-size: 15px;">
        <span>TOTAL BAYAR</span>
        <span>Rp {{ number_format($sale->grand_total, 0, ',', '.') }}</span>
    </div>

    @foreach($sale->payments as $payment)
        <div class="flex" style="font-size: 12px;">
            <span>Bayar ({{ strtoupper($payment->payment_method) }})</span>
            <span>Rp {{ number_format($payment->amount, 0, ',', '.') }}</span>
        </div>
    @endforeach

    <div class="flex bold" style="font-size: 14px; margin-top: 2px;">
        <span>Kembali</span>
        <span>Rp {{ number_format($sale->change_amount, 0, ',', '.') }}</span>
    </div>

    <div class="double-line"></div>

    <div class="text-center" style="font-size: 11px; margin-top: 8px;">
        Terima Kasih Telah Berbelanja!<br>
        Simpan Struk Ini Sebagai Bukti<br>
        Barang Yang Sudah Dibeli<br>
        Tidak Dapat Ditukar/Dikembalikan
    </div>
</body>
</html>
