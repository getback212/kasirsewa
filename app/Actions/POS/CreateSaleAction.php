<?php

namespace App\Actions\POS;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\Product;
use App\Actions\Inventory\AdjustStockAction;
use App\Enums\StockMovementType;
use App\Enums\SaleStatus;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CreateSaleAction
{
    public function __construct(
        protected AdjustStockAction $adjustStockAction
    ) {}

    public function execute(
        int $outletId,
        int $cashierId,
        ?int $customerId,
        array $items,
        array $payments,
        float $subtotal,
        float $discountAmount,
        float $taxAmount,
        float $grandTotal,
        float $paidAmount,
        ?string $note = null,
        ?string $discountCode = null,
        int $pointsUsed = 0,
        float $pointsDiscountAmount = 0.00
    ): Sale {
        return DB::transaction(function () use (
            $outletId,
            $cashierId,
            $customerId,
            $items,
            $payments,
            $subtotal,
            $discountAmount,
            $taxAmount,
            $grandTotal,
            $paidAmount,
            $note,
            $discountCode,
            $pointsUsed,
            $pointsDiscountAmount
        ) {
            $companyId = \App\Models\User::findOrFail($cashierId)->company_id;
            if (!$companyId) {
                throw new InvalidArgumentException('Pengguna tidak memiliki company aktif.');
            }

            $outlet = \App\Models\Outlet::whereKey($outletId)
                ->where('company_id', $companyId)
                ->firstOrFail();
            $tenantId = $outlet->tenant_id ?? session('active_tenant_id');

            $hasKasbonPayment = false;
            foreach ($payments as $p) {
                if (in_array(strtolower($p['method'] ?? ''), ['kasbon', 'credit_member', 'piutang'])) {
                    $hasKasbonPayment = true;
                }
            }

            $totalPaymentsAmount = array_sum(array_column($payments, 'amount'));

            if (!$hasKasbonPayment && $totalPaymentsAmount < $grandTotal) {
                throw new InvalidArgumentException("Jumlah nominal pembayaran (Rp ".number_format($totalPaymentsAmount, 0, ',', '.').") kurang dari Grand Total (Rp ".number_format($grandTotal, 0, ',', '.').")!");
            }

            if ($hasKasbonPayment) {
                if (!$customerId) {
                    throw new InvalidArgumentException("Metode pembayaran Kasbon/Piutang wajib memilih Pelanggan Member!");
                }
                $customer = \App\Models\Customer::whereKey($customerId)
                    ->where('company_id', $companyId)
                    ->firstOrFail();
                $unpaidAmount = max(0, $grandTotal - $paidAmount);
                if (($customer->credit_balance + $unpaidAmount) > $customer->credit_limit) {
                    throw new InvalidArgumentException("Batas limit piutang/kasbon pelanggan {$customer->name} (Max Rp ".number_format((float) $customer->credit_limit, 0, ',', '.').") terlampaui!");
                }
                $customer->increment('credit_balance', $unpaidAmount);
            }

            // Reward / Redeem Loyalty Points
            if ($customerId) {
                $customer = \App\Models\Customer::whereKey($customerId)
                    ->where('company_id', $companyId)
                    ->first();
                if ($customer) {
                    $pointsEarned = (int) floor($grandTotal / 10000);
                    if ($pointsEarned > 0) {
                        $customer->increment('points', $pointsEarned);
                    }
                    if ($pointsUsed > 0) {
                        $customer->decrement('points', min($customer->points, $pointsUsed));
                    }
                }
            }

            $changeAmount = max(0, $totalPaymentsAmount - $grandTotal);
            $invoiceNumber = 'INV/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

            $sale = Sale::create([
                'tenant_id' => $tenantId,
                'outlet_id' => $outletId,
                'cashier_id' => $cashierId,
                'customer_id' => $customerId,
                'invoice_number' => $invoiceNumber,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'discount_code' => $discountCode,
                'points_used' => $pointsUsed,
                'points_discount_amount' => $pointsDiscountAmount,
                'tax_amount' => $taxAmount,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'change_amount' => $changeAmount,
                'payment_status' => $hasKasbonPayment ? 'partial' : 'paid',
                'transaction_status' => SaleStatus::COMPLETED->value,
                'sale_date' => now(),
                'note' => $note,
            ]);

            foreach ($items as $itemData) {
                $productQuery = Product::whereKey($itemData['product_id']);
                if ($companyId) {
                    $productQuery->where('company_id', $companyId);
                }
                $product = $productQuery->firstOrFail();
                $qty = (float) $itemData['quantity'];
                $price = (float) $itemData['price'];
                $itemDiscount = (float) ($itemData['discount_amount'] ?? 0.00);
                $itemSubtotal = ($qty * $price) - $itemDiscount;

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name_snapshot' => $product->name,
                    'sku_snapshot' => $product->sku,
                    'price_snapshot' => $price,
                    'cost_price_snapshot' => (float) $product->purchase_price,
                    'quantity' => $qty,
                    'discount_amount' => $itemDiscount,
                    'subtotal' => $itemSubtotal,
                ]);

                // Deduct inventory stock using pessimistic lock
                $this->adjustStockAction->execute(
                    outletId: $outletId,
                    productId: $product->id,
                    quantityChange: -$qty,
                    type: StockMovementType::SALE,
                    userId: $cashierId,
                    referenceType: Sale::class,
                    referenceId: $sale->id,
                    note: "Penjualan Kasir Invoice #{$sale->invoice_number}"
                );
            }

            foreach ($payments as $paymentData) {
                Payment::create([
                    'sale_id' => $sale->id,
                    'payment_method' => $paymentData['method'],
                    'amount' => $paymentData['amount'],
                    'reference_number' => $paymentData['reference_number'] ?? null,
                    'status' => 'completed',
                ]);
            }

            return $sale;
        });
    }
}
