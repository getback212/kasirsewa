<?php

namespace App\Services\Notification;

use App\Models\Notification;
use App\Models\SaaSSetting;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationDispatcherService
{
    public static function sendSubscriptionReminder(Subscription $sub, int $daysRemaining): void
    {
        $tenant = $sub->tenant;
        $owner = $tenant->owner ?? User::where('tenant_id', $sub->tenant_id)->first();
        if (!$owner) return;

        $title = "Pengingat Tagihan SaaS (H-{$daysRemaining})";
        $formattedDate = $sub->expires_at ? $sub->expires_at->format('d M Y') : 'segera';
        $message = "Halo {$owner->name}, masa aktif paket berlangganan toko {$tenant->name} akan berakhir dalam {$daysRemaining} hari pada {$formattedDate}. Segera lakukan perpanjangan agar operasional toko tetap lancar.";

        static::dispatch($sub->tenant_id, $owner->id, 'SUBSCRIPTION_REMINDER', $title, $message, $owner);
    }

    public static function sendSubscriptionExpired(Subscription $sub): void
    {
        $tenant = $sub->tenant;
        $owner = $tenant->owner ?? User::where('tenant_id', $sub->tenant_id)->first();
        if (!$owner) return;

        $title = 'Masa Aktif Berlangganan Berakhir (Masa Tenggang 7 Hari)';
        $graceDate = $sub->grace_until ? $sub->grace_until->format('d M Y') : '7 hari ke depan';
        $message = "Halo {$owner->name}, paket berlangganan toko {$tenant->name} telah melewati batas waktu. Toko Anda memasuki Masa Tenggang hingga {$graceDate}. Silakan lunasi invoice perpanjangan di portal SaaS.";

        static::dispatch($sub->tenant_id, $owner->id, 'SUBSCRIPTION_EXPIRED', $title, $message, $owner);
    }

    public static function sendSubscriptionSuspended(Subscription $sub): void
    {
        $tenant = $sub->tenant;
        $owner = $tenant->owner ?? User::where('tenant_id', $sub->tenant_id)->first();
        if (!$owner) return;

        $title = 'Layanan SaaS Di-Suspend Sementara';
        $message = "Halo {$owner->name}, masa tenggang berlangganan toko {$tenant->name} telah berakhir. Akses kasir di-suspend sementara. Data Anda tersimpan aman dan akan aktif kembali setelah konfirmasi pembayaran.";

        static::dispatch($sub->tenant_id, $owner->id, 'SUBSCRIPTION_SUSPENDED', $title, $message, $owner);
    }

    public static function dispatch(int $tenantId, int $userId, string $type, string $title, string $message, ?User $owner = null): void
    {
        // 1. In-App Portal Notification Center (Always Active)
        Notification::create([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
        ]);

        if (!$owner) {
            $owner = User::find($userId);
        }

        // 2. WhatsApp Multi-Channel Billing Notification (HTTP Gateway API)
        $waApiKey = SaaSSetting::get('wa_api_key', '');
        $waGatewayUrl = SaaSSetting::get('wa_gateway_url', 'https://api.fonnte.com/send');
        $phone = $owner?->phone ?? $owner?->tenant?->outlets?->first()?->phone;

        if (!empty($waApiKey) && !empty($phone)) {
            static::sendWhatsAppNotification($waGatewayUrl, $waApiKey, $phone, "*[KasirSewa SaaS Notification]*\n\n*{$title}*\n\n{$message}\n\nPerpanjang sekarang di: https://saas.superbackend.my.id/subscription");
        }

        // 3. Email Multi-Channel Billing Notification
        if (!empty($owner?->email)) {
            static::sendEmailNotification($owner->email, $title, $message);
        }
    }

    protected static function sendWhatsAppNotification(string $url, string $apiKey, string $targetPhone, string $textMessage): void
    {
        try {
            // Clean phone number format
            $cleanPhone = preg_replace('/[^0-9]/', '', $targetPhone);
            if (str_starts_with($cleanPhone, '0')) {
                $cleanPhone = '62' . substr($cleanPhone, 1);
            }

            Http::withHeaders([
                'Authorization' => $apiKey,
            ])->timeout(5)->post($url, [
                'target' => $cleanPhone,
                'message' => $textMessage,
            ]);

            Log::info("WA_BILLING_REMINDER_SENT_SUCCESS", ['phone' => $cleanPhone]);
        } catch (\Throwable $e) {
            Log::error("WA_BILLING_REMINDER_FAILED", ['error' => $e->getMessage()]);
        }
    }

    protected static function sendEmailNotification(string $toEmail, string $subject, string $bodyText): void
    {
        try {
            Mail::raw($bodyText . "\n\nPerpanjang di: https://saas.superbackend.my.id/subscription", function ($mail) use ($toEmail, $subject) {
                $mail->to($toEmail)->subject("[KasirSewa SaaS] " . $subject);
            });
            Log::info("EMAIL_BILLING_REMINDER_SENT_SUCCESS", ['email' => $toEmail]);
        } catch (\Throwable $e) {
            Log::error("EMAIL_BILLING_REMINDER_FAILED", ['error' => $e->getMessage()]);
        }
    }
}
