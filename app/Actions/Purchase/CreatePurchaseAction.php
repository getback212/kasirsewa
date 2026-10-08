<?php

namespace App\Actions\Purchase;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Actions\Inventory\AdjustStockAction;
use App\Enums\StockMovementType;
use Illuminate\Support\Facades\DB;

class CreatePurchaseAction
{
    public function __construct(
        protected AdjustStockAction $adjustStockAction
    ) {}

    public function execute(
        int $outletId,
        int $userId,
        int $supplierId,
        array $items,
        float $subtotal,
        float $discountAmount,
        float $taxAmount,
        float $grandTotal,
        ?string $note = null
    ): Purchase {
        return DB::transaction(function () use (
            $outletId,
            $userId,
            $supplierId,
            $items,
            $subtotal,
            $discountAmount,
            $taxAmount,
            $grandTotal,
            $note
        ) {
            $companyId = \App\Models\User::findOrFail($userId)->company_id;
            if (!$companyId) {
                throw new \InvalidArgumentException('Pengguna tidak memiliki company aktif.');
            }

            $outlet = \App\Models\Outlet::whereKey($outletId)
                ->where('company_id', $companyId)
                ->firstOrFail();
            $tenantId = $outlet->tenant_id ?? session('active_tenant_id');

            \App\Models\Supplier::whereKey($supplierId)
                ->where('company_id', $companyId)
                ->firstOrFail();

            $invoiceNumber = 'PO/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

            $purchase = Purchase::create([
                'tenant_id' => $tenantId,
                'outlet_id' => $outletId,
                'supplier_id' => $supplierId,
                'user_id' => $userId,
                'invoice_number' => $invoiceNumber,
                'purchase_date' => now(),
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'grand_total' => $grandTotal,
                'paid_amount' => $grandTotal,
                'due_amount' => 0.00,
                'status' => 'received',
                'note' => $note,
            ]);

            foreach ($items as $itemData) {
                $productQuery = Product::whereKey($itemData['product_id']);
                if ($companyId) {
                    $productQuery->where('company_id', $companyId);
                }
                $product = $productQuery->firstOrFail();
                $qty = (float) $itemData['quantity'];
                $cost = (float) $itemData['unit_cost'];
                $itemSubtotal = $qty * $cost;

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'unit_cost' => $cost,
                    'subtotal' => $itemSubtotal,
                ]);

                // Increment PostgreSQL inventory stock using pessimistic lock
                $this->adjustStockAction->execute(
                    outletId: $outletId,
                    productId: $product->id,
                    quantityChange: $qty,
                    type: StockMovementType::PURCHASE,
                    userId: $userId,
                    referenceType: Purchase::class,
                    referenceId: $purchase->id,
                    note: "Restok Pembelian Supplier PO #{$purchase->invoice_number}"
                );
            }

            return $purchase;
        });
    }
}
