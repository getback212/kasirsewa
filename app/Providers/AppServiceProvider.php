<?php

namespace App\Providers;

use App\Support\PostgresSequenceHealer;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
            URL::forceScheme('https');
        } elseif (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // Auto-heal PostgreSQL sequences if sequence primary keys drift.
        //
        // Walked every table (~75 queries + writes) on every request before;
        // see PostgresSequenceHealer for why that had to move to the console.
        if ($this->app->runningInConsole()) {
            PostgresSequenceHealer::heal();
        }

        // Define named rate limiters
        $this->configureRateLimiters();
    }

    private function configureRateLimiters(): void
    {
        // In test environment, define no-op rate limiters
        if ($this->app->environment('testing')) {
            RateLimiter::for('login', fn (Request $request) => RateLimiter::unlimited());
            RateLimiter::for('superadmin-login', fn (Request $request) => RateLimiter::unlimited());
            RateLimiter::for('password-recovery', fn (Request $request) => RateLimiter::unlimited());
            RateLimiter::for('email-verification', fn (Request $request) => RateLimiter::unlimited());
            RateLimiter::for('api-login', fn (Request $request) => RateLimiter::unlimited());
            RateLimiter::for('api', fn (Request $request) => RateLimiter::unlimited());
            RateLimiter::for('api-webhooks', fn (Request $request) => RateLimiter::unlimited());
            RateLimiter::for('pos-checkout', fn (Request $request) => RateLimiter::unlimited());
            RateLimiter::for('product-search', fn (Request $request) => RateLimiter::unlimited());
            RateLimiter::for('reports', fn (Request $request) => RateLimiter::unlimited());
            RateLimiter::for('otp-request', fn (Request $request) => RateLimiter::unlimited());
            RateLimiter::for('employee-invite', fn (Request $request) => RateLimiter::unlimited());
            return;
        }

        // Login attempts: 5 per minute per IP
        RateLimiter::for('login', function (Request $request) {
            return RateLimiter::limit(5)->perMinute()->by($request->ip());
        });

        // Super admin login: 3 per minute (stricter)
        RateLimiter::for('superadmin-login', function (Request $request) {
            return RateLimiter::limit(3)->perMinute()->by($request->ip());
        });

        // Password recovery: 3 per hour per email
        RateLimiter::for('password-recovery', function (Request $request) {
            return RateLimiter::limit(3)->perHour()->by(
                $request->input('email', '') . '|' . $request->ip()
            );
        });

        // Email verification: 3 per hour per email
        RateLimiter::for('email-verification', function (Request $request) {
            return RateLimiter::limit(3)->perHour()->by(
                $request->user()?->email . '|' . $request->ip()
            );
        });

        // API authentication: 5 per minute per IP
        RateLimiter::for('api-login', function (Request $request) {
            return RateLimiter::limit(5)->perMinute()->by($request->ip());
        });

        // API general endpoints: 60 per minute per user
        RateLimiter::for('api', function (Request $request) {
            return RateLimiter::limit(60)->perMinute()->by($request->user()?->id ?? $request->ip());
        });

        // API webhooks: 30 per minute per IP (QRIS, payment gateways)
        RateLimiter::for('api-webhooks', function (Request $request) {
            return RateLimiter::limit(30)->perMinute()->by($request->ip());
        });

        // POS checkout: 10 per minute per user (prevent rapid transactions)
        RateLimiter::for('pos-checkout', function (Request $request) {
            return RateLimiter::limit(10)->perMinute()->by($request->user()?->id ?? $request->ip());
        });

        // Product search: 30 per minute per user (expensive queries)
        RateLimiter::for('product-search', function (Request $request) {
            return RateLimiter::limit(30)->perMinute()->by($request->user()?->id ?? $request->ip());
        });

        // Report generation: 5 per hour per user (expensive)
        RateLimiter::for('reports', function (Request $request) {
            return RateLimiter::limit(5)->perHour()->by($request->user()?->id ?? $request->ip());
        });

        // OTP/SMS requests: 3 per 10 minutes per phone
        RateLimiter::for('otp-request', function (Request $request) {
            return RateLimiter::limit(3)->perTenMinutes()->by(
                $request->input('phone', '') . '|' . $request->ip()
            );
        });

        // Employee invitation: 10 per day per user
        RateLimiter::for('employee-invite', function (Request $request) {
            return RateLimiter::limit(10)->perDay()->by($request->user()?->id ?? $request->ip());
        });
    }
}
