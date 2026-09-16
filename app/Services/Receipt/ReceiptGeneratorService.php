<?php

namespace App\Services\Receipt;

use App\Models\Sale;

class ReceiptGeneratorService
{
    public function formatTextReceipt(Sale $sale, int $paperWidth = 58): string
    {
        $sale->load(['outlet.company', 'cashier', 'customer', 'items', 'payments']);

        // Standard ESC/POS Character Matrix Width: 58mm = 28 chars (Ultra Safe), 80mm = 42 chars
        $width = $paperWidth === 80 ? 42 : 28;
        $divider = str_repeat('-', $width);

        $lines = [];
        $lines[] = $this->center(strtoupper($sale->outlet->name ?? 'STORE UTAMA'), $width);
        if ($sale->outlet->address) {
            $lines[] = $this->center($sale->outlet->address, $width);
        }
        if ($sale->outlet->phone) {
            $lines[] = $this->center("Telp: {$sale->outlet->phone}", $width);
        }
        $lines[] = $divider;

        $lines[] = "No  : {$sale->invoice_number}";
        $lines[] = "Tgl : " . $sale->sale_date->format('d/m/Y H:i');
        $lines[] = "Ksr : " . ($sale->cashier->name ?? 'Kasir');
        if ($sale->customer) {
            $lines[] = "Plg : " . $sale->customer->name;
        }
        $lines[] = $divider;

        foreach ($sale->items as $item) {
            $name = $item->product_name_snapshot;
            if (mb_strlen($name) > $width) {
                $nameLines = explode("\n", wordwrap($name, $width, "\n", true));
                foreach ($nameLines as $nl) {
                    $lines[] = $nl;
                }
            } else {
                $lines[] = $name;
            }
            $qtyPrice = number_format($item->quantity, 0) . 'x ' . 'Rp ' . number_format($item->price_snapshot, 0, ',', '.');
            $subtotal = 'Rp ' . number_format($item->subtotal, 0, ',', '.');
            $lines[] = $this->twoColumns($qtyPrice, $subtotal, $width);
        }

        $lines[] = $divider;
        $lines[] = $this->twoColumns('Subtotal', 'Rp ' . number_format($sale->subtotal, 0, ',', '.'), $width);

        if ($sale->discount_amount > 0) {
            $lines[] = $this->twoColumns('Diskon', '-Rp ' . number_format($sale->discount_amount, 0, ',', '.'), $width);
        }

        if ($sale->tax_amount > 0) {
            $taxPercent = $sale->outlet->tax_percentage ? (int) $sale->outlet->tax_percentage : 11;
            $lines[] = $this->twoColumns("PPN ({$taxPercent}%)", 'Rp ' . number_format($sale->tax_amount, 0, ',', '.'), $width);
        }

        $lines[] = $divider;
        $lines[] = $this->twoColumns('TOTAL', 'Rp ' . number_format($sale->grand_total, 0, ',', '.'), $width);

        foreach ($sale->payments as $payment) {
            $methodLabel = strtoupper($payment->payment_method);
            $lines[] = $this->twoColumns("Bayar ({$methodLabel})", 'Rp ' . number_format($payment->amount, 0, ',', '.'), $width);
        }

        $lines[] = $this->twoColumns('Kembali', 'Rp ' . number_format($sale->change_amount, 0, ',', '.'), $width);
        $lines[] = $divider;

        $lines[] = $this->center('Terima Kasih Atas Kunjungan Anda', $width);
        $lines[] = $this->center('Barang Yang Sudah Dibeli', $width);
        $lines[] = $this->center('Tidak Dapat Ditukar/Dikembalikan', $width);
        $lines[] = $divider;

        return implode("\n", $lines);
    }

    private function center(string $text, int $width): string
    {
        if (mb_strlen($text) > $width) {
            $lines = explode("\n", wordwrap($text, $width, "\n", true));
            $formatted = [];
            foreach ($lines as $line) {
                $formatted[] = str_pad($line, $width, ' ', STR_PAD_BOTH);
            }
            return implode("\n", $formatted);
        }
        return str_pad($text, $width, ' ', STR_PAD_BOTH);
    }

    private function alignKeyValue(string $label, string $val, int $width, int $colonPos): string
    {
        $paddedLabel = str_pad($label, $colonPos, ' ', STR_PAD_RIGHT);
        return $paddedLabel . $val;
    }

    private function currencyRow(string $leftLabel, string $amountStr, int $width, int $rpStartPos): string
    {
        $rpLabel = 'Rp ';
        // Jika label di sebelah kiri terlalu panjang, jangan dipotong paksa
        // Gunakan format 2 kolom standar: Left (spasi) Rp Amount
        $rightStr = $rpLabel . $amountStr;
        $leftWidth = $width - strlen($rightStr);

        if ($leftWidth < 1) {
            // Jika melebihi lebar 1 baris, pisah jadi 2 baris (nama/info dulu baru nominal)
            return $leftLabel . "\n" . str_pad($rightStr, $width, ' ', STR_PAD_LEFT);
        }

        return str_pad($leftLabel, $leftWidth, ' ', STR_PAD_RIGHT) . $rightStr;
    }

    private function twoColumns(string $left, string $right, int $width): string
    {
        $leftWidth = $width - strlen($right);
        if ($leftWidth < 1) {
            return substr($left, 0, $width - strlen($right)) . $right;
        }
        return str_pad($left, $leftWidth, ' ', STR_PAD_RIGHT) . $right;
    }
}
