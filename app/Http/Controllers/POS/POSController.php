<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Stock;
use App\Models\HeldTransaction;
use App\Models\HeldTransactionItem;
use App\Models\Shift;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class POSController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (!$user->hasPermissionTo('access-pos')) {
            abort(403, 'Anda tidak memiliki hak akses ke halaman POS Kasir.');
        }

        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        // Check active open shift
        $currentShift = Shift::where('outlet_id', $activeOutletId)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        // Load Products with live stock from PostgreSQL `stocks` table
        $products = Product::with(['category', 'unit'])
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
                    'barcode' => $product->barcode,
                    'name' => $product->name,
                    'selling_price' => (float) $product->selling_price,
                    'purchase_price' => (float) $product->purchase_price,
                    'stock' => (float) $stockQty,
                    'minimum_stock' => $product->minimum_stock,
                    'category' => $product->category ? ['id' => $product->category->id, 'name' => $product->category->name] : null,
                    'unit' => $product->unit ? ['id' => $product->unit->id, 'short_name' => $product->unit->short_name] : null,
                ];
            });

        $categories = Category::where('company_id', $user->company_id)->where('is_active', true)->get(['id', 'name']);
        $customers = Customer::where('company_id', $user->company_id)->get(['id', 'code', 'name', 'phone']);

        $heldTransactions = HeldTransaction::with(['customer', 'items.product.category', 'items.product.unit'])
            ->where('outlet_id', $activeOutletId)
            ->latest()
            ->get()
            ->map(function ($held) use ($activeOutletId) {
                return [
                    'id' => $held->id,
                    'reference_note' => $held->reference_note,
                    'grand_total' => (float) $held->grand_total,
                    'customer' => $held->customer,
                    'created_at' => $held->created_at->format('Y-m-d H:i:s'),
                    'items' => $held->items->map(function ($item) use ($activeOutletId) {
                        $product = $item->product;
                        $stockQty = $product ? (Stock::where('outlet_id', $activeOutletId)->where('product_id', $product->id)->value('quantity') ?? 0.00) : 0.00;
                        return [
                            'id' => $item->id,
                            'product_id' => $item->product_id,
                            'quantity' => (float) $item->quantity,
                            'price' => (float) $item->price,
                            'discount_amount' => (float) $item->discount_amount,
                            'subtotal' => (float) $item->subtotal,
                            'product' => $product ? [
                                'id' => $product->id,
                                'sku' => $product->sku,
                                'barcode' => $product->barcode,
                                'name' => $product->name,
                                'selling_price' => (float) $product->selling_price,
                                'stock' => (float) $stockQty,
                                'category' => $product->category ? ['id' => $product->category->id, 'name' => $product->category->name] : null,
                                'unit' => $product->unit ? ['id' => $product->unit->id, 'short_name' => $product->unit->short_name] : null,
                            ] : null,
                        ];
                    }),
                ];
            });

        // Load recent completed sales for cashier active shift
        $recentSales = Sale::with(['customer', 'items', 'payments'])
            ->where('outlet_id', $activeOutletId)
            ->where('cashier_id', $user->id)
            ->latest('sale_date')
            ->limit(50)
            ->get();

        return Inertia::render('POS/POSPage', [
            'products' => $products,
            'categories' => $categories,
            'customers' => $customers,
            'heldCarts' => $heldTransactions,
            'heldTransactions' => $heldTransactions,
            'recentSales' => $recentSales,
            'currentShift' => $currentShift,
        ]);
    }

    public function customerDisplay(Request $request): Response
    {
        $user = $request->user();
        $outletId = $request->input('outlet_id') ?? session('active_outlet_id', $user?->outlet_id ?? 1);
        $outlet = \App\Models\Outlet::find($outletId) ?? \App\Models\Outlet::first();

        return Inertia::render('POS/CustomerDisplayPage', [
            'outlet' => $outlet,
            'outletId' => $outletId,
        ]);
    }

    public function broadcastState(Request $request)
    {
        $user = $request->user();
        $outletId = $request->input('outlet_id') ?? session('active_outlet_id', $user?->outlet_id ?? 1);
        
        \Illuminate\Support\Facades\Cache::put("customer_display_state_{$outletId}", $request->all(), 3600);

        return response()->json(['status' => true]);
    }

    public function getState(Request $request)
    {
        $user = $request->user();
        $outletId = $request->input('outlet_id') ?? session('active_outlet_id', $user?->outlet_id ?? 1);
        
        $state = \Illuminate\Support\Facades\Cache::get("customer_display_state_{$outletId}", [
            'type' => 'CART_UPDATE',
            'items' => [],
            'subtotal' => 0,
            'discountAmount' => 0,
            'taxAmount' => 0,
            'grandTotal' => 0,
        ]);

        return response()->json($state);
    }

    public function holdCart(Request $request): RedirectResponse
    {
        $user = $request->user();
        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        $activeShift = Shift::where('outlet_id', $activeOutletId)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$activeShift && !$user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
            return back()->with('error', 'Shift kasir belum dibuka! Silakan buka shift kasir terlebih dahulu.');
        }

        $validated = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'reference_note' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:1'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($user, $activeOutletId, $validated) {
            $grandTotal = 0;
            foreach ($validated['items'] as $item) {
                $sub = ($item['price'] - ($item['discount_amount'] ?? 0)) * $item['quantity'];
                $grandTotal += $sub;
            }

            $held = HeldTransaction::create([
                'outlet_id' => $activeOutletId,
                'cashier_id' => $user->id,
                'customer_id' => $validated['customer_id'] ?? null,
                'reference_note' => $validated['reference_note'],
                'grand_total' => $grandTotal,
            ]);

            foreach ($validated['items'] as $item) {
                $subtotal = ($item['price'] - ($item['discount_amount'] ?? 0)) * $item['quantity'];

                HeldTransactionItem::create([
                    'held_transaction_id' => $held->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'subtotal' => $subtotal,
                ]);
            }
        });

        return back()->with('success', 'Transaksi keranjang berhasil ditahan sementara (Hold).');
    }

    public function destroyHold(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        $held = HeldTransaction::where('outlet_id', $activeOutletId)
            ->where('id', $id)
            ->firstOrFail();

        $held->delete();

        return back()->with('success', 'Transaksi ditahan telah dilanjutkan dan dihapus dari daftar hold.');
    }
}
