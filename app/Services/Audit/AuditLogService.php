<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    public static function log(
        string $action,
        ?string $modelType = null,
        ?int $modelId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null
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
            'created_at' => now(),
        ]);
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
