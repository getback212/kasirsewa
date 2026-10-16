<?php

namespace App\Actions\Inventory;

use App\Enums\StockMovementType;
use App\Models\Outlet;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AdjustStockAction
{
    public function execute(
        int $outletId,
        int $productId,
        float $quantityChange,
        StockMovementType $type,
        ?int $userId = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $note = null
    ): Stock {
        return DB::transaction(function () use (
            $outletId,
            $productId,
            $quantityChange,
            $type,
            $userId,
            $referenceType,
            $referenceId,
            $note
        ) {
            $outlet = Outlet::find($outletId);
            $tenantId = $outlet?->tenant_id ?? session('active_tenant_id');

            // Pessimistic Row Locking to prevent race condition
            $stock = Stock::where('outlet_id', $outletId)
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            if (! $stock) {
                $stock = Stock::create([
                    'tenant_id' => $tenantId,
                    'outlet_id' => $outletId,
                    'product_id' => $productId,
                    'quantity' => 0.00,
                    'reserved_quantity' => 0.00,
                ]);
            }

            $beforeStock = (float) $stock->quantity;
            $afterStock = $beforeStock + $quantityChange;

            $allowNegativeStock = config('app.allow_negative_stock', false);
            if ($afterStock < 0 && ! $allowNegativeStock) {
                throw new InvalidArgumentException("Stok tidak mencukupi untuk transaksi ini! (Stok saat ini: {$beforeStock})");
            }

            $stock->update(['quantity' => $afterStock]);

            StockMovement::create([
                'tenant_id' => $tenantId,
                'outlet_id' => $outletId,
                'product_id' => $productId,
                'type' => $type->value,
                'quantity' => $quantityChange,
                'before_stock' => $beforeStock,
                'after_stock' => $afterStock,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'user_id' => $userId,
                'note' => $note,
                'created_at' => now(),
            ]);

            return $stock;
        });
    }
}
