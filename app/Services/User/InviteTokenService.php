<?php

namespace App\Services\User;

use App\Models\User;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class InviteTokenService
{
    /**
     * Generate secure invite token for user
     * Token stored in cache for 7 days (or custom TTL)
     */
    public static function generate(User $user, int $ttlMinutes = 10080): string // 7 days default
    {
        $token = Str::random(32);
        $key = "user_invite:{$token}";

        Cache::put($key, [
            'user_id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
        ], now()->addMinutes($ttlMinutes));

        return $token;
    }

    /**
     * Validate invite token
     */
    public static function validate(string $token): ?array
    {
        $key = "user_invite:{$token}";
        return Cache::get($key);
    }

    /**
     * Consume token (delete after use)
     */
    public static function consume(string $token): void
    {
        $key = "user_invite:{$token}";
        Cache::forget($key);
    }

    /**
     * Generate QR code image (base64 or file path)
     * Link format: /accept-invite?token=XXX&email=user@..
     */
    public static function generateQrCode(User $user, string $token, bool $returnBase64 = true): string
    {
        $url = config('app.url')."/accept-invite?token={$token}&email=".urlencode($user->email);

        $qrCode = new QrCode($url);
        $qrCode->setSize(300);
        $qrCode->setMargin(10);

        $writer = new PngWriter();
        $result = $writer->write($qrCode);

        if ($returnBase64) {
            return 'data:image/png;base64,' . base64_encode($result->getString());
        }

        $filename = "invite_{$user->id}_{$token}.png";
        $path = storage_path("app/public/qrcodes/{$filename}");
        
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }
        
        file_put_contents($path, $result->getString());
        return "/storage/qrcodes/{$filename}";
    }

    /**
     * Generate invite link
     */
    public static function generateLink(User $user, string $token): string
    {
        return config('app.url')."/accept-invite?token={$token}&email=".urlencode($user->email);
    }
}
