<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)
            ->where('is_active', true)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kredensial tidak valid.',
                'data' => null,
            ], 401);
        }

        // Generate token: base64("user_id:timestamp:hash")
        $timestamp = time();
        $hash = hash_hmac('sha256', "{$user->id}:{$timestamp}", config('app.key'));
        $token = base64_encode("{$user->id}:{$timestamp}:{$hash}");

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->roles->first()?->name ?? 'CASHIER',
                ],
                'token' => $token,
                'expires_in' => 86400, // 24 hours in seconds
            ],
        ], 200);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'message' => 'Data pengguna berhasil diambil.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name ?? 'CASHIER',
                'company_id' => $user->company_id,
                'tenant_id' => $user->tenant_id,
                'outlet_id' => $user->outlet_id,
            ],
        ], 200);
    }
}
