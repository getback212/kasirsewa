<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\Outlet;
use App\Models\Product;
use App\Actions\Inventory\SendStockTransferAction;
use App\Actions\Inventory\ReceiveStockTransferAction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Exception;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        $transfers = StockTransfer::with(['fromOutlet', 'toOutlet', 'user', 'items.product'])
            ->where('company_id', $user->company_id)
            ->where(function ($q) use ($activeOutletId) {
                $q->where('from_outlet_id', $activeOutletId)
                  ->orWhere('to_outlet_id', $activeOutletId);
            })
            ->latest()
            ->paginate(15);

        $allOutlets = Outlet::where('company_id', $user->company_id)->get(['id', 'code', 'name']);
        $products = Product::where('company_id', $user->company_id)->get(['id', 'sku', 'name']);

        return Inertia::render('Inventory/StockTransferIndex', [
            'transfers' => $transfers,
            'allOutlets' => $allOutlets,
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'from_outlet_id' => ['required', 'exists:outlets,id'],
            'to_outlet_id' => ['required', 'exists:outlets,id', 'different:from_outlet_id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'note' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated, $user) {
            $transferNumber = 'TRF/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

            $transfer = StockTransfer::create([
                'company_id' => $user->company_id,
                'from_outlet_id' => $validated['from_outlet_id'],
                'to_outlet_id' => $validated['to_outlet_id'],
                'user_id' => $user->id,
                'transfer_number' => $transferNumber,
                'status' => 'draft',
                'note' => $validated['note'] ?? 'Transfer stok antar outlet',
            ]);

            foreach ($validated['items'] as $item) {
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Draft Transfer Stok Antar Outlet berhasil dibuat!');
    }

    public function send(Request $request, int $id, SendStockTransferAction $sendStockTransferAction): RedirectResponse
    {
        try {
            $sendStockTransferAction->execute($id, $request->user()->id);
            return redirect()->back()->with('success', 'Transfer stok berhasil dikirim & stok outlet pengirim berkurang!');
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function receive(Request $request, int $id, ReceiveStockTransferAction $receiveStockTransferAction): RedirectResponse
    {
        try {
            $receiveStockTransferAction->execute($id, $request->user()->id);
            return redirect()->back()->with('success', 'Transfer stok berhasil diterima & stok outlet tujuan bertambah!');
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
