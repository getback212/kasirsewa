<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Payment;
use App\Exceptions\QRISPaymentException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Exception;

class QRISNotificationController extends Controller
{
    private function hasValidSignature(Request $request): bool
    {
        $secret = config('services.qris.webhook_secret');
        $signature = $request->header('X-QRIS-Signature', $request->header('X-Signature', ''));

        if (!is_string($secret) || $secret === '' || !is_string($signature) || $signature === '') {
            return false;
        }

        $signature = preg_replace('/^sha256=/i', '', trim($signature));
        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        return is_string($signature) && hash_equals($expected, $signature);
    }

    public function handleWebhook(Request $request): JsonResponse
    {
        try {
            // Require webhook secret to be configured
            $secret = config('services.qris.webhook_secret');
            if (!$secret || $secret === '') {
                Log::error('QRIS webhook_secret not configured in .env');
                throw new QRISPaymentException(
                    'Configuration Error',
                    'QRIS webhook secret tidak dikonfigurasi. Hubungi administrator.'
                );
            }

            // Verify webhook signature
            if (!$this->hasValidSignature($request)) {
                Log::warning('QRIS webhook rejected: invalid signature.', [
                    'client_ip' => $request->ip(),
                    'signature_header' => $request->header('X-QRIS-Signature', $request->header('X-Signature', '')),
                ]);
                throw new QRISPaymentException(
                    'Invalid Signature',
                    'Webhook signature verification failed — potential fraud attempt.'
                );
            }

            $payload = $request->all();
            
            $invoiceNumber = $payload['invoice_number'] ?? $payload['order_id'] ?? null;
            $transactionStatus = strtolower($payload['transaction_status'] ?? $payload['status'] ?? '');
            $amount = (float) ($payload['gross_amount'] ?? $payload['amount'] ?? 0);

            Log::info("QRIS Webhook Received for Invoice: {$invoiceNumber}, Status: {$transactionStatus}, Amount: {$amount}");

            if (!$invoiceNumber) {
                throw new QRISPaymentException(
                    'Invalid Payload',
                    'Invoice number tidak ditemukan dalam webhook payload.'
                );
            }

            $sale = Sale::where('invoice_number', $invoiceNumber)->first();

            if (!$sale) {
                throw new QRISPaymentException(
                    'Invoice Not Found',
                    "Transaksi invoice {$invoiceNumber} tidak ditemukan di database."
                );
            }

            if (in_array($transactionStatus, ['settlement', 'success', 'paid', 'completed'])) {
                // Validasi nominal agar sesuai dengan grand total transaksi
                if ($amount > 0 && abs((float)$sale->grand_total - $amount) > 0.01) {
                    Log::warning("QRIS Payment amount mismatch for Invoice #{$invoiceNumber}. Expected {$sale->grand_total}, got {$amount}");
                    throw new QRISPaymentException(
                        'Amount Mismatch',
                        "Nominal pembayaran Rp {$amount} tidak sesuai dengan total tagihan Rp {$sale->grand_total}."
                    );
                }

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

        } catch (QRISPaymentException $e) {
            Log::warning('QRIS payment validation failed: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getUserMessage(),
            ], 400);
        } catch (Exception $e) {
            Log::error('QRIS webhook unexpected error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memproses webhook. Hubungi support jika masalah berlanjut.',
            ], 500);
        }
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

        Log::info('Android QRIS Listener Push received', [
            'title' => $validated['notification_title'],
            'amount' => $validated['amount'] ?? 0,
        ]);

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
