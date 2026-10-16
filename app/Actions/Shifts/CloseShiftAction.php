<?php

namespace App\Actions\Shifts;

use App\Models\Shift;
use App\Models\Sale;
use App\Models\Payment;
use App\Models\CashMovement;
use App\Models\User;
use App\Services\Report\DailyClosingReportService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CloseShiftAction
{
    public function execute(int $shiftId, float $actualCash, ?int $userId = null): Shift
    {
        return DB::transaction(function () use ($shiftId, $actualCash, $userId) {
            $query = Shift::where('id', $shiftId);
            if ($userId !== null) {
                $companyId = User::findOrFail($userId)->company_id;
                if (! $companyId) {
                    throw new InvalidArgumentException('Pengguna tidak memiliki company aktif.');
                }
                $query->whereHas('outlet', fn ($q) => $q->where('company_id', $companyId));
            }
            $shift = $query->firstOrFail();

            if ($shift->status === 'closed') {
                throw new InvalidArgumentException('Shift kasir ini sudah ditutup sebelumnya!');
            }

            // Calculate total cash sales in this shift session
            $cashSales = Payment::whereHas('sale', function ($q) use ($shift) {
                $q->where('outlet_id', $shift->outlet_id)
                  ->where('cashier_id', $shift->user_id)
                  ->where('sale_date', '>=', $shift->opened_at)
                  ->where('transaction_status', 'completed');
            })->where('payment_method', 'cash')->sum('amount');

            // Calculate cash in and cash out movements
            $cashIn = CashMovement::where('shift_id', $shift->id)->where('type', 'cash_in')->sum('amount');
            $cashOut = CashMovement::where('shift_id', $shift->id)->where('type', 'cash_out')->sum('amount');

            $expectedCash = (float) ($shift->opening_cash + $cashSales + $cashIn - $cashOut);
            $difference = $actualCash - $expectedCash;

            $shift->update([
                'closing_cash' => $actualCash,
                'expected_cash' => $expectedCash,
                'actual_cash' => $actualCash,
                'difference' => $difference,
                'status' => 'closed',
                'closed_at' => now(),
            ]);

            // Generate and send daily closing report
            DailyClosingReportService::generateAndNotify($shift);

            return $shift;
        });
    }
}
