<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\Receipt\ReceiptGeneratorService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptController extends Controller
{
    public function show(Request $request, int $id, ReceiptGeneratorService $receiptService): Response
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);
        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        $query = Sale::with(['outlet.company', 'cashier', 'customer', 'items', 'payments']);

        if (!$user->hasRole('SUPER_ADMIN')) {
            $query->where(function ($q) use ($tenantId, $activeOutletId) {
                if ($tenantId) {
                    $q->where('tenant_id', $tenantId)->orWhere('outlet_id', $activeOutletId);
                } else {
                    $q->where('outlet_id', $activeOutletId);
                }
            });
        }

        $sale = $query->findOrFail($id);

        $textReceipt58 = $receiptService->formatTextReceipt($sale, 58);
        $textReceipt80 = $receiptService->formatTextReceipt($sale, 80);

        return Inertia::render('POS/ReceiptPage', [
            'sale' => $sale,
            'textReceipt58' => $textReceipt58,
            'textReceipt80' => $textReceipt80,
        ]);
    }
}
