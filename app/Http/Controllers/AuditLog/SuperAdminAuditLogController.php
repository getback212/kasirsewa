<?php

namespace App\Http\Controllers\AuditLog;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SuperAdminAuditLogController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()?->hasRole('SUPER_ADMIN')) {
            abort(403, 'Only Super Admin can access audit logs');
        }

        $query = AuditLog::query()->with(['user', 'tenant', 'impersonatedByUser']);

        $query->where(function ($q) {
            $q->where('visible_to', 'super_admin_only')
                ->orWhere('visible_to', 'tenant');
        });

        if ($request->filled('tenant_ids')) {
            $tenantIds = $request->input('tenant_ids');
            if (is_array($tenantIds) && count($tenantIds) > 0) {
                $query->whereIn('tenant_id', $tenantIds);
            }
        }

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('show_impersonation')) {
            if ($request->input('show_impersonation') === '1') {
                $query->whereNotNull('impersonated_by');
            } else {
                $query->whereNull('impersonated_by');
            }
        } else {
            $query->whereNull('impersonated_by');
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

        $actions = AuditLog::distinct('action')
            ->orderBy('action')
            ->pluck('action');

        $tenants = Tenant::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        $logs = $query->latest('created_at')->paginate(20);

        return Inertia::render('AuditLogs/SuperAdminAuditLogs', [
            'logs' => $logs,
            'actions' => $actions,
            'tenants' => $tenants,
            'filters' => [
                'tenant_ids' => $request->input('tenant_ids'),
                'action' => $request->input('action'),
                'user_id' => $request->input('user_id'),
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
                'search' => $request->input('search'),
                'show_impersonation' => $request->input('show_impersonation'),
            ],
        ]);
    }

    public function show(AuditLog $auditLog)
    {
        if (!auth()->user()?->hasRole('SUPER_ADMIN')) {
            abort(403, 'Only Super Admin can access audit logs');
        }

        $auditLog->load(['user', 'tenant', 'impersonatedByUser']);

        return Inertia::render('AuditLogs/SuperAdminAuditLogDetail', [
            'log' => $auditLog,
        ]);
    }
}
