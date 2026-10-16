<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

/**
 * GoogleAuthController — Handles Google SSO for EXISTING users only.
 *
 * FLOW DIAGRAM:
 *
 * 1. NEW OWNER (registration):
 *    Landing Page (plan selector) → /register?plan=X (RegisterController)
 *    → Form (email, password, store name) → New Tenant created
 *
 * 2. EXISTING USER (linking Google / SSO):
 *    Login Page (Google button) → redirectToGoogle() → Google OAuth
 *    → handleGoogleCallback() → Check by google_id OR email
 *    → If exists: Link google_id + Login
 *    → If NOT exists: Redirect to /register with message
 *
 * 3. EMPLOYEE (added by owner):
 *    Owner invites employee in admin panel
 *    → User created in DB (email, no password set yet)
 *    → Employee logs in with email+password (or reset password link)
 *    → Later: Can link Google account if desired
 *
 * SECURITY RULES:
 * - Auto-create tenant ONLY via RegisterController (form-based, plan choice)
 * - Google callback MUST NOT create tenant (SSO only for existing users)
 * - All unregistered emails → redirect to /register with instructions
 */
class GoogleAuthController extends Controller
{
    /**
     * Step 1: Redirect to Google OAuth consent screen.
     *
     * Query params (if from /register flow):
     * - plan_id: Selected plan ID (to preserve selection after Google callback)
     * - billing_cycle: Monthly/yearly choice
     */
    public function redirectToGoogle(Request $request)
    {
        // Store plan selection in session so it survives OAuth redirect
        if ($request->has('plan_id')) {
            session(['google_plan_id' => $request->input('plan_id')]);
        }
        if ($request->has('billing_cycle')) {
            session(['google_billing_cycle' => $request->input('billing_cycle')]);
        }

        return Socialite::driver('google')->redirect();
    }

    /**
     * Step 2: Google callback handler.
     *
     * Decision tree:
     * - User exists (by google_id): Link + Login ✓
     * - User exists (by email, no google_id): Link google_id + Login ✓
     * - User NOT exists: Reject, redirect to /register with message ✓
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // LOOKUP: Check if user exists by google_id (primary) or email (fallback)
            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $googleUser->getEmail())
                ->first();

            // ❌ NO USER FOUND: Reject auto-registration, redirect to /register
            if (! $user) {
                // Preserve plan selection if coming from /register flow
                $planId = session()->pull('google_plan_id');
                $billingCycle = session()->pull('google_billing_cycle', 'monthly');
                $googleEmail = $googleUser->getEmail();

                Log::info('Google OAuth: New email, redirecting to register', [
                    'email' => $googleEmail,
                    'plan_id' => $planId,
                    'billing_cycle' => $billingCycle,
                ]);

                // Store Google user data in session for auto-fill in registration form
                session([
                    'google_email' => $googleEmail,
                    'google_name' => $googleUser->getName(),
                    'google_id_oauth' => $googleUser->getId(),
                    'google_avatar' => $googleUser->getAvatar(),
                ]);

                $redirectUrl = '/register';
                if ($planId) {
                    $redirectUrl .= '?plan_id='.$planId;
                    if ($billingCycle) {
                        $redirectUrl .= '&billing_cycle='.$billingCycle;
                    }
                }

                return redirect($redirectUrl)->with(
                    'info',
                    '📧 Email Anda belum terdaftar. Silakan selesaikan pendaftaran toko dengan Google email: '.$googleEmail
                );
            }

            // ✓ USER EXISTS: Update Google ID (if new) and login
            if (! $user->google_id || $user->google_id !== $googleUser->getId()) {
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar() ?? $user->avatar,
                ]);
            }

            Auth::login($user, true);

            // Set active tenant/outlet in session for multi-tenant context
            session([
                'active_tenant_id' => $user->tenant_id,
                'active_outlet_id' => $user->outlet_id,
            ]);

            // Audit log
            Log::info('User Google Login', [
                'user_id' => $user->id,
                'email' => $user->email,
                'method' => 'Google SSO',
            ]);

            // Route to appropriate dashboard based on role
            $targetRoute = '/dashboard';
            if ($user->hasRole(UserRole::CASHIER->value)) {
                $targetRoute = '/pos';
            } elseif ($user->hasRole(UserRole::WAREHOUSE->value)) {
                $targetRoute = '/stock';
            }

            return redirect($targetRoute)->with('success', "✅ Selamat datang kembali, {$user->name}!");
        } catch (\Throwable $e) {
            Log::warning('Google Auth Callback Failed', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect('/login')->with('error', '❌ Gagal masuk menggunakan Google. Silakan coba lagi.');
        }
    }
}
