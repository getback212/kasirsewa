<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockOpname;
use App\Models\Product;
use App\Models\Stock;
use App\Actions\Inventory\ProcessStockOpnameAction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class StockOpnameController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        $opnamesHistory = StockOpname::with(['user', 'items.product'])
            ->where('outlet_id', $activeOutletId)
            ->latest('opname_date')
            ->paginate(15);

        $products = Product::with(['unit'])
            ->where('company_id', $user->company_id)
            ->where('is_active', true)
            ->get()
            ->map(function ($product) use ($activeOutletId) {
                $stockQty = Stock::where('outlet_id', $activeOutletId)
                    ->where('product_id', $product->id)
                    ->value('quantity') ?? 0.00;

                return [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'system_quantity' => (float) $stockQty,
                    'unit' => $product->unit ? $product->unit->short_name : 'pcs',
                ];
            });

        return Inertia::render('Inventory/StockOpnameIndex', [
            'opnamesHistory' => $opnamesHistory,
            'products' => $products,
        ]);
    }

    public function store(Request $request, ProcessStockOpnameAction $processStockOpnameAction): RedirectResponse
    {
        $user = $request->user();
        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', \Illuminate\Validation\Rule::exists('products', 'id')->where(function ($query) use ($user) {
                $query->where('company_id', $user->company_id);
            })],
            'items.*.physical_quantity' => ['required', 'numeric', 'min:0'],
            'items.*.note' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
        ]);

        try {
            $processStockOpnameAction->execute(
                outletId: $activeOutletId,
                userId: $user->id,
                items: $validated['items'],
                note: $validated['note'] ?? null
            );

            return redirect()->back()->with('success', 'Audit Stock Opname berhasil disimpan & stok gudang otomatis disesuaikan!');
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
