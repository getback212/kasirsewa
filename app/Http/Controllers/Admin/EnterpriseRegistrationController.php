<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\User;
use App\Models\Subscription;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Customer;
use App\Models\Plan;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class EnterpriseRegistrationController extends Controller
{
    public function create(Request $request): Response
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang mendaftarkan Enterprise.');
        }

        $plans = Plan::where('slug', 'enterprise-unlimited')->first();

        return Inertia::render('Admin/EnterpriseRegistration', [
            'plan' => $plans,
            'storeRoute' => route('admin.enterprise.store'),
            'dashboardRoute' => route('admin.dashboard'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang mendaftarkan Enterprise.');
        }

        $validated = $request->validate([
            'store_name' => 'required|string|max:255',
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|email|unique:users,email',
            'owner_phone' => 'required|string|max:20',
            'outlet_address' => 'required|string|max:500',
            'billing_cycle' => 'required|in:monthly,yearly',
            'subscription_status' => 'required|in:trial,active',
        ]);

        try {
            $tenantData = DB::transaction(function () use ($validated) {
                // 1. Create Tenant
                $slug = Str::slug($validated['store_name']) . '-' . rand(100, 999);
                $tenant = Tenant::create([
                    'name' => $validated['store_name'],
                    'slug' => $slug,
                    'domain' => $slug . '.superbackend.my.id',
                    'status' => 'active',
                ]);

                // 2. Create Company
                $company = Company::create([
                    'tenant_id' => $tenant->id,
                    'name' => $validated['store_name'],
                    'registration_number' => 'REG-' . strtoupper(Str::random(6)),
                    'is_active' => true,
                ]);

                // 3. Create Outlet
                $outlet = Outlet::create([
                    'company_id' => $company->id,
                    'tenant_id' => $tenant->id,
                    'name' => 'Outlet Pusat ' . $validated['store_name'],
                    'code' => 'OUT-' . mt_rand(1000, 9999),
                    'phone' => $validated['owner_phone'],
                    'address' => $validated['outlet_address'],
                    'is_active' => true,
                ]);

                // 4. Create Owner User
                $tempPassword = Str::random(16);
                $ownerUser = User::create([
                    'company_id' => $company->id,
                    'tenant_id' => $tenant->id,
                    'outlet_id' => $outlet->id,
                    'name' => $validated['owner_name'],
                    'email' => $validated['owner_email'],
                    'password' => Hash::make($tempPassword),
                    'is_active' => true,
                ]);

                $ownerUser->syncRoles([UserRole::OWNER->value]);
                $tenant->update(['owner_id' => $ownerUser->id]);

                // 5. Get Enterprise Plan
                $plan = Plan::where('slug', 'enterprise-unlimited')->first() ?? Plan::first();

                // 6. Create Subscription
                $trialEndsAt = $validated['subscription_status'] === 'trial' ? now()->addDays(7) : null;
                $expiresAt = $validated['subscription_status'] === 'trial' ? $trialEndsAt : now()->addMonths(1);

                $subscription = Subscription::create([
                    'tenant_id' => $tenant->id,
                    'plan_id' => $plan->id,
                    'status' => $validated['subscription_status'],
                    'billing_cycle' => $validated['billing_cycle'],
                    'starts_at' => now(),
                    'expires_at' => $expiresAt,
                    'trial_ends_at' => $trialEndsAt,
                    'auto_renew' => true,
                ]);

                // 7. Create Invoice
                $price = $validated['subscription_status'] === 'trial' ? 0 : $plan->monthly_price;
                $invoiceNumber = 'INV/SAAS/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

                $invoice = Invoice::create([
                    'tenant_id' => $tenant->id,
                    'subscription_id' => $subscription->id,
                    'invoice_number' => $invoiceNumber,
                    'subtotal' => $price,
                    'discount' => 0,
                    'tax' => 0,
                    'total' => $price,
                    'status' => $validated['subscription_status'] === 'trial' ? 'paid' : 'pending',
                    'due_at' => $expiresAt,
                ]);

                $desc = $validated['subscription_status'] === 'trial' 
                    ? "🎁 MASA UJI COBA GRATIS 7 HARI (Paket {$plan->name})"
                    : "💼 PAKET {$plan->name} - " . strtoupper($validated['billing_cycle']);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'description' => $desc,
                    'amount' => $price,
                ]);

                // 8. Create default Category
                Category::create([
                    'company_id' => $company->id,
                    'tenant_id' => $tenant->id,
                    'name' => 'Umum / Lainnya',
                    'slug' => 'umum',
                    'is_active' => true,
                ]);

                // 9. Create default Unit
                Unit::create([
                    'company_id' => $company->id,
                    'tenant_id' => $tenant->id,
                    'name' => 'Pcs',
                    'short_name' => 'pcs',
                ]);

                // 10. Create default Customer
                Customer::create([
                    'company_id' => $company->id,
                    'tenant_id' => $tenant->id,
                    'code' => 'CUST-UMUM-' . $tenant->id,
                    'name' => 'Pelanggan Umum',
                    'phone' => '-',
                ]);

                return [
                    'tenant' => $tenant,
                    'owner_email' => $validated['owner_email'],
                    'owner_name' => $validated['owner_name'],
                    'temp_password' => $tempPassword,
                    'store_name' => $validated['store_name'],
                ];
            });

            // Generate password reset token
            $resetToken = Str::random(64);
            DB::table('password_reset_tokens')->insert([
                'email' => $tenantData['owner_email'],
                'token' => hash('sha256', $resetToken),
                'created_at' => now(),
            ]);

            $resetLink = route('password.reset', ['token' => $resetToken, 'email' => $tenantData['owner_email']]);
            
            $tenantData['reset_link'] = $resetLink;

            // Log audit
            \App\Services\Audit\AuditLogService::log(
                action: 'ENTERPRISE_REGISTRATION_CREATED',
                modelType: 'Tenant',
                modelId: $tenantData['tenant']->id,
                newValues: [
                    'store_name' => $tenantData['store_name'],
                    'owner_email' => $tenantData['owner_email'],
                    'owner_name' => $tenantData['owner_name'],
                    'billing_cycle' => $validated['billing_cycle'],
                    'subscription_status' => $validated['subscription_status'],
                ]
            );

            return redirect()->route('admin.enterprise.show', $tenantData['tenant']->id)
                ->with('success', "✅ Enterprise '{$tenantData['store_name']}' berhasil didaftarkan untuk {$tenantData['owner_name']}. Password sementara: {$tenantData['temp_password']}")
                ->with('reset_link', $tenantData['reset_link'])
                ->with('owner_email', $tenantData['owner_email']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Enterprise Registration Failed', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return redirect()->back()
                ->with('error', '❌ Gagal mendaftarkan Enterprise. ' . $e->getMessage());
        }
    }

    public function show(Request $request, Tenant $tenant)
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang melihat detail Enterprise.');
        }

        $tenant->load(['owner', 'subscription.plan', 'company']);

        return Inertia::render('Admin/EnterpriseShow', [
            'tenant' => $tenant,
            'dashboardRoute' => route('admin.dashboard'),
        ]);
    }
}
