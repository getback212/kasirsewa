<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request, DashboardService $dashboardService)
    {
        $user = $request->user();

        // Cashiers are restricted from financial dashboard metrics
        if ($user->hasRole('CASHIER')) {
            return redirect()->route('pos.index');
        }

        // Warehouse staff are restricted from financial dashboard metrics
        if ($user->hasRole('WAREHOUSE')) {
            return redirect()->route('inventory.index');
        }

        $activeOutletId = session('active_outlet_id', $user->outlet_id);

        $dashboardData = $dashboardService->getDashboardData($user, $activeOutletId);

        return Inertia::render('Dashboard/Index', [
            'dashboard' => $dashboardData,
        ]);
    }
}
