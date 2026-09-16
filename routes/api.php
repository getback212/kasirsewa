<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\QRISNotificationController;

/*
|--------------------------------------------------------------------------
| API Routes for RetailPRO POS Engine
|--------------------------------------------------------------------------
*/

Route::post('/qris/callback', [QRISNotificationController::class, 'handleWebhook']);
Route::post('/qris/push-notification', [QRISNotificationController::class, 'handleAndroidPush']);
