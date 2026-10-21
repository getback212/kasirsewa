<?php

namespace App\Exports;

use App\Models\Stock;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\PatternFill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;

class InventoryStockExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
{
    protected $outletId;
    protected $outlet;

    public function __construct($outletId, $outlet = null)
    {
        $this->outletId = $outletId;
        $this->outlet = $outlet;
    }

    public function collection(): \Illuminate\Support\Enumerable
    {
        $stocks = Stock::with(['product.category', 'product.unit'])
            ->where('outlet_id', $this->outletId)
            ->get();

        // Sort by status: HABIS → MENIPIS → AMAN
        $sorted = $stocks->sortBy(function ($item) {
            $qty = (float) $item->quantity;
            $minStock = (float) ($item->product->minimum_stock ?? 5);
            if ($qty <= 0) return 0; // HABIS first
            if ($qty <= $minStock) return 1; // MENIPIS second
            return 2; // AMAN last
        })->values();

        $data = [];
        $totalQty = 0;
        $totalAssetValue = 0;
        $totalMarginValue = 0;

        foreach ($sorted as $item) {
            $product = $item->product;
            if (!$product) {
                continue;
            }

            $qty = (float) $item->quantity;
            $minStock = (float) ($product->minimum_stock ?? 5);
            $hpp = (float) ($product->purchase_price ?? 0);
            $sellPrice = (float) ($product->selling_price ?? 0);
            $marginPercent = $hpp > 0 ? round((($sellPrice - $hpp) / $hpp) * 100, 2) : 0;
            $assetVal = $qty * $hpp;
            $marginVal = $qty * ($sellPrice - $hpp);

            $status = $qty <= 0 ? 'HABIS' : ($qty <= $minStock ? 'MENIPIS' : 'AMAN');

            $data[] = [
                $product->sku ?? '-',
                $product->name ?? 'Produk',
                $product->category->name ?? 'Umum',
                $product->unit->short_name ?? 'pcs',
                $qty,
                $minStock,
                $hpp,
                $sellPrice,
                $marginPercent,
                $assetVal,
                $status,
            ];

            $totalQty += $qty;
            $totalAssetValue += $assetVal;
            $totalMarginValue += $marginVal;
        }

        // Add summary rows
        $data[] = [];
        $data[] = ['=== RINGKASAN TOTAL ==='];
        $data[] = ['Total Jumlah Stok (Unit):', $totalQty];
        $data[] = ['Total Nilai Aset (HPP):', $totalAssetValue];
        $data[] = ['Total Potensi Margin:', $totalMarginValue];
        if ($totalAssetValue > 0) {
            $overallMarginPercent = round(($totalMarginValue / $totalAssetValue) * 100, 2);
            $data[] = ['Margin Keseluruhan (%):', $overallMarginPercent];
        }

        return collect($data);
    }

    public function headings(): array
    {
        return [
            'SKU / BARCODE',
            'NAMA PRODUK',
            'KATEGORI',
            'SATUAN',
            'STOK AKHIR',
            'STOK MINIMAL',
            'HARGA HPP (Beli)',
            'HARGA JUAL',
            'MARGIN (%)',
            'TOTAL NILAI ASET (HPP)',
            'STATUS STOK',
        ];
    }

    public function styles(Worksheet $sheet): ?array
    {
        $headerFont = new Font([
            'bold' => true,
            'color' => new Color('FFFFFF'),
            'size' => 11,
        ]);

        $headerFill = new PatternFill([
            'fillType' => PatternFill::FILL_SOLID,
            'startColor' => new Color('1F2937'),
            'endColor' => new Color('1F2937'),
        ]);

        $headerAlignment = new Alignment([
            'horizontal' => Alignment::HORIZONTAL_CENTER,
            'vertical' => Alignment::VERTICAL_CENTER,
            'wrapText' => true,
        ]);

        $headerBorder = new Border([
            'allBorders' => new \PhpOffice\PhpSpreadsheet\Style\BorderStyle([
                'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\BorderStyle::BORDER_THIN,
                'color' => new Color('000000'),
            ]),
        ]);

        // Apply header styling
        $sheet->getStyle('A1:K1')->applyFromArray([
            'font' => $headerFont,
            'fill' => $headerFill,
            'alignment' => $headerAlignment,
            'borders' => $headerBorder,
        ]);

        // Apply data row styling
        foreach ($sheet->getRowIterator() as $row) {
            $rowIndex = $row->getRowIndex();
            if ($rowIndex > 1) {
                $sheet->getStyle("A{$rowIndex}:K{$rowIndex}")->applyFromArray([
                    'borders' => new Border([
                        'bottom' => new \PhpOffice\PhpSpreadsheet\Style\BorderStyle([
                            'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\BorderStyle::BORDER_THIN,
                            'color' => new Color('E5E7EB'),
                        ]),
                    ]),
                ]);
            }
        }

        // Alternate row colors
        foreach (range(2, $sheet->getHighestRow(), 2) as $row) {
            $sheet->getStyle("A{$row}:K{$row}")->getFill()->setFillType(PatternFill::FILL_SOLID)
                ->getStartColor()->setARGB('F3F4F6');
        }

        // Status column coloring
        foreach ($sheet->getRowIterator(2) as $row) {
            $rowIndex = $row->getRowIndex();
            $statusCell = $sheet->getCell("K{$rowIndex}");
            $status = $statusCell->getValue();

            if ($status === 'HABIS') {
                $statusCell->getStyle()->getFill()->setFillType(PatternFill::FILL_SOLID)
                    ->getStartColor()->setARGB('FEE2E2');
            } elseif ($status === 'MENIPIS') {
                $statusCell->getStyle()->getFill()->setFillType(PatternFill::FILL_SOLID)
                    ->getStartColor()->setARGB('FEF3C7');
            } elseif ($status === 'AMAN') {
                $statusCell->getStyle()->getFill()->setFillType(PatternFill::FILL_SOLID)
                    ->getStartColor()->setARGB('DCFCE7');
            }
        }

        return [];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15,
            'B' => 25,
            'C' => 12,
            'D' => 10,
            'E' => 12,
            'F' => 12,
            'G' => 15,
            'H' => 15,
            'I' => 12,
            'J' => 18,
            'K' => 12,
        ];
    }
}
