<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SaaSSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class VerifyOtpController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Auth/VerifyOtp', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'phone_verified_at' => $user->phone_verified_at ? $user->phone_verified_at->format('Y-m-d H:i:s') : null,
                'is_verified' => !is_null($user->phone_verified_at),
            ],
        ]);
    }

    public function sendOtp(Request $request): RedirectResponse
    {
        $request->validate([
            'phone' => ['required', 'string', 'min:10', 'max:15'],
        ], [
            'phone.required' => 'Nomor WhatsApp wajib diisi.',
            'phone.min' => 'Nomor WhatsApp minimal 10 digit.',
        ]);

        $user = $request->user();
        $phone = preg_replace('/[^0-9]/', '', $request->phone);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }

        $otp = (string) rand(100000, 999999);

        $user->update([
            'phone' => $phone,
            'phone_otp' => $otp,
            'phone_otp_expires_at' => now()->addMinutes(10),
        ]);

        // Send via the configured WhatsApp gateway. Prefer the app config
        // (shared with the dispatcher and the gateway itself) and fall back to
        // the DB setting for operators who configure it from the admin panel.
        // Default to the compose service name so app/queue/scheduler all reach
        // the same gateway; never a hardcoded host IP.
        $waGatewayUrl = config('services.wa.gateway_url') ?: SaaSSetting::get('wa_gateway_url', 'http://kasirsewa_whatsapp:3001/send');
        $waApiKey = config('services.wa.api_key') ?: SaaSSetting::get('wa_api_key', 'baileys_free_gateway');

        $defaultTemplate = "🔐 *Kode OTP Verifikasi WhatsApp KasirSewa*\n\nKode OTP Anda adalah: *{otp}*\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun demi keamanan akun toko Anda.";
        $template = SaaSSetting::get('wa_otp_template', $defaultTemplate);
        $message = str_replace('{otp}', $otp, $template);

        try {
            $res = Http::withHeaders([
                'Authorization' => $waApiKey,
            ])->timeout(5)->post($waGatewayUrl, [
                'target' => $phone,
                'phone' => $phone,
                'message' => $message,
            ]);

            if ($res->successful()) {
                return redirect()->back()->with('success', "✅ Kode OTP 6-Digit berhasil dikirim ke nomor WhatsApp Anda! Silakan periksa pesan WA yang masuk.");
            }

            // The gateway answered but rejected the message (wrong key, session
            // down, bad number). Do not report success: the user must know the
            // OTP was not delivered.
            Log::error('WA OTP gateway rejected the message', [
                'status' => $res->status(),
                'target' => $phone,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send WA OTP', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
        }

        return redirect()->back()->with('error', '❌ Gagal mengirim kode OTP ke WhatsApp. Periksa nomor Anda atau coba lagi sebentar lagi.');
    }

    public function verifyOtp(Request $request): RedirectResponse
    {
        $request->validate([
            'otp' => ['required', 'string', 'digits:6'],
        ], [
            'otp.required' => 'Kode OTP 6-digit wajib diisi.',
            'otp.digits' => 'Kode OTP harus berupa 6 digit angka.',
        ]);

        $user = $request->user();
        $inputOtp = trim((string) $request->otp);
        $dbOtp = trim((string) $user->phone_otp);

        if (empty($dbOtp) || $dbOtp !== $inputOtp) {
            return redirect()->back()->withErrors([
                'otp' => '❌ Kode OTP 6-digit yang Anda masukkan salah atau tidak cocok.',
            ]);
        }

        if ($user->phone_otp_expires_at && $user->phone_otp_expires_at->isPast()) {
            return redirect()->back()->withErrors([
                'otp' => '⏰ Kode OTP telah kedaluwarsa. Silakan klik "Kirim Ulang Kode OTP".',
            ]);
        }

        $user->update([
            'phone_verified_at' => now(),
            'phone_otp' => null,
            'phone_otp_expires_at' => null,
        ]);

        $targetRoute = '/dashboard';
        if ($user->hasRole('CASHIER')) {
            $targetRoute = '/pos';
        } elseif ($user->hasRole('WAREHOUSE')) {
            $targetRoute = '/stock';
        }

        return redirect($targetRoute)->with('success', '✅ Nomor WhatsApp berhasil diverifikasi! Akun Anda kini 100% aktif dan terverifikasi.');
    }
}
