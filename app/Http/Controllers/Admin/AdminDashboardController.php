<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\SaaSPayment;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang mengakses Super Admin SaaS Dashboard.');
        }

        // 1. Tenant Metrics
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', 'active')->count();
        $trialTenants = Subscription::where('status', 'trial')->count();
        $pastDueTenants = Tenant::whereIn('status', ['past_due', 'grace_period'])->count();
        $suspendedTenants = Tenant::whereIn('status', ['suspended', 'expired'])->count();
        $newTenantsThisMonth = Tenant::where('created_at', '>=', now()->startOfMonth())->count();

        // 2. SaaS Revenue & Billing Metrics
        $totalRevenue = (float) SaaSPayment::where('status', 'completed')->sum('amount');
        $mrr = (float) SaaSPayment::where('status', 'completed')->where('created_at', '>=', now()->startOfMonth())->sum('amount');
        $unpaidInvoicesCount = Invoice::where('status', 'pending')->count();
        $unpaidInvoicesAmount = (float) Invoice::where('status', 'pending')->sum('total');

        // 3. Plan Distribution Breakdown
        $planDistribution = Plan::withCount('subscriptions')->get()->map(function ($plan) {
            return [
                'name' => $plan->name,
                'count' => $plan->subscriptions_count,
            ];
        });

        // 4. Monthly Revenue Trend (Last 6 Months)
        $monthlyRevenueTrend = SaaSPayment::where('status', 'completed')
            ->where('created_at', '>=', now()->subMonths(6))
            ->selectRaw("TO_CHAR(created_at, 'Mon YYYY') as month, SUM(amount) as revenue")
            ->groupBy('month')
            ->orderByRaw('MIN(created_at) ASC')
            ->get();

        // 5. Recent Tenant Registrations & Invoices
        $recentTenants = Tenant::with(['owner', 'subscription.plan'])->latest()->take(5)->get();
        $recentInvoices = Invoice::with(['tenant', 'subscription.plan'])->latest()->take(5)->get();

        return Inertia::render('Admin/DashboardIndex', [
            'metrics' => [
                'totalTenants' => $totalTenants,
                'activeTenants' => $activeTenants,
                'trialTenants' => $trialTenants,
                'pastDueTenants' => $pastDueTenants,
                'suspendedTenants' => $suspendedTenants,
                'newTenantsThisMonth' => $newTenantsThisMonth,
                'totalRevenue' => $totalRevenue,
                'mrr' => $mrr,
                'unpaidInvoicesCount' => $unpaidInvoicesCount,
                'unpaidInvoicesAmount' => $unpaidInvoicesAmount,
            ],
            'planDistribution' => $planDistribution,
            'monthlyRevenueTrend' => $monthlyRevenueTrend,
            'recentTenants' => $recentTenants,
            'recentInvoices' => $recentInvoices,
        ]);
    }
}
