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
}
