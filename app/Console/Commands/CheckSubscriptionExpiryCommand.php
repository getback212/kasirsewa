<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\Notification\NotificationDispatcherService;
use App\Services\Audit\AuditLogService;
use Carbon\Carbon;

class CheckSubscriptionExpiryCommand extends Command
{
    protected $signature = 'app:check-subscription-expiry';
    protected $description = 'Otomatisasi pengecekan kadaluarsa subskripsi SaaS, pengiriman pengingat billing multi-channel (In-App, WA, Email H-7, H-3, H-1), dan eksekusi suspension tenant.';

    public function handle(): int
    {
        $this->info('Mengawali pemeriksaan rutin subskripsi SaaS...');
        $today = Carbon::today();

        // 1. Pengingat H-7, H-3, H-1 (Multi-Channel Dispatcher)
        $reminders = [7, 3, 1];
        foreach ($reminders as $days) {
            $targetDate = $today->copy()->addDays($days);
            $subscriptions = Subscription::where('status', 'active')
                ->whereDate('expires_at', $targetDate)
                ->get();

            foreach ($subscriptions as $sub) {
                NotificationDispatcherService::sendSubscriptionReminder($sub, $days);
                $this->line("Pengingat H-{$days} Multi-Channel (In-App, WA, Email) dikirim ke Tenant ID #{$sub->tenant_id}");
            }
        }

        // 2. Day 0 Expired -> Pindah ke Grace Period (Masa Tenggang 7 Hari)
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

        // 3. Masa Tenggang Habis -> Suspension (Tanpa Hapus Data)
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
