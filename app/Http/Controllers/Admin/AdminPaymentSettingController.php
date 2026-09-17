<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SaaSSetting;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminPaymentSettingController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang mengatur rekening pembayaran SaaS.');
        }

        $settings = [
            'bank_bca_number' => SaaSSetting::get('bank_bca_number', '123-456-7890'),
            'bank_bca_name' => SaaSSetting::get('bank_bca_name', 'PT KasirSewa Indonesia'),
            'bank_mandiri_number' => SaaSSetting::get('bank_mandiri_number', '987-000-111-22'),
            'bank_mandiri_name' => SaaSSetting::get('bank_mandiri_name', 'PT KasirSewa Indonesia'),
            'qris_payload' => SaaSSetting::get('qris_payload', ''),
            'payment_instructions' => SaaSSetting::get('payment_instructions', 'Silakan melakukan transfer sesuai nominal invoice.'),
        ];

        return Inertia::render('Admin/PaymentSettingsIndex', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang mengubah rekening pembayaran SaaS.');
        }

        $validated = $request->validate([
            'bank_bca_number' => ['required', 'string', 'max:100'],
            'bank_bca_name' => ['required', 'string', 'max:100'],
            'bank_mandiri_number' => ['required', 'string', 'max:100'],
            'bank_mandiri_name' => ['required', 'string', 'max:100'],
            'qris_payload' => ['nullable', 'string'],
            'payment_instructions' => ['nullable', 'string'],
        ]);

        foreach ($validated as $key => $value) {
            SaaSSetting::set($key, $value);
        }

        AuditLogService::log('SAAS_PAYMENT_SETTINGS_UPDATE', 'SaaSSetting', 1, $validated);

        return redirect()->back()->with('success', 'Pengaturan nomor rekening & QRIS pembayaran SaaS berhasil diperbarui!');
    }
}
