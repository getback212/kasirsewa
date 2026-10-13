<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Outlet;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Unit;
use App\Support\TenantDomain;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirectToGoogle(Request $request)
    {
        if ($request->has('plan_id')) {
            session(['google_plan_id' => $request->input('plan_id')]);
        }
        if ($request->has('billing_cycle')) {
            session(['google_billing_cycle' => $request->input('billing_cycle')]);
        }

        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            // Keep the OAuth state check enabled for this browser session.
            $googleUser = Socialite::driver('google')->user();

            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $googleUser->getEmail())
                ->first();

            if (!$user) {
                // Self-register new Tenant via Google SSO
                DB::transaction(function () use ($googleUser, &$user) {
                    $googleName = $googleUser->getName() ?? $googleUser->getNickname() ?? 'Pengguna Google';
                    $storeName = 'Toko ' . $googleName;
                    $slug = Str::slug($storeName) . '-' . rand(100, 999);

                    $tenant = Tenant::create([
                        'name' => $storeName,
                        'slug' => $slug,
                        'domain' => $slug . '.superbackend.my.id',
                        'status' => 'active',
                    ]);

                    $company = Company::create([
                        'tenant_id' => $tenant->id,
                        'name' => $storeName,
                        'registration_number' => 'REG-' . strtoupper(Str::random(6)),
                        'is_active' => true,
                    ]);

                    $outlet = Outlet::create([
                        'company_id' => $company->id,
                        'tenant_id' => $tenant->id,
                        'name' => 'Outlet Pusat ' . $storeName,
                        'code' => 'OUT-' . mt_rand(1000, 9999),
                        'phone' => '0812' . rand(10000000, 99999999),
                        'address' => 'Alamat Outlet Pusat',
                        'is_active' => true,
                    ]);

                    $user = User::create([
                        'company_id' => $company->id,
                        'tenant_id' => $tenant->id,
                        'outlet_id' => $outlet->id,
                        'name' => $googleName,
                        'email' => $googleUser->getEmail(),
                        'password' => Hash::make(Str::random(16)),
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar(),
                        'is_active' => true,
                    ]);

                    // syncRoles, not assignRole: a new owner must own exactly
                    // the OWNER role. If a leftover pivot row from a deleted
                    // user already sits on this id, assignRole would keep it
                    // and the owner would land in the cashier UI.
                    $user->syncRoles([UserRole::OWNER->value]);
                    $tenant->update(['owner_id' => $user->id]);

                    $planId = session()->pull('google_plan_id');
                    $billingCycle = session()->pull('google_billing_cycle', 'monthly');

                    $plan = $planId ? Plan::find($planId) : null;
                    if (!$plan) {
                        $plan = Plan::where('slug', 'starter-basic')->first() ?? Plan::first();
                    }

                    // Semua paket mendapat trial gratis 7 hari
                    $trialEndsAt = now()->addDays(7);
                    $status = 'trial';
                    $expiresAt = $trialEndsAt;

                    $subscription = Subscription::create([
                        'tenant_id' => $tenant->id,
                        'plan_id' => $plan->id,
                        'status' => $status,
                        'billing_cycle' => $billingCycle,
                        'starts_at' => now(),
                        'expires_at' => $expiresAt,
                        'trial_ends_at' => $trialEndsAt,
                        'auto_renew' => true,
                    ]);

                    // Initial registration invoice (Rp 0 / Lunas during 7-Day Free Trial)
                    $price = 0.00;
                    $invoiceNumber = 'INV/SAAS/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

                    $invoice = Invoice::create([
                        'tenant_id' => $tenant->id,
                        'subscription_id' => $subscription->id,
                        'invoice_number' => $invoiceNumber,
                        'subtotal' => $price,
                        'discount' => 0,
                        'tax' => 0,
                        'total' => $price,
                        'status' => 'paid',
                        'due_at' => $trialEndsAt,
                    ]);

                    $desc = "🎁 MASA UJI COBA GRATIS 7 HARI (Paket {$plan->name})";

                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'description' => $desc,
                        'amount' => $price,
                    ]);

                    Category::create([
                        'company_id' => $company->id,
                        'tenant_id' => $tenant->id,
                        'name' => 'Umum / Lainnya',
                        'slug' => 'umum',
                        'is_active' => true,
                    ]);

                    Unit::create([
                        'company_id' => $company->id,
                        'tenant_id' => $tenant->id,
                        'name' => 'Pcs',
                        'short_name' => 'pcs',
                    ]);

                    Customer::create([
                        'company_id' => $company->id,
                        'tenant_id' => $tenant->id,
                        'code' => 'CUST-UMUM-' . $tenant->id,
                        'name' => 'Pelanggan Umum',
                        'phone' => '-',
                    ]);
                });
            } else {
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar() ?? $user->avatar,
                ]);
            }

            Auth::login($user, true);

            session([
                'active_tenant_id' => $user->tenant_id,
                'active_outlet_id' => $user->outlet_id,
            ]);

            \App\Services\Audit\AuditLogService::log(
                action: 'USER_LOGIN',
                modelType: 'User',
                modelId: $user->id,
                newValues: [
                    'email' => $user->email,
                    'name' => $user->name,
                    'login_method' => 'Google SSO',
                ]
            );

            $targetRoute = '/dashboard';
            if ($user->hasRole(UserRole::CASHIER->value)) {
                $targetRoute = '/pos';
            } elseif ($user->hasRole(UserRole::WAREHOUSE->value)) {
                $targetRoute = '/stock';
            }

            return redirect($targetRoute)->with('success', "✅ Selamat datang kembali, {$user->name}!");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Google Auth Failed', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return redirect('/login')->with('error', 'Gagal masuk menggunakan Google. Silakan coba lagi.');
        }
    }
}
