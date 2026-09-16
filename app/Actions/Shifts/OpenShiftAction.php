<?php

namespace App\Actions\Shifts;

use App\Models\Shift;
use InvalidArgumentException;

class OpenShiftAction
{
    public function execute(int $outletId, int $userId, float $openingCash): Shift
    {
        $existingOpenShift = Shift::where('outlet_id', $outletId)
            ->where('user_id', $userId)
            ->where('status', 'open')
            ->first();

        if ($existingOpenShift) {
            throw new InvalidArgumentException('Anda sudah memiliki sesi shift kasir yang sedang aktif!');
        }

        $outlet = \App\Models\Outlet::find($outletId);
        $tenantId = $outlet?->tenant_id ?? session('active_tenant_id');

        return Shift::create([
            'tenant_id' => $tenantId,
            'outlet_id' => $outletId,
            'user_id' => $userId,
            'opening_cash' => $openingCash,
            'status' => 'open',
            'opened_at' => now(),
        ]);
    }
}
