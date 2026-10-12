<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\HeldTransaction;
use App\Models\HeldTransactionItem;
use App\Models\Outlet;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shift;
use App\Models\Stock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class POSController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (! $user->hasPermissionTo('access-pos')) {
            abort(403, 'Anda tidak memiliki hak akses ke halaman POS Kasir.');
        }

        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

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
        $customers = Customer::where('company_id', $user->company_id)->get(['id', 'code', 'name', 'phone', 'points', 'credit_balance', 'credit_limit']);
        $discounts = Discount::where('is_active', true)->get();

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
            'discounts' => $discounts,
            'heldCarts' => $heldTransactions,
            'heldTransactions' => $heldTransactions,
            'recentSales' => $recentSales,
            'currentShift' => $currentShift,
        ]);
    }

    public function customerDisplay(Request $request): Response
    {
        $user = $request->user();
        $pairCode = trim($request->input('code') ?? $request->input('pair_code') ?? '');
        $activeOutletId = $this->resolveScopedOutletId($request);
        $outletId = $request->input('outlet_id') ?? $activeOutletId;
        $outlet = null;

        if (! empty($pairCode)) {
            $outlet = Outlet::where('display_pair_token', $pairCode)->first();
        }

        // Fallback hanya untuk user yang sudah login; guest wajib memakai pair code.
        if (! $outlet && $outletId && $user) {
            $outlet = Outlet::where('id', $outletId)
                ->where('company_id', $user->company_id)
                ->first();
        }

        return Inertia::render('POS/CustomerDisplayPage', [
            'outlet' => $outlet,
            'outletId' => $outlet?->id,
        ]);
    }

    public function broadcastState(Request $request)
    {
        $user = $request->user();
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');
        $outletId = $request->input('outlet_id') ?? $activeOutletId;

        // Pastikan outlet milik perusahaan user yang login (cegah broadcast ke outlet tenant lain)
        $outlet = Outlet::where('id', $outletId)
            ->where('company_id', $user->company_id)
            ->first();

        if (! $outlet) {
            return response()->json(['status' => false, 'message' => 'Outlet tidak ditemukan atau tidak memiliki akses.'], 403);
        }

        // Hanya ambil field yang diperlukan dari payload, jangan teruskan semua request mentah
        $payload = $request->only([
            'type', 'items', 'subtotal', 'discountAmount', 'taxAmount',
            'grandTotal', 'customerName', 'cashierName', 'note',
        ]);
        $payload['outlet_id'] = $outlet->id;
        $payload['outlet_name'] = $outlet->name;

        // Store isolated realtime state by globally unique outlet ID
        Cache::put("customer_display_state_{$outlet->id}", $payload, 3600);

        return response()->json(['status' => true]);
    }

    public function getState(Request $request)
    {
        $user = $request->user();
        $pairCode = trim($request->input('pair_code') ?? $request->input('code') ?? '');
        $activeOutletId = $this->resolveScopedOutletId($request);
        $outletId = $request->input('outlet_id') ?? $activeOutletId;
        $outlet = null;

        if (! empty($pairCode)) {
            $outlet = Outlet::where('display_pair_token', $pairCode)->first();
            if ($outlet) {
                $outletId = $outlet->id;
            }
        } elseif (! $user) {
            // Guest wajib menggunakan pair_code untuk mencegah enumerasi outlet_id
            // (menebak ID numerik untuk membaca isi keranjang tenant lain).
            return response()->json([
                'type' => 'CART_UPDATE',
                'items' => [],
                'subtotal' => 0,
                'discountAmount' => 0,
                'taxAmount' => 0,
                'grandTotal' => 0,
            ]);
        }

        // Jika user login, batasi outlet ke company miliknya.
        if ($user && $outletId) {
            $outlet = Outlet::where('id', $outletId)
                ->where('company_id', $user->company_id)
                ->first();
            if (! $outlet) {
                $outletId = null;
            }
        }

        $state = null;
        if ($outletId) {
            $state = Cache::get("customer_display_state_{$outletId}");
        }

        if (empty($state)) {
            $state = [
                'type' => 'CART_UPDATE',
                'items' => [],
                'subtotal' => 0,
                'discountAmount' => 0,
                'taxAmount' => 0,
                'grandTotal' => 0,
            ];
        }

        return response()->json($state);
    }

    public function holdCart(Request $request): RedirectResponse
    {
        $user = $request->user();
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        $activeShift = Shift::where('outlet_id', $activeOutletId)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (! $activeShift && ! $user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
            return back()->with('error', 'Shift kasir belum dibuka! Silakan buka shift kasir terlebih dahulu.');
        }

        $validated = $request->validate([
            'customer_id' => ['nullable', Rule::exists('customers', 'id')->where('company_id', $request->user()->company_id)],
            'reference_note' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', Rule::exists('products', 'id')->where('company_id', $request->user()->company_id)],
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
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        $held = HeldTransaction::where('outlet_id', $activeOutletId)
            ->where('id', $id)
            ->firstOrFail();

        $held->delete();

        return back()->with('success', 'Transaksi ditahan telah dilanjutkan dan dihapus dari daftar hold.');
    }
}
