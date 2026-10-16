<?php

namespace App\Actions\Inventory;

use App\Models\Stock;
use App\Exceptions\InsufficientStockException;
use Illuminate\Support\Facades\DB;

/**
 * Validate stock availability BEFORE transaction
 * Prevents overselling in POS by checking all items upfront
 */
class ValidateStockAvailabilityAction
{
    /**
     * Validate that all items have sufficient stock at outlet
     * 
     * @param int $outletId
     * @param array $items - array of ['product_id' => int, 'quantity' => float]
     * @throws InsufficientStockException if any item lacks stock
     */
    public function execute(int $outletId, array $items): void
    {
        foreach ($items as $itemData) {
            $productId = (int) $itemData['product_id'];
            $requestedQty = (float) $itemData['quantity'];

            // Use pessimistic lock to check current stock
            $stock = Stock::where('outlet_id', $outletId)
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            $availableQty = $stock ? (float) $stock->quantity : 0.00;

            if ($availableQty < $requestedQty) {
                $product = \App\Models\Product::find($productId);
                throw new InsufficientStockException(
                    $product->name ?? "Product #$productId",
                    (int) $requestedQty,
                    (int) $availableQty
                );
            }
        }
    }
}
