<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * AuthenticatedSessionController — Email+Password authentication for all user types.
 *
 * FLOW:
 * 1. /login (form) → Store credentials via LoginRequest
 * 2. Validation: email + password (LoginRequest checks credentials)
 * 3. Role-based routing after successful auth:
 *    - SUPER_ADMIN: Redirect to /admin/dashboard (must use /super-admin/login instead, rejected here)
 *    - OWNER: Redirect to /dashboard (store dashboard)
 *    - CASHIER: Redirect to /pos (POS system)
 *    - WAREHOUSE: Redirect to /stock (inventory system)
 *    - Default: /dashboard
 * 4. Session setup: active_tenant_id + active_outlet_id
 * 5. Audit log: USER_LOGIN
 *
 * SECURITY RULES:
 * - Super Admin MUST use /super-admin/login (rejected here with clear message)
 * - Non-Super-Admin users rejected from /super-admin/login
 * - Session regeneration on login (CSRF protection)
 * - Audit logging for all logins
 *
 * COMPATIBLE WITH:
 * - Email+Password registration (RegisterController)
 * - Google SSO linking (GoogleAuthController)
 * - Employee invitation (Owner adds users via admin panel)
 */
class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function createSuperAdmin(): Response
    {
        return Inertia::render('Auth/SuperAdminLogin');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();

        if ($user && $user->hasRole('SUPER_ADMIN')) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/super-admin/login')->withErrors([
                'email' => '🔒 Akun Super Admin SaaS wajib masuk melalui Portal Login Khusus Super Admin (/super-admin/login).',
            ]);
        }

        $request->session()->regenerate();

        if ($user) {
            session([
                'active_tenant_id' => $user->tenant_id,
                'active_outlet_id' => $user->outlet_id,
            ]);
        }

        AuditLogService::log(
            action: 'USER_LOGIN',
            modelType: 'User',
            modelId: $user->id,
            newValues: ['email' => $user->email, 'name' => $user->name]
        );

        if ($user && $user->hasRole('CASHIER')) {
            return redirect()->intended('/pos');
        }

        if ($user && $user->hasRole('WAREHOUSE')) {
            return redirect()->intended('/stock');
        }

        return redirect()->intended('/dashboard');
    }

    public function storeSuperAdmin(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();

        if ($user && ! $user->hasRole('SUPER_ADMIN')) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/login')->withErrors([
                'email' => '🔒 Portal ini khusus untuk Super Admin SaaS. Untuk akun Toko/Kasir, silahkan login di sini.',
            ]);
        }

        $request->session()->regenerate();

        // Set active tenant for super admin (default to first tenant in the platform)
        $firstTenant = \App\Models\Tenant::where('company_id', $user->company_id)
            ->orWhereHas('stores', function ($q) use ($user) {
                $q->where('company_id', $user->company_id);
            })
            ->first();
        
        if ($firstTenant) {
            session(['active_tenant_id' => $firstTenant->id]);
        }

        AuditLogService::log(
            action: 'SUPER_ADMIN_LOGIN',
            modelType: 'User',
            modelId: $user->id,
            newValues: ['email' => $user->email, 'name' => $user->name]
        );

        return redirect()->intended('/admin/dashboard');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();
        if ($user) {
            AuditLogService::log(
                action: 'USER_LOGOUT',
                modelType: 'User',
                modelId: $user->id,
                newValues: ['email' => $user->email, 'name' => $user->name]
            );
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
