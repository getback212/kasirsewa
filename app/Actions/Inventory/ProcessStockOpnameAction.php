<?php

namespace App\Actions\Inventory;

use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Models\Stock;
use App\Actions\Inventory\AdjustStockAction;
use App\Enums\StockMovementType;
use Illuminate\Support\Facades\DB;

class ProcessStockOpnameAction
{
    public function __construct(
        protected AdjustStockAction $adjustStockAction
    ) {}

    public function execute(
        int $outletId,
        int $userId,
        array $items,
        ?string $note = null
    ): StockOpname {
        return DB::transaction(function () use ($outletId, $userId, $items, $note) {
            $opnameNumber = 'SO/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

            $opname = StockOpname::create([
                'outlet_id' => $outletId,
                'user_id' => $userId,
                'opname_number' => $opnameNumber,
                'opname_date' => now(),
                'status' => 'completed',
                'note' => $note ?? 'Audit Stock Opname Fisik Gudang',
            ]);

            foreach ($items as $itemData) {
                $productId = (int) $itemData['product_id'];
                $physicalQty = (float) $itemData['physical_quantity'];

                $systemQty = (float) (Stock::where('outlet_id', $outletId)
                    ->where('product_id', $productId)
                    ->value('quantity') ?? 0.00);

                $difference = $physicalQty - $systemQty;

                StockOpnameItem::create([
                    'stock_opname_id' => $opname->id,
                    'product_id' => $productId,
                    'system_quantity' => $systemQty,
                    'physical_quantity' => $physicalQty,
                    'difference' => $difference,
                    'note' => $itemData['note'] ?? null,
                ]);

                // Adjust stock in PostgreSQL database to match physical count using pessimistic lock
                if ($difference != 0) {
                    $this->adjustStockAction->execute(
                        outletId: $outletId,
                        productId: $productId,
                        quantityChange: $difference,
                        type: StockMovementType::STOCK_OPNAME,
                        userId: $userId,
                        referenceType: StockOpname::class,
                        referenceId: $opname->id,
                        note: "Penyesuaian Fisik Opname #{$opname->opname_number} (Selisih: {$difference})"
                    );
                }
            }

            return $opname;
        });
    }
}
