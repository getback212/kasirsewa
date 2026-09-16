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

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user();

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

        if ($user && $user->hasRole('SUPER_ADMIN')) {
            return redirect()->intended('/admin/dashboard');
        }

        if ($user && $user->hasRole('CASHIER')) {
            return redirect()->intended('/pos');
        }

        if ($user && $user->hasRole('WAREHOUSE')) {
            return redirect()->intended('/inventory');
        }

        return redirect()->intended('/');
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
