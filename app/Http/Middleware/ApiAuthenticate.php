<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;

class ApiAuthenticate
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Missing API token',
                'data' => null,
            ], 401);
        }

        // Simple token validation: base64-encoded "user_id:timestamp:hash"
        // In production, use Laravel Sanctum or JWT
        try {
            $decoded = base64_decode($token, true);
            if (!$decoded) {
                throw new \Exception('Invalid token format');
            }

            [$userId, $timestamp, $hash] = explode(':', $decoded, 3);
            
            // Check token expiry (24 hours)
            if (time() - $timestamp > 86400) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Token expired',
                    'data' => null,
                ], 401);
            }

            // Verify token hash
            $expectedHash = hash_hmac('sha256', "{$userId}:{$timestamp}", config('app.key'));
            if (!hash_equals($hash, $expectedHash)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid token signature',
                    'data' => null,
                ], 401);
            }

            $user = User::find($userId);
            if (!$user || !$user->is_active) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found or inactive',
                    'data' => null,
                ], 401);
            }

            $request->setUserResolver(fn () => $user);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Token validation failed: ' . $e->getMessage(),
                'data' => null,
            ], 401);
        }

        return $next($request);
    }
}
