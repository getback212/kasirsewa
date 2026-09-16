<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class QRISNotificationController extends Controller
{
    /**
     * Webhook Callback dari Payment Gateway / Bank QRIS Service
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('QRIS Webhook Received:', $payload);

        $invoiceNumber = $payload['invoice_number'] ?? $payload['order_id'] ?? null;
        $transactionStatus = strtolower($payload['transaction_status'] ?? $payload['status'] ?? '');
        $amount = (float) ($payload['gross_amount'] ?? $payload['amount'] ?? 0);

        if (!$invoiceNumber) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invoice number tidak ditemukan dalam payload.',
            ], 400);
        }

        $sale = Sale::where('invoice_number', $invoiceNumber)->first();

        if (!$sale) {
            return response()->json([
                'status' => 'error',
                'message' => "Transaksi invoice {$invoiceNumber} tidak ditemukan.",
            ], 444);
        }

        if (in_array($transactionStatus, ['settlement', 'success', 'paid', 'completed'])) {
            $sale->update([
                'payment_status' => 'paid',
                'transaction_status' => 'completed',
            ]);

            Payment::where('sale_id', $sale->id)->update([
                'status' => 'completed',
            ]);

            Log::info("QRIS Payment SUCCESS for Invoice #{$invoiceNumber}");

            return response()->json([
                'status' => 'success',
                'message' => "Notifikasi pembayaran QRIS Invoice #{$invoiceNumber} berhasil dikonfirmasi!",
                'sale_id' => $sale->id,
                'invoice_number' => $sale->invoice_number,
                'grand_total' => (float) $sale->grand_total,
            ]);
        }

        return response()->json([
            'status' => 'ignored',
            'message' => "Status transaksi '{$transactionStatus}' belum diproses.",
        ]);
    }

    /**
     * Push Notifikasi dari Aplikasi Android Notification Listener HP Kasir
     */
    public function handleAndroidPush(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notification_title' => ['required', 'string'],
            'notification_body' => ['required', 'string'],
            'amount' => ['nullable', 'numeric'],
            'sender' => ['nullable', 'string'],
            'token_key' => ['nullable', 'string'],
        ]);

        Log::info('Android QRIS Listener Push:', $validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Notifikasi masuk dari Listener Android berhasil dicatat & diproses POS Server!',
            'received' => [
                'title' => $validated['notification_title'],
                'body' => $validated['notification_body'],
                'amount' => $validated['amount'] ?? 0,
                'time' => now()->toIso8601String(),
            ]
        ]);
    }
}
