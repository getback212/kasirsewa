<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\QRISNotificationController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\InventoryController;
use App\Http\Controllers\API\SalesController;

/*
|--------------------------------------------------------------------------
| API Routes for RetailPRO POS Engine
|--------------------------------------------------------------------------
*/

// Public API routes (QRIS webhooks)
Route::post('/qris/callback', [QRISNotificationController::class, 'handleWebhook'])
    ->middleware('throttle:30,1');
Route::post('/qris/push-notification', [QRISNotificationController::class, 'handleAndroidPush'])
    ->middleware('throttle:30,1');

// API v1 routes
Route::prefix('v1')->group(function () {
    // Public auth endpoint
    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');

    // Protected API endpoints (require API token)
    Route::middleware('api.authenticate')->group(function () {
        // Auth
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Products
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{id}', [ProductController::class, 'show']);
        Route::get('/products/search', [ProductController::class, 'search']);

        // Inventory
        Route::get('/inventory/stock-levels', [InventoryController::class, 'stockLevels']);
        Route::get('/inventory/products/{id}/history', [InventoryController::class, 'stockHistory']);

        // Sales
        Route::get('/sales', [SalesController::class, 'index']);
        Route::get('/sales/{id}', [SalesController::class, 'show']);
        Route::get('/sales/summary', [SalesController::class, 'summary']);
    });
});
