<?php

namespace App\Actions\Inventory;

use App\Enums\StockMovementType;
use App\Models\StockTransfer;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ReceiveStockTransferAction
{
    public function __construct(
        protected AdjustStockAction $adjustStockAction
    ) {}

    public function execute(int $transferId, int $userId): StockTransfer
    {
        return DB::transaction(function () use ($transferId, $userId) {
            $companyId = User::findOrFail($userId)->company_id;
            if (! $companyId) {
                throw new InvalidArgumentException('Pengguna tidak memiliki company aktif.');
            }

            $transfer = StockTransfer::where('company_id', $companyId)
                ->with(['items'])
                ->findOrFail($transferId);

            if ($transfer->status !== 'sent') {
                throw new InvalidArgumentException('Hanya transfer stok berstatus SENT (Dikirim) yang dapat diterima!');
            }

            foreach ($transfer->items as $item) {
                $qty = (float) $item->quantity;

                // Add stock to ToOutlet using pessimistic locking
                $this->adjustStockAction->execute(
                    outletId: $transfer->to_outlet_id,
                    productId: $item->product_id,
                    quantityChange: $qty,
                    type: StockMovementType::TRANSFER,
                    userId: $userId,
                    referenceType: StockTransfer::class,
                    referenceId: $transfer->id,
                    note: "Transfer Masuk dari Outlet #{$transfer->from_outlet_id} (TRF #{$transfer->transfer_number})"
                );
            }

            $transfer->update([
                'status' => 'received',
                'received_at' => now(),
            ]);

            return $transfer;
        });
    }
}
