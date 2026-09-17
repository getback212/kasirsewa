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

        $defaultBankAccounts = [
            [
                'id' => 1,
                'bank_name' => 'Bank BCA',
                'account_number' => SaaSSetting::get('bank_bca_number', '123-456-7890'),
                'account_name' => SaaSSetting::get('bank_bca_name', 'PT KasirSewa Indonesia'),
                'is_active' => true,
            ],
            [
                'id' => 2,
                'bank_name' => 'Bank Mandiri',
                'account_number' => SaaSSetting::get('bank_mandiri_number', '987-000-111-22'),
                'account_name' => SaaSSetting::get('bank_mandiri_name', 'PT KasirSewa Indonesia'),
                'is_active' => true,
            ]
        ];

        $bankAccountsRaw = SaaSSetting::get('bank_accounts', null);
        $bankAccounts = $bankAccountsRaw ? json_decode($bankAccountsRaw, true) : $defaultBankAccounts;

        $settings = [
            'bank_accounts' => $bankAccounts,
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
            'bank_accounts' => ['nullable', 'array'],
            'bank_accounts.*.bank_name' => ['required', 'string', 'max:100'],
            'bank_accounts.*.account_number' => ['required', 'string', 'max:100'],
            'bank_accounts.*.account_name' => ['required', 'string', 'max:100'],
            'bank_accounts.*.is_active' => ['nullable', 'boolean'],
            'bank_bca_number' => ['nullable', 'string', 'max:100'],
            'bank_bca_name' => ['nullable', 'string', 'max:100'],
            'bank_mandiri_number' => ['nullable', 'string', 'max:100'],
            'bank_mandiri_name' => ['nullable', 'string', 'max:100'],
            'qris_payload' => ['nullable', 'string'],
            'payment_instructions' => ['nullable', 'string'],
        ]);

        if (isset($validated['bank_accounts'])) {
            SaaSSetting::set('bank_accounts', json_encode($validated['bank_accounts']));
        }

        if (!empty($validated['qris_payload'])) {
            SaaSSetting::set('qris_payload', $validated['qris_payload']);
        }
        if (!empty($validated['payment_instructions'])) {
            SaaSSetting::set('payment_instructions', $validated['payment_instructions']);
        }

        AuditLogService::log('SAAS_PAYMENT_SETTINGS_UPDATE', 'SaaSSetting', 1, $validated);

        return redirect()->back()->with('success', 'Daftar rekening bank & QRIS pembayaran SaaS berhasil diperbarui!');
    }
}
