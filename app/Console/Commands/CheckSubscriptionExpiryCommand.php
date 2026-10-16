<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\Audit\AuditLogService;
use App\Services\Notification\NotificationDispatcherService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CheckSubscriptionExpiryCommand extends Command
{
    protected $signature = 'app:check-subscription-expiry';

    protected $description = 'Otomatisasi pengecekan kadaluarsa subskripsi & trial SaaS, pengiriman pengingat billing multi-channel (WA & Email H-7, H-3, H-1/Trial), dan eksekusi status trial/suspended.';

    public function handle(): int
    {
        $this->info('Mengawali pemeriksaan rutin subskripsi & trial SaaS...');
        $today = Carbon::today();

        // 1. Pengingat H-7, H-3, H-1 untuk Paket Berlangganan Aktif
        $reminders = [7, 3, 1];
        foreach ($reminders as $days) {
            $targetDate = $today->copy()->addDays($days);
            $subscriptions = Subscription::where('status', 'active')
                ->whereDate('expires_at', $targetDate)
                ->get();

            foreach ($subscriptions as $sub) {
                if (NotificationDispatcherService::reminderAlreadySentToday($sub->tenant_id, 'SUBSCRIPTION_REMINDER', "Pengingat Tagihan SaaS (H-{$days})")) {
                    continue;
                }
                NotificationDispatcherService::sendSubscriptionReminder($sub, $days);
                $this->line("Pengingat H-{$days} (In-App, WA, Email) dikirim ke Tenant ID #{$sub->tenant_id}");
            }
        }

        // 2. Pengingat Trial H-1 (Sisa 1 Hari / <24 Jam)
        $trialExpiringSubs = Subscription::where('status', 'trial')
            ->whereNotNull('trial_ends_at')
            ->whereDate('trial_ends_at', $today->copy()->addDay())
            ->get();

        foreach ($trialExpiringSubs as $sub) {
            if (NotificationDispatcherService::reminderAlreadySentToday($sub->tenant_id, 'SUBSCRIPTION_REMINDER', 'Pengingat Tagihan SaaS (H-1)')) {
                continue;
            }
            NotificationDispatcherService::sendSubscriptionReminder($sub, 1);
            $this->line("Pengingat H-1 Trial (WA & Email) dikirim ke Tenant ID #{$sub->tenant_id}");
        }

        // 3. Status Trial Habis -> Pindah ke Expired
        $expiredTrialSubs = Subscription::where('status', 'trial')
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '<=', Carbon::now())
            ->get();

        foreach ($expiredTrialSubs as $sub) {
            $sub->update(['status' => 'expired']);
            Tenant::where('id', $sub->tenant_id)->update(['status' => 'past_due']);
            NotificationDispatcherService::sendSubscriptionExpired($sub);

            AuditLogService::log('SAAS_TRIAL_EXPIRED', 'Subscription', $sub->id);
            $this->line("Masa Trial Tenant ID #{$sub->tenant_id} telah HABIS (Status: Expired)");
        }

        // 4. Day 0 Expired -> Pindah ke Grace Period (Masa Tenggang 7 Hari)
        $expiredSubs = Subscription::where('status', 'active')
            ->whereDate('expires_at', '<', $today)
            ->get();

        foreach ($expiredSubs as $sub) {
            $graceUntil = Carbon::now()->addDays(7);
            $sub->update([
                'status' => 'grace_period',
                'grace_until' => $graceUntil,
            ]);

            Tenant::where('id', $sub->tenant_id)->update(['status' => 'past_due']);
            NotificationDispatcherService::sendSubscriptionExpired($sub);

            AuditLogService::log('SAAS_SUBSCRIPTION_GRACE_PERIOD', 'Subscription', $sub->id);
            $this->line("Tenant ID #{$sub->tenant_id} berpindah ke Masa Tenggang (Grace Period 7 Hari)");
        }

        // 5. Masa Tenggang Habis -> Suspension (Tanpa Hapus Data)
        $suspendedSubs = Subscription::where('status', 'grace_period')
            ->whereDate('grace_until', '<', $today)
            ->get();

        foreach ($suspendedSubs as $sub) {
            $sub->update(['status' => 'suspended']);
            Tenant::where('id', $sub->tenant_id)->update(['status' => 'suspended']);
            NotificationDispatcherService::sendSubscriptionSuspended($sub);

            AuditLogService::log('SAAS_SUBSCRIPTION_SUSPENDED', 'Subscription', $sub->id);
            $this->line("Tenant ID #{$sub->tenant_id} di-Suspend Sementara");
        }

        $this->info('Pemeriksaan subskripsi SaaS & pengiriman notifikasi billing multi-channel selesai dilaksanakan.');

        return Command::SUCCESS;
    }
}
