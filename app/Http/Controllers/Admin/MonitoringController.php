<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Monitoring\HealthMonitor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringController extends Controller
{
    protected HealthMonitor $monitor;

    public function __construct(HealthMonitor $monitor)
    {
        $this->monitor = $monitor;
    }

    public function dashboard(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->hasRole('super_admin'), 403);

        $companyId = $user->company_id ?? 6;

        // Get all service status
        $services = DB::table('service_status')
            ->where('company_id', $companyId)
            ->get()
            ->keyBy('service_name');

        // Get latest health metrics
        $metrics = DB::table('health_metrics')
            ->where('company_id', $companyId)
            ->where('recorded_at', '>=', now()->subHours(24))
            ->latest('recorded_at')
            ->limit(100)
            ->get()
            ->groupBy('metric_name');

        // Get recent alerts
        $alerts = DB::table('alert_logs')
            ->where('company_id', $companyId)
            ->where('status', '!=', 'resolved')
            ->latest('created_at')
            ->limit(20)
            ->get();

        // Get slow queries
        $slowQueries = $this->monitor->getSlowQueries(threshold: 100, limit: 10);

        // Get backup status
        $lastBackup = DB::table('backup_logs')
            ->where('company_id', $companyId)
            ->where('status', 'completed')
            ->latest('completed_at')
            ->first();

        return Inertia::render('Admin/Monitoring/Dashboard', [
            'services' => $services,
            'metrics' => $metrics,
            'alerts' => $alerts,
            'slowQueries' => $slowQueries,
            'lastBackup' => $lastBackup,
        ]);
    }

    public function health(Request $request)
    {
        $user = $request->user();
        abort_unless($user->hasRole('super_admin'), 403);

        return response()->json($this->monitor->getAllStatus());
    }

    public function checkNow(Request $request)
    {
        $user = $request->user();
        abort_unless($user->hasRole('super_admin'), 403);

        $status = $this->monitor->getAllStatus();

        return response()->json([
            'status' => 'ok',
            'checks' => $status,
            'timestamp' => now(),
        ]);
    }

    public function slowQueries(Request $request)
    {
        $user = $request->user();
        abort_unless($user->hasRole('super_admin'), 403);

        $threshold = $request->query('threshold', 100);
        $limit = $request->query('limit', 50);

        $queries = $this->monitor->getSlowQueries(
            thresholdMs: (int) $threshold,
            limit: (int) $limit
        );

        return response()->json([
            'queries' => $queries,
            'threshold_ms' => $threshold,
            'count' => count($queries),
        ]);
    }

    public function acknowledgeAlert(Request $request)
    {
        $user = $request->user();
        abort_unless($user->hasRole('super_admin'), 403);

        $alertId = $request->post('alert_id');

        DB::table('alert_logs')
            ->where('id', $alertId)
            ->update([
                'status' => 'acknowledged',
                'acknowledged_by' => $user->id,
                'acknowledged_at' => now(),
            ]);

        return response()->json(['success' => true]);
    }
}
