<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\Notification;
use App\Services\Audit\AuditLogService;
use Carbon\Carbon;

class CheckSubscriptionExpiryCommand extends Command
{
    protected $signature = 'app:check-subscription-expiry';
    protected $description = 'Otomatisasi pengecekan kadaluarsa subskripsi SaaS, pengiriman pengingat billing (H-7, H-3, H-1), dan eksekusi suspension tenant.';

    public function handle(): int
    {
        $this->info('Mengawali pemeriksaan rutin subskripsi SaaS...');
        $today = Carbon::today();

        // 1. Pengingat H-7, H-3, H-1
        $reminders = [7, 3, 1];
        foreach ($reminders as $days) {
            $targetDate = $today->copy()->addDays($days);
            $subscriptions = Subscription::where('status', 'active')
                ->whereDate('expires_at', $targetDate)
                ->get();

            foreach ($subscriptions as $sub) {
                Notification::create([
                    'tenant_id' => $sub->tenant_id,
                    'user_id' => $sub->tenant->owner_id ?? 1,
                    'type' => 'SUBSCRIPTION_REMINDER',
                    'title' => "Pengingat Tagihan SaaS (H-{$days})",
                    'message' => "Masa aktif paket berlangganan toko Anda akan berakhir dalam {$days} hari pada {$sub->expires_at->format('d M Y')}. Segera lakukan perpanjangan.",
                ]);
                $this->line("Pengingat H-{$days} dikirim ke Tenant ID #{$sub->tenant_id}");
            }
        }

        // 2. Day 0 Expired -> Pindah ke Grace Period
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

            Notification::create([
                'tenant_id' => $sub->tenant_id,
                'user_id' => $sub->tenant->owner_id ?? 1,
                'type' => 'SUBSCRIPTION_EXPIRED',
                'title' => 'Masa Aktif Berlangganan Berakhir (Masa Tenggang)',
                'message' => "Paket berlangganan Anda telah melewati batas waktu. Toko memasuki Masa Tenggang hingga {$graceUntil->format('d M Y')}.",
            ]);

            AuditLogService::log('SAAS_SUBSCRIPTION_GRACE_PERIOD', 'Subscription', $sub->id);
        }

        // 3. Masa Tenggang Habis -> Suspension (Tanpa Hapus Data)
        $suspendedSubs = Subscription::where('status', 'grace_period')
            ->whereDate('grace_until', '<', $today)
            ->get();

        foreach ($suspendedSubs as $sub) {
            $sub->update(['status' => 'suspended']);
            Tenant::where('id', $sub->tenant_id)->update(['status' => 'suspended']);

            Notification::create([
                'tenant_id' => $sub->tenant_id,
                'user_id' => $sub->tenant->owner_id ?? 1,
                'type' => 'SUBSCRIPTION_SUSPENDED',
                'title' => 'Layanan SaaS Di-Suspend Sementara',
                'message' => 'Masa tenggang telah berakhir. Layanan operasional toko di-suspend sementara. Data Anda tersimpan aman dan akan aktif kembali setelah pembayaran diselesaikan.',
            ]);

            AuditLogService::log('SAAS_SUBSCRIPTION_SUSPENDED', 'Subscription', $sub->id);
        }

        $this->info('Pemeriksaan subskripsi SaaS selesai dilaksanakan.');
        return Command::SUCCESS;
    }
}
