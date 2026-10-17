<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    /**
     * Log an audit event with tenant + impersonation support.
     * 
     * Super Admin action: tenant_id = NULL, visible_to = 'super_admin_only'
     * Owner Tenant action: tenant_id = their_tenant_id, visible_to = 'tenant'
     * Super Admin IMPERSONATE: impersonated_by = super_admin_id, visible_to = 'super_admin_only'
     */
    public static function log(
        string $action,
        ?string $modelType = null,
        ?int $modelId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null,
        ?int $tenantId = null,
        ?int $impersonatedBy = null
    ): AuditLog {
        $user = $userId !== null
            ? User::findOrFail($userId)
            : Auth::user();

        // Validate company_id actually exists to prevent FK violations
        // (e.g., orphaned company_id after company deletion, or super admin without company)
        $companyId = null;
        if ($user?->company_id !== null) {
            $companyId = Company::whereKey($user->company_id)->value('id');
        }

        // Auto-detect tenant_id if not provided
        if ($tenantId === null && $user?->tenant_id) {
            $tenantId = $user->tenant_id;
        }

        // Determine visibility
        $visibleTo = 'tenant'; // Default: visible to tenant
        
        // Super Admin logs (no tenant) = super_admin_only
        if (!$tenantId && $user?->hasRole('SUPER_ADMIN')) {
            $visibleTo = 'super_admin_only';
        }
        
        // Impersonation logs = super_admin_only (don't show to tenant)
        if ($impersonatedBy !== null) {
            $visibleTo = 'super_admin_only';
        }

        // Strip passwords, tokens, and secrets from audit entries
        $sanitizedOld = self::sanitize($oldValues);
        $sanitizedNew = self::sanitize($newValues);

        return AuditLog::create([
            'company_id' => $companyId,
            'user_id' => $user?->id,
            'action' => strtoupper($action),
            'model_type' => $modelType,
            'model_id' => $modelId,
            'old_values' => $sanitizedOld,
            'new_values' => $sanitizedNew,
            'ip_address' => Request::ip() ?? '127.0.0.1',
            'user_agent' => Request::userAgent() ?? 'System',
            'tenant_id' => $tenantId,
            'impersonated_by' => $impersonatedBy,
            'visible_to' => $visibleTo,
            'created_at' => now(),
        ]);
    }

    /**
     * Log audit event + send critical event alerts
     */
    public static function logWithAlert(
        string $action,
        ?string $modelType = null,
        ?int $modelId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null,
        ?int $tenantId = null,
        ?int $impersonatedBy = null
    ): AuditLog {
        $log = self::log($action, $modelType, $modelId, $oldValues, $newValues, $userId, $tenantId, $impersonatedBy);
        
        // Trigger critical event alert
        CriticalEventAlertService::sendAlert($log);
        
        return $log;
    }

    private static function sanitize(?array $data): ?array
    {
        if (! $data) {
            return null;
        }

        $sensitiveFields = ['password', 'password_confirmation', 'remember_token', 'token', 'secret'];

        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '[REDACTED]';
            }
        }

        return $data;
    }
}
