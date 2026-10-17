<?php

namespace App\Http\Controllers\AuditLog;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Traits\ExportableAuditLogs;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantAuditLogController extends Controller
{
    use ExportableAuditLogs;

    public function index(Request $request)
    {
        if (!auth()->user() || !auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access');
        }

        $tenantId = auth()->user()->tenant_id;
        $query = AuditLog::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('impersonated_by')
            ->with(['user', 'tenant'])
            ->latest('created_at');

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('action', 'LIKE', "%{$search}%")
                    ->orWhereHas('user', function ($q) use ($search) {
                        $q->where('name', 'LIKE', "%{$search}%")
                            ->orWhere('email', 'LIKE', "%{$search}%");
                    });
            });
        }

        $actions = AuditLog::where('tenant_id', $tenantId)
            ->whereNull('impersonated_by')
            ->distinct('action')
            ->orderBy('action')
            ->pluck('action');

        $users = \App\Models\User::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        $logs = $query->paginate(15);

        return Inertia::render('AuditLogs/TenantAuditLogs', [
            'logs' => $logs,
            'actions' => $actions,
            'users' => $users,
            'filters' => [
                'action' => $request->input('action'),
                'user_id' => $request->input('user_id'),
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
                'search' => $request->input('search'),
            ],
        ]);
    }

    public function show(AuditLog $auditLog)
    {
        if ($auditLog->tenant_id !== auth()->user()->tenant_id || $auditLog->impersonated_by !== null) {
            abort(403, 'Unauthorized access');
        }

        $auditLog->load(['user', 'tenant']);

        return Inertia::render('AuditLogs/TenantAuditLogDetail', [
            'log' => $auditLog,
        ]);
    }

    public function export(Request $request)
    {
        if (!auth()->user() || !auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access');
        }

        $tenantId = auth()->user()->tenant_id;
        $format = $request->input('format', 'csv');

        $query = AuditLog::where('tenant_id', $tenantId)
            ->whereNull('impersonated_by')
            ->with(['user', 'tenant']);

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $logs = $query->latest('created_at')->get();

        if ($format === 'csv') {
            $filename = 'audit-logs-' . auth()->user()->tenant_id . '-' . now()->format('Ymd-His');
            return $this->exportCsv($logs, $filename);
        }

        abort(400, 'Format tidak didukung. Gunakan: csv');
    }
}
