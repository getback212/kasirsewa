<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\Inventory\ProcessStockOpnameAction;
use App\Exceptions\InventoryTransactionException;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockOpname;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StockOpnameController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

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
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', Rule::exists('products', 'id')->where(function ($query) use ($user) {
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
        } catch (InventoryTransactionException $e) {
            return redirect()->back()->with('error', $e->getUserMessage())->withInput();
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->with('error', $e->getMessage())->withInput();
        } catch (Exception $e) {
            Log::error('StockOpname store error: '.$e->getMessage(), ['exception' => $e]);

            return redirect()->back()->with('error', 'Terjadi kesalahan saat memproses audit stok. Hubungi admin jika masalah berlanjut.')->withInput();
        }
    }
}
