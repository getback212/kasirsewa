<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Outlet;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Services\Audit\AuditLogService;
use App\Support\TenantDomain;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * RegisterController — Handles NEW OWNER registration (form-based, plan selection).
 *
 * ONLY ENTRY POINT FOR NEW TENANT CREATION.
 *
 * FLOW:
 * 1. Landing page: User selects plan (Starter/Pro/Enterprise)
 * 2. Clicks "Mulai Trial" → /register?plan=starter-basic (or other plan slug)
 * 3. RegisterController::create() reads query param, pre-selects plan in form
 * 4. Form shows: store name, owner name, email, password, billing cycle
 * 5. User submits → RegisterController::store() validates and creates:
 *    - New Tenant (auto domain + slug)
 *    - New Company
 *    - New Outlet
 *    - New Owner User (OWNER role, this password)
 *    - New Subscription (trial 7 days for ALL plans)
 *    - Initial Invoice (Rp 0 for trial)
 *    - Default Category, Unit, Customer
 * 6. Owner auto-logged in → Dashboard
 * 7. Audit logged: SAAS_TENANT_SELF_REGISTER
 *
 * SECURITY RULES:
 * - Email must be unique (no re-registration)
 * - Only ONE entry point to create new tenant
 * - Owner role assigned via syncRoles (not assignRole) to prevent stale pivot issues
 * - All tenants start with 7-day trial regardless of plan selection
 */
class RegisterController extends Controller
{
    /**
     * Show registration form with plan pre-selection (if from landing page).
     *
     * Query params:
     * - plan: plan slug (starter-basic, business-pro, enterprise-unlimited)
     *        If missing or invalid, defaults to starter-basic
     *
     * @return Response Inertia component with plans list + selected_plan_id
     */
    public function create(Request $request): Response
    {
        // Only show Starter Basic and Business Pro at registration
        $plans = Plan::where('is_active', true)
            ->whereIn('id', [1, 2])  // 1=Starter Basic, 2=Business Pro
            ->get();
        
        // Accept both plan_id (numeric) and plan (slug) parameters
        $planIdFromQuery = $request->query('plan_id');
        $planSlugFromQuery = $request->query('plan');

        // Map legacy/alternate slugs to current slugs (for backward compatibility)
        // Only map if the plan slug doesn't already exist in database
        $slugMap = [
            'starter' => 'starter-basic',    // Legacy: 'starter' → 'starter-basic'
            'pro' => 'business-pro',         // Legacy: 'pro' → 'business-pro'
            'professional' => 'business-pro', // Legacy: 'professional' → 'business-pro'
        ];
        
        if ($planSlugFromQuery && isset($slugMap[$planSlugFromQuery])) {
            $planSlugFromQuery = $slugMap[$planSlugFromQuery];
        }

        $selectedPlan = null;
        
        // Try by numeric ID first
        if ($planIdFromQuery) {
            $selectedPlan = $plans->firstWhere('id', (int) $planIdFromQuery);
        }
        
        // Try by slug if ID not found
        if (!$selectedPlan && $planSlugFromQuery) {
            $selectedPlan = $plans->firstWhere('slug', $planSlugFromQuery);
        }
        
        $selectedPlan = $selectedPlan ?? $plans->first();

        // Check if redirected from Google OAuth (new email)
        $googleEmail = session('google_email');
        $googleName = session('google_name');
        $googleIdOauth = session('google_id_oauth');

        return Inertia::render('Auth/Register', [
            'plans' => $plans,
            'selected_plan_id' => $selectedPlan?->id ?? ($plans->first()?->id ?? 1),
            'google_email' => $googleEmail,
            'google_name' => $googleName,
            'google_id' => $googleIdOauth,
        ]);
    }

    /**
     * Process registration form submission.
     *
     * Validates input, creates tenant+company+outlet+owner+subscription+invoice in transaction.
     * Auto-logs in owner and redirects to dashboard.
     *
     * @return RedirectResponse to /dashboard on success, or back with validation errors
     */
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
            'google_id' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $slug = Str::slug($request->store_name).'-'.mt_rand(100, 999);
            $domain = TenantDomain::normalize("$slug.superbackend.my.id");
            if (Tenant::whereRaw('LOWER(domain) = ?', [$domain])->exists()) {
                // extremely unlikely due to random suffix, but fallback with another attempt
                $slug = Str::slug($request->store_name).'-'.mt_rand(1000, 9999);
                $domain = TenantDomain::normalize("$slug.superbackend.my.id");
            }

            // 1. Create Tenant
            $tenant = Tenant::create([
                'name' => $request->store_name,
                'slug' => $slug,
                'domain' => $domain,
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
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'google_id' => $request->google_id, // Link Google ID if from OAuth
                'email_verified_at' => now(),
                'is_active' => true,
            ]);

            // syncRoles (not assignRole): the new owner must hold exactly the
            // OWNER role, never a stale assignment inherited via a reused id.
            $owner->syncRoles([UserRole::OWNER->value]);
            $tenant->update(['owner_id' => $owner->id]);

            // 4. Create Initial Subscription (7-Day Free Trial for All plans)
            $plan = Plan::findOrFail($request->plan_id);
            // Semua paket mendapat trial gratis 7 hari
            $trialEndsAt = now()->addDays(7);
            $status = 'trial';
            $expiresAt = $trialEndsAt;

            $subscription = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'status' => $status,
                'billing_cycle' => $request->billing_cycle,
                'starts_at' => now(),
                'expires_at' => $expiresAt,
                'trial_ends_at' => $trialEndsAt,
                'auto_renew' => true,
            ]);

            // 5. Create Initial Registration Invoice (Rp 0 / Lunas during 7-Day Free Trial)
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

            $welcomeMsg = "Selamat datang di KasirSewa! Toko '{$tenant->name}' berhasil mendaftar dengan Masa Trial Gratis 7 Hari — Paket {$plan->name}.";

            return redirect('/dashboard')->with('success', $welcomeMsg);
        });
    }
}
