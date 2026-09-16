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
        ?string $note = null
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
            $note
        ) {
            $totalPaymentsAmount = array_sum(array_column($payments, 'amount'));
            if ($totalPaymentsAmount < $grandTotal) {
                throw new InvalidArgumentException("Jumlah nominal pembayaran (Rp ".number_format($totalPaymentsAmount, 0, ',', '.').") kurang dari Grand Total (Rp ".number_format($grandTotal, 0, ',', '.').")!");
            }

            $changeAmount = max(0, $totalPaymentsAmount - $grandTotal);
            $invoiceNumber = 'INV/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

            $sale = Sale::create([
                'outlet_id' => $outletId,
                'cashier_id' => $cashierId,
                'customer_id' => $customerId,
                'invoice_number' => $invoiceNumber,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'change_amount' => $changeAmount,
                'payment_status' => 'paid',
                'transaction_status' => SaleStatus::COMPLETED->value,
                'sale_date' => now(),
                'note' => $note,
            ]);

            foreach ($items as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
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
