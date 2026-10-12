<?php

namespace App\Http\Controllers\Shift;

use App\Actions\Shifts\CloseShiftAction;
use App\Actions\Shifts\OpenShiftAction;
use App\Http\Controllers\Controller;
use App\Models\CashMovement;
use App\Models\Shift;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');
        $isManagement = $user->hasRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']);

        $currentShift = Shift::with(['cashMovements'])
            ->where('outlet_id', $activeOutletId)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        $historyQuery = Shift::with(['user', 'cashMovements'])
            ->where('outlet_id', $activeOutletId);

        // Kasir hanya boleh melihat histori shift miliknya sendiri
        if (! $isManagement) {
            $historyQuery->where('user_id', $user->id);
        }

        $shiftsHistory = $historyQuery->latest('opened_at')
            ->paginate(15)
            ->through(function ($shift) use ($isManagement) {
                return [
                    'id' => $shift->id,
                    'opening_cash' => (float) $shift->opening_cash,
                    'closing_cash' => (float) $shift->closing_cash,
                    // Sembunyikan Expected Cash & Selisih jika role adalah Kasir biasa (Blind Closing Security)
                    'expected_cash' => $isManagement ? (float) $shift->expected_cash : null,
                    'actual_cash' => (float) $shift->actual_cash,
                    'difference' => $isManagement ? (float) $shift->difference : null,
                    'status' => $shift->status,
                    'opened_at' => $shift->opened_at->format('Y-m-d H:i:s'),
                    'closed_at' => $shift->closed_at?->format('Y-m-d H:i:s'),
                    'user' => $shift->user ? ['name' => $shift->user->name] : null,
                ];
            });

        return Inertia::render('Shifts/Index', [
            'currentShift' => $currentShift,
            'shiftsHistory' => $shiftsHistory,
            'isManagement' => $isManagement,
        ]);
    }

    public function open(Request $request, OpenShiftAction $openShiftAction): RedirectResponse
    {
        return $this->openShift($request, $openShiftAction);
    }

    public function openShift(Request $request, OpenShiftAction $openShiftAction): RedirectResponse
    {
        $user = $request->user();
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        $validated = $request->validate([
            'opening_cash' => ['required', 'numeric', 'min:0'],
        ]);

        try {
            $openShiftAction->execute(
                outletId: $activeOutletId,
                userId: $user->id,
                openingCash: (float) $validated['opening_cash']
            );

            return redirect()->back()->with('success', 'Shift kasir baru berhasil dibuka!');
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function close(Request $request, CloseShiftAction $closeShiftAction): RedirectResponse
    {
        return $this->closeShift($request, $closeShiftAction);
    }

    public function closeShift(Request $request, CloseShiftAction $closeShiftAction): RedirectResponse
    {
        $user = $request->user();
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        $validated = $request->validate([
            'shift_id' => ['required', Rule::exists('shifts', 'id')->where('outlet_id', $activeOutletId)],
            'actual_cash' => ['required', 'numeric', 'min:0'],
        ]);

        try {
            $shift = Shift::where('outlet_id', $activeOutletId)->findOrFail((int) $validated['shift_id']);

            $closeShiftAction->execute(
                shiftId: $shift->id,
                actualCash: (float) $validated['actual_cash'],
                userId: $user->id
            );

            return redirect()->back()->with('success', 'Shift kasir berhasil ditutup!');
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function forceClose(Request $request, int $id, CloseShiftAction $closeShiftAction): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER', 'MANAGER'])) {
            abort(403, 'Hanya Manager & Owner yang berwenang melakukan Force Close shift.');
        }

        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');
        $shift = Shift::where('outlet_id', $activeOutletId)->findOrFail($id);

        if ($shift->status === 'closed') {
            return redirect()->back()->with('error', 'Shift ini sudah dalam kondisi ditutup.');
        }

        $actualCash = $request->input('actual_cash') !== null ? (float) $request->input('actual_cash') : (float) $shift->opening_cash;

        try {
            $closeShiftAction->execute(
                shiftId: $shift->id,
                actualCash: $actualCash,
                userId: $user->id
            );

            return redirect()->back()->with('success', "Shift kasir {$shift->user?->name} berhasil ditutup paksa (Force Close)!");
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function cashMovement(Request $request): RedirectResponse
    {
        $user = $request->user();
        $tenantId = session('active_tenant_id', $user->tenant_id);
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        $validated = $request->validate([
            'shift_id' => ['required', Rule::exists('shifts', 'id')->where('outlet_id', $activeOutletId)],
            'type' => ['required', 'in:cash_in,cash_out'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
        ]);

        $shift = Shift::where('outlet_id', $activeOutletId)->findOrFail((int) $validated['shift_id']);

        CashMovement::create([
            'tenant_id' => $tenantId,
            'shift_id' => $shift->id,
            'user_id' => $user->id,
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'reason' => $validated['reason'],
            'note' => $validated['note'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Pencatatan kas laci berhasil disimpan!');
    }
}
