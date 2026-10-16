<?php

namespace App\Http\Controllers\Purchase;

use App\Actions\Purchase\CreatePurchaseAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\StorePurchaseRequest;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('view-purchases')) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuka menu restok supplier.');
        }

        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        $purchases = Purchase::with(['supplier', 'items.product.unit', 'user'])
            ->where('outlet_id', $activeOutletId)
            ->latest('purchase_date')
            ->paginate(15);

        $suppliers = Supplier::where('company_id', $user->company_id)->get(['id', 'code', 'name', 'phone', 'email', 'address']);

        $products = Product::with(['unit'])
            ->where('company_id', $user->company_id)
            ->where('is_active', true)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'purchase_price' => (float) $product->purchase_price,
                    'unit_name' => $product->unit?->short_name ?? 'pcs',
                ];
            });

        return Inertia::render('Purchases/Index', [
            'purchases' => $purchases,
            'suppliers' => $suppliers,
            'products' => $products,
        ]);
    }

    public function store(StorePurchaseRequest $request, CreatePurchaseAction $createPurchaseAction): RedirectResponse
    {
        $user = $request->user();

        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        $validated = $request->validated();

        try {
            $purchase = $createPurchaseAction->execute(
                outletId: $activeOutletId,
                userId: $user->id,
                supplierId: (int) $validated['supplier_id'],
                items: $validated['items'],
                subtotal: (float) $validated['subtotal'],
                discountAmount: (float) ($validated['discount_amount'] ?? 0),
                taxAmount: (float) ($validated['tax_amount'] ?? 0),
                grandTotal: (float) $validated['grand_total'],
                note: $validated['note'] ?? null
            );

            return redirect()->back()->with('success', 'Transaksi restok barang dari supplier berhasil disimpan!');
        } catch (\App\Exceptions\InventoryTransactionException $e) {
            return redirect()->back()->with('error', $e->getUserMessage())->withInput();
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->with('error', $e->getMessage())->withInput();
        } catch (Exception $e) {
            Log::error('Purchase store error: ' . $e->getMessage(), ['exception' => $e]);
            return redirect()->back()->with('error', 'Terjadi kesalahan saat menyimpan transaksi restok. Hubungi admin jika masalah berlanjut.')->withInput();
        }
    }
}
