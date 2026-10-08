<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\QRISNotificationController;

/*
|--------------------------------------------------------------------------
| API Routes for RetailPRO POS Engine
|--------------------------------------------------------------------------
*/

Route::post('/qris/callback', [QRISNotificationController::class, 'handleWebhook'])
    ->middleware('throttle:30,1');
Route::post('/qris/push-notification', [QRISNotificationController::class, 'handleAndroidPush'])
    ->middleware('throttle:30,1');
