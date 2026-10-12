<?php

namespace App\Providers;

use App\Support\PostgresSequenceHealer;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

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
    }
}
