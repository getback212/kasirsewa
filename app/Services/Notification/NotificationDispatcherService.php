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
    /**
     * Guard anti-duplikat: cek apakah notifikasi dengan judul tertentu
     * sudah dikirim ke tenant ini hari ini (mencegah pengiriman ganda
     * saat command dijalankan berkali-kali dalam satu hari).
     */
    public static function reminderAlreadySentToday(int $tenantId, string $type, string $title): bool
    {
        return Notification::where('tenant_id', $tenantId)
            ->where('type', $type)
            ->where('title', $title)
            ->whereDate('created_at', now()->toDateString())
            ->exists();
    }

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

    public static function dispatch(int $tenantId, int $userId, string $type, string $title, string $message, ?User $owner = null): array
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
        // null = dilewati (tanpa API key / tanpa nomor), bool = hasil kirim.
        $whatsappSent = null;
        $waApiKey = config('services.wa.api_key') ?: SaaSSetting::get('wa_api_key', '');
        $waGatewayUrl = config('services.wa.gateway_url') ?: SaaSSetting::get('wa_gateway_url', 'http://kasirsewa_whatsapp:3001/send');
        $phone = $owner?->phone ?? $owner?->tenant?->outlets?->first()?->phone;

        if (!empty($waApiKey) && !empty($phone)) {
            $whatsappSent = static::sendWhatsAppNotification($waGatewayUrl, $waApiKey, $phone, "*[KasirSewa SaaS Notification]*\n\n*{$title}*\n\n{$message}\n\nPerpanjang sekarang di: https://saas.superbackend.my.id/subscription");
        }

        // 3. Email Multi-Channel Billing Notification
        $emailSent = false;
        if (!empty($owner?->email)) {
            $emailSent = static::sendEmailNotification($owner->email, $title, $message);
        }

        return ['in_app' => true, 'whatsapp' => $whatsappSent, 'email' => $emailSent];
    }

    protected static function sendWhatsAppNotification(string $url, string $apiKey, string $targetPhone, string $textMessage): bool
    {
        try {
            // Clean phone number format
            $cleanPhone = preg_replace('/[^0-9]/', '', $targetPhone);
            if (str_starts_with($cleanPhone, '0')) {
                $cleanPhone = '62' . substr($cleanPhone, 1);
            }

            $response = Http::withHeaders([
                'Authorization' => $apiKey,
            ])->timeout(20)->post($url, [
                'target' => $cleanPhone,
                'message' => $textMessage,
            ]);

            // The gateway returns 401 for a wrong key and 5xx when the
            // WhatsApp session is down. Http does not throw on those, so a
            // missing check would log success for a message never sent.
            if (! $response->successful()) {
                Log::error("WA_BILLING_REMINDER_FAILED", [
                    'phone' => $cleanPhone,
                    'status' => $response->status(),
                    'body' => mb_substr((string) $response->body(), 0, 300),
                ]);

                return false;
            }

            Log::info("WA_BILLING_REMINDER_SENT_SUCCESS", ['phone' => $cleanPhone]);

            return true;
        } catch (\Throwable $e) {
            Log::error("WA_BILLING_REMINDER_FAILED", ['error' => $e->getMessage()]);

            return false;
        }
    }

    protected static function sendEmailNotification(string $toEmail, string $subject, string $bodyText): bool
    {
        try {
            Mail::raw($bodyText . "\n\nPerpanjang di: https://saas.superbackend.my.id/subscription", function ($mail) use ($toEmail, $subject) {
                $mail->to($toEmail)->subject("[KasirSewa SaaS] " . $subject);
            });
            Log::info("EMAIL_BILLING_REMINDER_SENT_SUCCESS", ['email' => $toEmail]);

            return true;
        } catch (\Throwable $e) {
            Log::error("EMAIL_BILLING_REMINDER_FAILED", ['error' => $e->getMessage()]);

            return false;
        }
    }
}
