<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\User\InviteTokenService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AcceptInviteController extends Controller
{
    public function show(Request $request): View
    {
        $token = $request->query('token');
        $email = $request->query('email');

        // Validate token exists
        $inviteData = InviteTokenService::validate($token);
        if (!$inviteData || $inviteData['email'] !== $email) {
            abort(401, 'Invite token tidak valid atau sudah expired.');
        }

        return view('auth.accept-invite', [
            'token' => $token,
            'email' => $email,
            'name' => $inviteData['name'],
        ]);
    }

    public function accept(Request $request)
    {
        $token = $request->input('token');
        $email = $request->input('email');
        $password = $request->input('password');

        if (!$password || strlen($password) < 6) {
            return back()->with('error', 'Password minimal 6 karakter.');
        }

        // Validate token
        $inviteData = InviteTokenService::validate($token);
        if (!$inviteData || $inviteData['email'] !== $email) {
            return back()->with('error', 'Invite token tidak valid atau sudah expired.');
        }

        $user = \App\Models\User::where('email', $email)->first();
        if (!$user) {
            return back()->with('error', 'Akun user tidak ditemukan.');
        }

        // Update password
        $user->update(['password' => bcrypt($password)]);

        // Consume token
        InviteTokenService::consume($token);

        // Auto-login
        auth()->login($user);

        return redirect('/dashboard')->with('success', "Selamat datang {$user->name}! Akun Anda telah diaktifkan.");
    }
}
