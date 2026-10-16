<?php

use App\Exceptions\KasirSewaException;
use App\Http\Middleware\ApiAuthenticate;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeadersMiddleware;
use App\Http\Middleware\SubscriptionAccessMiddleware;
use App\Http\Middleware\TenantContextMiddleware;
use App\Http\Middleware\TenantDomainResolver;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: ['172.18.0.0/16']);

        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Register middleware aliases
        $middleware->alias([
            'subscription' => SubscriptionAccessMiddleware::class,
            'api.authenticate' => ApiAuthenticate::class,
        ]);

        $middleware->web(append: [
            SecurityHeadersMiddleware::class,
            TenantDomainResolver::class,
            TenantContextMiddleware::class,
            SubscriptionAccessMiddleware::class,
            HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Handle KasirSewaException: render user-friendly message, log internal details
        $exceptions->render(function (KasirSewaException $e, Request $request) {
            Log::error('KasirSewaException: '.$e->getMessage());

            if ($request->expectsJson()) {
                return $e->render();
            }

            return back()->withError($e->getUserMessage())->withInput();
        });

        // Handle InvalidArgumentException: generic validation errors
        $exceptions->render(function (InvalidArgumentException $e, Request $request) {
            Log::warning('InvalidArgumentException: '.$e->getMessage());

            if ($request->expectsJson()) {
                return response()->json(['message' => $e->getMessage(), 'error' => true], 400);
            }

            return back()->withError($e->getMessage())->withInput();
        });

        // Handle PDOException: database errors (generic message to user)
        $exceptions->render(function (PDOException $e, Request $request) {
            Log::error('Database error: '.$e->getMessage());

            if ($request->expectsJson()) {
                return response()->json(['message' => 'Database error. Please contact support.', 'error' => true], 500);
            }

            return back()->withError('Terjadi kesalahan database. Hubungi admin jika masalah berlanjut.')->withInput();
        });

        // Handle QueryException: Eloquent errors
        $exceptions->render(function (QueryException $e, Request $request) {
            Log::error('Query exception: '.$e->getMessage());

            if ($request->expectsJson()) {
                return response()->json(['message' => 'Database error. Please contact support.', 'error' => true], 500);
            }

            return back()->withError('Terjadi kesalahan database. Hubungi admin jika masalah berlanjut.')->withInput();
        });

        // Handle ModelNotFoundException: resource not found
        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            Log::warning('Model not found: '.$e->getMessage());

            if ($request->expectsJson()) {
                return response()->json(['message' => 'Resource not found.', 'error' => true], 404);
            }

            return back()->withError('Data tidak ditemukan.')->withInput();
        });
    })->create();
