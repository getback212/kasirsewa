<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SalesReturn;
use App\Actions\POS\ProcessSalesReturnAction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Exception;
use Illuminate\Validation\Rule;

class SalesReturnController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('process-return')) {
            abort(403, 'Anda tidak memiliki hak akses untuk memproses retur penjualan & refund.');
        }

        $activeOutletId = session('active_outlet_id', $user->outlet_id);
        $isManagement = $user->hasRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']);

        $salesQuery = Sale::with(['customer', 'cashier', 'items.product'])
            ->where('outlet_id', $activeOutletId)
            ->where('transaction_status', 'completed');

        // Jika Kasir biasa, hanya tampilkan transaksi penjualan miliknya sendiri
        if (!$isManagement) {
            $salesQuery->where('cashier_id', $user->id);
        }

        $sales = $salesQuery->latest('sale_date')->paginate(15);

        $returnsHistoryQuery = SalesReturn::with(['sale', 'cashier', 'items.product'])
            ->where('outlet_id', $activeOutletId);

        if (!$isManagement) {
            $returnsHistoryQuery->where('cashier_id', $user->id);
        }

        $returnsHistory = $returnsHistoryQuery->latest()->get();

        return Inertia::render('Sales/ReturnsIndex', [
            'sales' => $sales,
            'returnsHistory' => $returnsHistory,
            'isManagement' => $isManagement,
        ]);
    }

    public function store(Request $request, ProcessSalesReturnAction $processSalesReturnAction): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('process-return')) {
            abort(403, 'Anda tidak memiliki hak akses untuk memproses retur penjualan & refund.');
        }

        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        $validated = $request->validate([
            'sale_id' => ['required', Rule::exists('sales', 'id')->where(function ($query) use ($activeOutletId) {
                $query->where('outlet_id', $activeOutletId);
            })],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sale_item_id' => ['required', Rule::exists('sale_items', 'id')->where(function ($query) use ($request, $activeOutletId) {
                $query->where('sale_id', $request->input('sale_id'))
                    ->whereIn('sale_id', \App\Models\Sale::where('outlet_id', $activeOutletId)->select('id'));
            })],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        try {
            $processSalesReturnAction->execute(
                outletId: $activeOutletId,
                cashierId: $user->id,
                saleId: $validated['sale_id'],
                returnItems: $validated['items'],
                reason: $validated['reason']
            );

            return redirect()->back()->with('success', 'Retur barang penjualan & pemulihan stok berhasil diproses!');
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
