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
        $query = Sale::with(['outlet.company', 'cashier', 'customer', 'items', 'payments']);

        if (!$user->hasRole('SUPER_ADMIN')) {
            if (!$user->company_id) {
                abort(403, 'Akun Anda belum terhubung ke company manapun.');
            }

            $query->whereHas('outlet', fn ($q) => $q->where('company_id', $user->company_id));
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

    public function printHtml(Request $request, int $id)
    {
        $user = $request->user();
        $query = Sale::with(['outlet.company', 'cashier', 'customer', 'items', 'payments']);

        if (!$user->hasRole('SUPER_ADMIN')) {
            if (!$user->company_id) {
                abort(403, 'Akun Anda belum terhubung ke company manapun.');
            }

            $query->whereHas('outlet', fn ($q) => $q->where('company_id', $user->company_id));
        }

        $sale = $query->findOrFail($id);
        $paperWidth = (int) $request->input('width', 58);

        return view('print.receipt', [
            'sale' => $sale,
            'paperWidth' => $paperWidth === 80 ? 80 : 58,
        ]);
    }
}
