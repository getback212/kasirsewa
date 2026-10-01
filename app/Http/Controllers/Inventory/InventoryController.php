<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Product;
use App\Models\Outlet;
use App\Actions\Inventory\AdjustStockAction;
use App\Enums\StockMovementType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        $query = Stock::with(['product.category', 'product.unit'])
            ->where('outlet_id', $activeOutletId);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('sku', 'ilike', "%{$search}%");
            });
        }

        $stocks = $query->paginate(15)->withQueryString();

        $movements = StockMovement::with(['product', 'user'])
            ->where('outlet_id', $activeOutletId)
            ->latest('created_at')
            ->limit(20)
            ->get();

        $allProducts = Product::where('company_id', $user->company_id)->get(['id', 'sku', 'name']);

        return Inertia::render('Inventory/Index', [
            'stocks' => $stocks,
            'movements' => $movements,
            'allProducts' => $allProducts,
            'filters' => $request->only(['search']),
        ]);
    }

    public function adjust(Request $request, AdjustStockAction $adjustStockAction): RedirectResponse
    {
        $user = $request->user();
        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'type' => ['required', 'string'],
            'quantity' => ['required', 'numeric'],
            'note' => ['nullable', 'string'],
        ]);

        try {
            $typeEnum = StockMovementType::from($validated['type']);
            $adjustStockAction->execute(
                outletId: $activeOutletId,
                productId: $validated['product_id'],
                quantityChange: (float) $validated['quantity'],
                type: $typeEnum,
                userId: $user->id,
                note: $validated['note'] ?? 'Penyesuaian stok manual'
            );

            return redirect()->back()->with('success', 'Penyesuaian stok gudang berhasil disimpan!');
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function exportExcel(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $user = $request->user();
        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        $stocks = Stock::with(['product.category', 'product.unit'])
            ->where('outlet_id', $activeOutletId)
            ->get();

        $fileName = 'Laporan_Stok_Gudang_' . date('Ymd_His') . '.xlsx';

        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($stocks) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");

            fputcsv($file, ['=======================================================']);
            fputcsv($file, ['      LAPORAN ASET INVENTARIS & AUDIT STOK BARANG GUDANG ']);
            fputcsv($file, ['=======================================================']);
            fputcsv($file, ['Tanggal Audit:', date('d/m/Y H:i:s')]);
            fputcsv($file, []);

            fputcsv($file, ['SKU / BARCODE', 'NAMA PRODUK', 'KATEGORI', 'SATUAN', 'STOK AKHIR', 'STOK MINIMAL', 'HARGA HPP', 'TOTAL NILAI ASET HPP', 'HARGA JUAL', 'STATUS STOK']);

            foreach ($stocks as $item) {
                $product = $item->product;
                if (!$product) continue;

                $qty = (float) $item->quantity;
                $minStock = (float) ($product->minimum_stock ?? $product->min_stock ?? 5);
                $hpp = (float) ($product->purchase_price ?? $product->buy_price ?? 0);
                $sellPrice = (float) ($product->selling_price ?? $product->price ?? 0);
                $assetVal = $qty * $hpp;

                $status = $qty <= 0 ? 'HABIS' : ($qty <= $minStock ? 'MENIPIS' : 'AMAN');

                fputcsv($file, [
                    $product->sku ?? '-',
                    $product->name ?? 'Produk',
                    $product->category->name ?? 'Umum',
                    $product->unit->short_name ?? 'pcs',
                    $qty,
                    $minStock,
                    'Rp ' . number_format($hpp, 0, ',', '.'),
                    'Rp ' . number_format($assetVal, 0, ',', '.'),
                    'Rp ' . number_format($sellPrice, 0, ',', '.'),
                    $status,
                ]);
            }

            fclose($file);
        }, 200, $headers);
    }

    public function exportPdf(Request $request)
    {
        $user = $request->user();
        $activeOutletId = session('active_outlet_id', $user->outlet_id);
        $outlet = Outlet::find($activeOutletId);
        $outletName = $outlet?->name ?? 'KasirSewa Store';

        $stocks = Stock::with(['product.category', 'product.unit'])
            ->where('outlet_id', $activeOutletId)
            ->get();

        $totalQuantity = 0;
        $totalAssetValue = 0;

        foreach ($stocks as $item) {
            if (!$item->product) continue;
            $qty = (float) $item->quantity;
            $hpp = (float) ($item->product->purchase_price ?? $item->product->buy_price ?? 0);
            $totalQuantity += $qty;
            $totalAssetValue += ($qty * $hpp);
        }

        return view('inventory.pdf', [
            'stocks' => $stocks,
            'outletName' => $outletName,
            'totalQuantity' => $totalQuantity,
            'totalAssetValue' => $totalAssetValue,
        ]);
    }
}
