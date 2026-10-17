<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class CriticalEventAlertService
{
    /**
     * Critical events yang perlu email notification
     */
    private static array $CRITICAL_EVENTS = [
        'USER_CREATE',
        'USER_DELETE',
        'PAYMENT_PROOF_VERIFIED',
        'PAYMENT_PROOF_REJECTED',
        'SUBSCRIPTION_ACTIVATED',
        'SUBSCRIPTION_UPGRADED',
        'SUBSCRIPTION_DOWNGRADED',
        'IMPERSONATE',
        'TENANT_SUSPEND',
        'TENANT_ACTIVATE',
    ];

    /**
     * Check if event is critical
     */
    public static function isCritical(string $action): bool
    {
        return in_array($action, self::$CRITICAL_EVENTS);
    }

    /**
     * Send alert email for critical audit log
     */
    public static function sendAlert(AuditLog $log): void
    {
        if (!self::isCritical($log->action)) {
            return;
        }

        try {
            $recipients = self::getRecipients($log);

            if (empty($recipients)) {
                return;
            }

            $subject = self::getSubject($log);
            $emailBody = self::getEmailBody($log);

            foreach ($recipients as $email) {
                Mail::raw($emailBody, function ($mail) use ($email, $subject) {
                    $mail->to($email)
                        ->subject($subject)
                        ->from(config('mail.from.address'), config('mail.from.name'));
                });
            }

            Log::info("Critical event alert sent: {$log->action} (Log ID: {$log->id})", [
                'recipients' => count($recipients),
                'action' => $log->action,
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to send critical event alert: {$e->getMessage()}", [
                'log_id' => $log->id,
                'action' => $log->action,
            ]);
        }
    }

    /**
     * Get recipients for alert email
     */
    private static function getRecipients(AuditLog $log): array
    {
        $recipients = [];

        // Super Admin actions → notify super admin + owner
        if ($log->visible_to === 'super_admin_only' || $log->action === 'IMPERSONATE') {
            $superAdmin = User::whereHas('roles', function ($q) {
                $q->where('name', 'SUPER_ADMIN');
            })->first();

            if ($superAdmin && $superAdmin->email) {
                $recipients[] = $superAdmin->email;
            }
        }

        // Tenant-specific actions → notify owner
        if ($log->tenant_id) {
            $owner = \App\Models\Tenant::find($log->tenant_id)?->owner;
            if ($owner && $owner->email) {
                $recipients[] = $owner->email;
            }
        }

        return array_unique($recipients);
    }

    /**
     * Get subject for alert email
     */
    private static function getSubject(AuditLog $log): string
    {
        $labels = [
            'USER_CREATE' => '🚨 Pengguna Baru Ditambahkan',
            'USER_DELETE' => '🚨 Pengguna Dihapus',
            'PAYMENT_PROOF_VERIFIED' => '✅ Bukti Pembayaran Dikonfirmasi',
            'PAYMENT_PROOF_REJECTED' => '❌ Bukti Pembayaran Ditolak',
            'SUBSCRIPTION_ACTIVATED' => '✅ Langganan Diaktifkan',
            'SUBSCRIPTION_UPGRADED' => '📈 Langganan Ditingkatkan',
            'SUBSCRIPTION_DOWNGRADED' => '📉 Langganan Diturunkan',
            'IMPERSONATE' => '🔐 Super Admin Impersonasi Tenant',
            'TENANT_SUSPEND' => '🛑 Tenant Disuspend',
            'TENANT_ACTIVATE' => '✅ Tenant Diaktifkan',
        ];

        return $labels[$log->action] ?? "Alert: {$log->action}";
    }

    /**
     * Get email body for alert
     */
    private static function getEmailBody(AuditLog $log): string
    {
        $user = $log->user;
        $tenant = $log->tenant;
        $timestamp = $log->created_at->format('d/m/Y H:i:s');

        $body = "ALERT AUDIT LOG KRITIS\n";
        $body .= "======================\n\n";
        $body .= "Aksi: {$log->action}\n";
        $body .= "Waktu: {$timestamp}\n";
        $body .= "Pengguna: {$user?->name} ({$user?->email})\n";

        if ($tenant) {
            $body .= "Tenant: {$tenant->name}\n";
        }

        if ($log->impersonated_by) {
            $impersonator = User::find($log->impersonated_by);
            $body .= "Impersonasi oleh: {$impersonator?->name}\n";
        }

        if ($log->new_values) {
            $body .= "\nPerubahan:\n";
            foreach ($log->new_values as $key => $value) {
                $body .= "  - {$key}: " . (is_array($value) ? json_encode($value) : $value) . "\n";
            }
        }

        $body .= "\n---\n";
        $body .= "Pesan ini dikirim otomatis oleh sistem audit KasirSewa.\n";

        return $body;
    }

    /**
     * Get all critical events (untuk admin dashboard)
     */
    public static function getCriticalEvents(): array
    {
        return self::$CRITICAL_EVENTS;
    }
}
