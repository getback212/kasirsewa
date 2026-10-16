<?php

namespace App\Actions\POS;

use App\Actions\Inventory\AdjustStockAction;
use App\Enums\StockMovementType;
use App\Models\Outlet;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ProcessSalesReturnAction
{
    public function __construct(
        protected AdjustStockAction $adjustStockAction
    ) {}

    public function execute(
        int $outletId,
        int $cashierId,
        int $saleId,
        array $returnItems,
        string $reason
    ): SalesReturn {
        return DB::transaction(function () use (
            $outletId,
            $cashierId,
            $saleId,
            $returnItems,
            $reason
        ) {
            $companyId = User::findOrFail($cashierId)->company_id;
            if (! $companyId) {
                throw new InvalidArgumentException('Pengguna tidak memiliki company aktif.');
            }

            $outlet = Outlet::whereKey($outletId)
                ->where('company_id', $companyId)
                ->firstOrFail();

            $sale = Sale::with('items')
                ->where('outlet_id', $outletId)
                ->findOrFail($saleId);

            if ($sale->transaction_status === 'void') {
                throw new InvalidArgumentException('Transaksi yang sudah dibatalkan (void) tidak dapat diretur!');
            }

            $returnNumber = 'RET/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
            $totalRefundAmount = 0.00;

            $salesReturn = SalesReturn::create([
                'outlet_id' => $outletId,
                'sale_id' => $sale->id,
                'cashier_id' => $cashierId,
                'return_number' => $returnNumber,
                'subtotal' => 0.00,
                'refund_amount' => 0.00,
                'reason' => $reason,
                'status' => 'completed',
            ]);

            foreach ($returnItems as $itemData) {
                $saleItem = SaleItem::where('sale_id', $sale->id)->findOrFail($itemData['sale_item_id']);
                $returnQty = (float) $itemData['quantity'];

                // Validate return quantity does not exceed original purchased quantity
                $alreadyReturnedQty = (float) SalesReturnItem::where('sale_item_id', $saleItem->id)->sum('quantity');
                $maxReturnable = (float) $saleItem->quantity - $alreadyReturnedQty;

                if ($returnQty > $maxReturnable) {
                    throw new InvalidArgumentException("Jumlah retur ({$returnQty}) melebihi sisa jumlah barang yang dibeli ({$maxReturnable})!");
                }

                $itemSubtotal = $returnQty * (float) $saleItem->price_snapshot;
                $totalRefundAmount += $itemSubtotal;

                SalesReturnItem::create([
                    'sales_return_id' => $salesReturn->id,
                    'sale_item_id' => $saleItem->id,
                    'product_id' => $saleItem->product_id,
                    'quantity' => $returnQty,
                    'price_snapshot' => $saleItem->price_snapshot,
                    'subtotal' => $itemSubtotal,
                ]);

                // Return stock back to inventory using pessimistic lock
                $this->adjustStockAction->execute(
                    outletId: $outletId,
                    productId: $saleItem->product_id,
                    quantityChange: $returnQty,
                    type: StockMovementType::SALE_RETURN,
                    userId: $cashierId,
                    referenceType: SalesReturn::class,
                    referenceId: $salesReturn->id,
                    note: "Retur Penjualan Invoice #{$sale->invoice_number} ({$reason})"
                );
            }

            $salesReturn->update([
                'subtotal' => $totalRefundAmount,
                'refund_amount' => $totalRefundAmount,
            ]);

            return $salesReturn;
        });
    }
}
