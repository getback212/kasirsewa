<?php

namespace App\Actions\Inventory;

use App\Models\StockTransfer;
use App\Actions\Inventory\AdjustStockAction;
use App\Enums\StockMovementType;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SendStockTransferAction
{
    public function __construct(
        protected AdjustStockAction $adjustStockAction
    ) {}

    public function execute(int $transferId, int $userId): StockTransfer
    {
        return DB::transaction(function () use ($transferId, $userId) {
            $transfer = StockTransfer::with(['items'])->findOrFail($transferId);

            if ($transfer->status !== 'draft') {
                throw new InvalidArgumentException('Hanya transfer stok berstatus DRAFT yang dapat dikirim!');
            }

            foreach ($transfer->items as $item) {
                $qty = (float) $item->quantity;

                // Deduct stock from FromOutlet using pessimistic locking
                $this->adjustStockAction->execute(
                    outletId: $transfer->from_outlet_id,
                    productId: $item->product_id,
                    quantityChange: -$qty,
                    type: StockMovementType::TRANSFER,
                    userId: $userId,
                    referenceType: StockTransfer::class,
                    referenceId: $transfer->id,
                    note: "Transfer Keluar ke Outlet #{$transfer->to_outlet_id} (TRF #{$transfer->transfer_number})"
                );
            }

            $transfer->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            return $transfer;
        });
    }
}
