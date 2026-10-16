<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\QRISNotificationController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\InventoryController;
use App\Http\Controllers\API\SalesController;
use App\Http\Controllers\POS\BarcodeController;

/*
|--------------------------------------------------------------------------
| API Routes for RetailPRO POS Engine
|--------------------------------------------------------------------------
*/

// Public API routes (QRIS webhooks)
Route::post('/qris/callback', [QRISNotificationController::class, 'handleWebhook'])
    ->middleware('throttle:api-webhooks');
Route::post('/qris/push-notification', [QRISNotificationController::class, 'handleAndroidPush'])
    ->middleware('throttle:api-webhooks');

// API v1 routes
Route::prefix('v1')->group(function () {
    // Public auth endpoint
    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:api-login');

    // Protected API endpoints (require API token)
    Route::middleware('api.authenticate')->group(function () {
        // Auth
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Barcode scanning
        Route::post('/barcode/lookup', [BarcodeController::class, 'lookup'])->middleware('throttle:api');
        Route::post('/barcode/validate', [BarcodeController::class, 'validate'])->middleware('throttle:api');

        // Products
        Route::get('/products', [ProductController::class, 'index'])->middleware('throttle:api');
        Route::get('/products/{id}', [ProductController::class, 'show'])->middleware('throttle:api');
        Route::get('/products/search', [ProductController::class, 'search'])->middleware('throttle:product-search');

        // Inventory
        Route::get('/inventory/stock-levels', [InventoryController::class, 'stockLevels'])->middleware('throttle:api');
        Route::get('/inventory/products/{id}/history', [InventoryController::class, 'stockHistory'])->middleware('throttle:api');

        // Sales
        Route::get('/sales', [SalesController::class, 'index'])->middleware('throttle:api');
        Route::get('/sales/{id}', [SalesController::class, 'show'])->middleware('throttle:api');
        Route::get('/sales/summary', [SalesController::class, 'summary'])->middleware('throttle:reports');
    });
});
