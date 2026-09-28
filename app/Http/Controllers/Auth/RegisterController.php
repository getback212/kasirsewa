<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\User;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Enums\UserRole;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function create(): Response
    {
        $plans = Plan::where('is_active', true)->get();
        return Inertia::render('Auth/Register', ['plans' => $plans]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'store_name' => 'required|string|max:255',
            'owner_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:50',
            'password' => 'required|string|min:6|confirmed',
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,yearly',
        ]);

        return DB::transaction(function () use ($request) {
            $slug = Str::slug($request->store_name).'-'.mt_rand(100, 999);

            // 1. Create Tenant
            $tenant = Tenant::create([
                'name' => $request->store_name,
                'slug' => $slug,
                'domain' => $slug.'.kasirsewa.com',
                'status' => 'active',
            ]);

            session(['active_tenant_id' => $tenant->id]);

            // 2. Create Company & Store Outlet
            $company = Company::create([
                'name' => $tenant->name,
                'registration_number' => 'REG-'.strtoupper(Str::random(6)),
                'is_active' => true,
            ]);

            $outlet = Outlet::create([
                'company_id' => $company->id,
                'tenant_id' => $tenant->id,
                'code' => 'OUT-'.mt_rand(1000, 9999),
                'name' => $request->store_name.' - Store Utama',
                'phone' => $request->phone,
                'address' => 'Alamat Utama Toko',
                'is_active' => true,
            ]);

            // 3. Create Tenant Owner User
            $owner = User::create([
                'company_id' => $company->id,
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'name' => $request->owner_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => true,
            ]);

            $owner->assignRole(UserRole::OWNER->value);
            $tenant->update(['owner_id' => $owner->id]);

            // 4. Create Initial Subscription (14-Day Free Trial)
            $plan = Plan::findOrFail($request->plan_id);
            $trialEndsAt = now()->addDays(14);

            $subscription = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'status' => 'trial',
                'billing_cycle' => $request->billing_cycle,
                'starts_at' => now(),
                'expires_at' => $trialEndsAt,
                'trial_ends_at' => $trialEndsAt,
                'auto_renew' => true,
            ]);

            // 5. Create Initial Registration Invoice
            $price = $request->billing_cycle === 'yearly' ? $plan->yearly_price : $plan->monthly_price;
            $invoiceNumber = 'INV/SAAS/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

            $invoice = Invoice::create([
                'tenant_id' => $tenant->id,
                'subscription_id' => $subscription->id,
                'invoice_number' => $invoiceNumber,
                'subtotal' => $price,
                'discount' => 0,
                'tax' => 0,
                'total' => $price,
                'status' => 'pending',
                'due_at' => $trialEndsAt,
            ]);

            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'description' => "Biaya Berlangganan SaaS {$plan->name} ({$request->billing_cycle}) - Masa Trial 14 Hari",
                'amount' => $price,
            ]);

            // 6. Seed Default Category & Unit
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
                'name' => 'Pieces',
                'short_name' => 'pcs',
            ]);

            Customer::create([
                'company_id' => $company->id,
                'tenant_id' => $tenant->id,
                'code' => 'CUST-UMUM-'.$tenant->id,
                'name' => 'Pelanggan Umum',
                'phone' => '-',
            ]);

            AuditLogService::log(
                action: 'SAAS_TENANT_SELF_REGISTER',
                modelType: 'Tenant',
                modelId: $tenant->id,
                newValues: ['name' => $tenant->name, 'owner' => $owner->email, 'plan' => $plan->name]
            );

            // Auto-login registered owner
            auth()->login($owner);

            session([
                'active_tenant_id' => $tenant->id,
                'active_outlet_id' => $outlet->id,
            ]);

            return redirect('/dashboard')->with('success', "Selamat datang di KasirSewa! Toko '{$tenant->name}' berhasil mendaftar dengan Masa Trial Gratis 14 Hari.");
        });
    }
}
