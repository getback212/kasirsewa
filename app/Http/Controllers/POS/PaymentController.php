<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Actions\POS\CreateSaleAction;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class PaymentController extends Controller
{
    public function checkout(Request $request, CreateSaleAction $createSaleAction): JsonResponse
    {
        return $this->processCheckout($request, $createSaleAction);
    }

    public function processCheckout(Request $request, CreateSaleAction $createSaleAction): JsonResponse
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);
        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        if ($tenantId) {
            $tenant = \App\Models\Tenant::with('subscription.plan')->find($tenantId);
            if ($tenant && $tenant->subscription && $tenant->subscription->plan) {
                $maxTransactions = $tenant->subscription->plan->max_transactions;
                $currentTransactionsCount = \App\Models\Sale::where('tenant_id', $tenantId)->count();

                if ($currentTransactionsCount >= $maxTransactions) {
                    return response()->json([
                        'status' => 'error',
                        'message' => "Batas jumlah transaksi untuk paket '{$tenant->subscription->plan->name}' adalah {$maxTransactions} transaksi. Silakan upgrade paket berlangganan SaaS Anda.",
                    ], 422);
                }
            }
        }

        // Check if cashier has an active open shift
        $activeShift = Shift::where('outlet_id', $activeOutletId)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$activeShift && !$user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Shift kasir belum dibuka! Silakan buka shift kasir terlebih dahulu di menu Shift sebelum melayani transaksi.',
            ], 422);
        }

        $validated = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'payments' => ['required', 'array', 'min:1'],
            'payments.*.method' => ['required', 'string'],
            'payments.*.amount' => ['required', 'numeric', 'min:0'],
            'payments.*.reference_number' => ['nullable', 'string'],
            'subtotal' => ['required', 'numeric', 'min:0'],
            'discount_amount' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['required', 'numeric', 'min:0'],
            'grand_total' => ['required', 'numeric', 'min:0'],
            'paid_amount' => ['required', 'numeric', 'min:0'],
            'note' => ['nullable', 'string'],
        ]);

        try {
            $sale = $createSaleAction->execute(
                outletId: $activeOutletId,
                cashierId: $user->id,
                customerId: $validated['customer_id'] ?? null,
                items: $validated['items'],
                payments: $validated['payments'],
                subtotal: (float) $validated['subtotal'],
                discountAmount: (float) $validated['discount_amount'],
                taxAmount: (float) $validated['tax_amount'],
                grandTotal: (float) $validated['grand_total'],
                paidAmount: (float) $validated['paid_amount'],
                note: $validated['note'] ?? null
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Transaksi penjualan berhasil diproses!',
                'sale' => [
                    'id' => $sale->id,
                    'invoice_number' => $sale->invoice_number,
                    'grand_total' => (float) $sale->grand_total,
                    'paid_amount' => (float) $sale->paid_amount,
                    'change_amount' => (float) $sale->change_amount,
                    'sale_date' => $sale->sale_date->format('Y-m-d H:i:s'),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
