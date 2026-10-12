<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SaaSSetting;
use App\Services\Audit\AuditLogService;
use App\Services\Notification\NotificationDispatcherService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminNotificationSettingController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang mengatur notifikasi billing multi-channel.');
        }

        $settings = [
            'wa_gateway_url' => SaaSSetting::get('wa_gateway_url', 'http://172.17.0.1:3001/send'),
            'wa_api_key' => SaaSSetting::get('wa_api_key', 'baileys_free_gateway'),
            'wa_cs_number' => SaaSSetting::get('wa_cs_number', '6281234567890'),
            'wa_otp_template' => SaaSSetting::get('wa_otp_template', "🔐 *Kode OTP Verifikasi WhatsApp KasirSewa*\n\nKode OTP Anda adalah: *{otp}*\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun demi keamanan akun toko Anda."),
            'enable_wa_notifications' => SaaSSetting::get('enable_wa_notifications', '1') === '1',
            'enable_email_notifications' => SaaSSetting::get('enable_email_notifications', '1') === '1',
            'scheduler_status' => $this->schedulerStatus(),
        ];

        return Inertia::render('Admin/NotificationSettingsIndex', [
            'settings' => $settings,
        ]);
    }

    /**
     * Report the real scheduled time of the billing/trial job rather than a
     * hardcoded string, so the admin panel never lies after a schedule change.
     */
    private function schedulerStatus(): string
    {
        $event = collect(app(\Illuminate\Console\Scheduling\Schedule::class)->events())
            ->first(fn ($event) => str_contains($event->command ?? '', 'app:check-subscription-expiry'));

        if (! $event) {
            return 'TIDAK TERJADWAL — periksa routes/console.php';
        }

        $tz = $event->timezone ?? config('app.timezone');

        // Render a plain daily cron as HH:MM for humans; fall back to the raw
        // expression for anything more complex.
        $cron = $event->expression;
        if (preg_match('/^(\d{1,2}) (\d{1,2}) \* \* \*$/', $cron, $m)) {
            $human = sprintf('%02d:%02d', (int) $m[2], (int) $m[1]);
        } else {
            $human = $cron;
        }

        return 'Aktif setiap hari pukul '.$human.' ('.$tz.')';
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang memperbarui notifikasi.');
        }

        $validated = $request->validate([
            'wa_gateway_url' => ['required', 'string', 'url'],
            'wa_api_key' => ['nullable', 'string', 'max:255'],
            'wa_cs_number' => ['required', 'string', 'max:30'],
            'wa_otp_template' => ['required', 'string', 'max:1000'],
            'enable_wa_notifications' => ['required', 'boolean'],
            'enable_email_notifications' => ['required', 'boolean'],
        ]);

        SaaSSetting::set('wa_gateway_url', $validated['wa_gateway_url']);
        SaaSSetting::set('wa_api_key', $validated['wa_api_key'] ?? '');
        SaaSSetting::set('wa_cs_number', $validated['wa_cs_number']);
        SaaSSetting::set('wa_otp_template', $validated['wa_otp_template']);
        SaaSSetting::set('enable_wa_notifications', $validated['enable_wa_notifications'] ? '1' : '0');
        SaaSSetting::set('enable_email_notifications', $validated['enable_email_notifications'] ? '1' : '0');

        AuditLogService::log('SAAS_NOTIFICATION_SETTINGS_UPDATE', 'SaaSSetting', 1, $validated);

        return redirect()->back()->with('success', 'Pengaturan Multi-Channel Billing Reminders & WhatsApp Gateway berhasil disimpan!');
    }

    public function testSend(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin.');
        }

        NotificationDispatcherService::dispatch(
            tenantId: $user->tenant_id ?? 1,
            userId: $user->id,
            type: 'TEST_BILLING_REMINDER',
            title: 'Tes Pengingat Billing Multi-Channel SaaS',
            message: 'Ini adalah pesan pengujian otomatisasi pengiriman billing reminder multi-channel (In-App, WhatsApp, Email).',
            owner: $user
        );

        return redirect()->back()->with('success', 'Pengujian pengiriman notifikasi billing multi-channel berhasil dikirim!');
    }
}
