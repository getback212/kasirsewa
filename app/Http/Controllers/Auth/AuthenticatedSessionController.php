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
            return redirect()->intended('/inventory');
        }

        return redirect()->intended('/dashboard');
    }

    public function storeSuperAdmin(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();

        if ($user && !$user->hasRole('SUPER_ADMIN')) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect('/login')->withErrors([
                'email' => '🔒 Portal ini khusus untuk Super Admin SaaS. Untuk akun Toko/Kasir, silahkan login di sini.',
            ]);
        }

        $request->session()->regenerate();

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
