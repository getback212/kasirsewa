<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\SaaSPayment;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentProofController extends Controller
{
    /**
     * Owner uploads payment proof (bank transfer screenshot)
     */
    public function upload(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'payment_proof' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120', // max 5MB
            'sender_bank' => 'nullable|string|max:100',
            'sender_name' => 'nullable|string|max:255',
        ]);

        $invoice = Invoice::findOrFail($validated['invoice_id']);
        $user = $request->user();

        // Verify owner can only upload proof for their own invoice
        if ((int) $invoice->tenant_id !== (int) $user->tenant_id) {
            abort(403, 'Anda tidak berhak mengupload bukti untuk invoice ini.');
        }

        // Check if payment already exists for this invoice
        $payment = SaaSPayment::where('invoice_id', $invoice->id)->first();
        if (!$payment) {
            // Create payment record if not exists
            $payment = SaaSPayment::create([
                'tenant_id' => $invoice->tenant_id,
                'invoice_id' => $invoice->id,
                'payment_number' => 'PAY/'.now()->format('Ymd').'/'.str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT),
                'payment_method' => 'manual_transfer',
                'status' => 'pending',
                'amount' => $invoice->total,
            ]);
        }

        // Store file
        $file = $validated['payment_proof'];
        $path = $file->store('payment_proofs', 'public');

        // Update payment with proof
        // Clear rejection reason if owner re-uploads (reset to pending verification)
        $payment->update([
            'payment_proof' => $path,
            'status' => 'pending', // Tunggu Super Admin verifikasi
            'proof_rejection_reason' => null, // Clear previous rejection
            'proof_verified_at' => null, // Clear previous verification
            'payload' => json_encode([
                'sender_bank' => $validated['sender_bank'] ?? null,
                'sender_name' => $validated['sender_name'] ?? null,
            ]),
        ]);

        AuditLogService::log(
            action: 'PAYMENT_PROOF_UPLOADED',
            modelType: 'SaaSPayment',
            modelId: $payment->id,
            newValues: ['invoice' => $invoice->invoice_number, 'proof_file' => $path]
        );

        return back()->with('success', '✅ Bukti transfer berhasil diunggah. Menunggu verifikasi dari admin...');
    }

    /**
     * Super Admin verifies & approves payment proof
     */
    public function verify(Request $request, SaaSPayment $payment): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang dapat memverifikasi bukti pembayaran.');
        }

        if (!$payment->payment_proof) {
            return back()->with('error', '❌ Tidak ada bukti pembayaran untuk diverifikasi.');
        }

        // Mark as verified
        $payment->update([
            'status' => 'completed',
            'proof_verified_at' => now(),
            'proof_rejection_reason' => null,
        ]);

        // Mark invoice as paid
        $invoice = $payment->invoice;
        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        AuditLogService::log(
            action: 'PAYMENT_PROOF_VERIFIED',
            modelType: 'SaaSPayment',
            modelId: $payment->id,
            newValues: ['invoice' => $invoice->invoice_number, 'status' => 'completed']
        );

        return back()->with('success', '✅ Bukti pembayaran diverifikasi. Invoice ditandai sebagai lunas.');
    }

    /**
     * Super Admin rejects payment proof
     */
    public function reject(Request $request, SaaSPayment $payment): RedirectResponse
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $user = $request->user();

        if (!$user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang dapat menolak bukti pembayaran.');
        }

        if (!$payment->payment_proof) {
            return back()->with('error', '❌ Tidak ada bukti pembayaran untuk ditolak.');
        }

        // Mark as rejected
        $payment->update([
            'status' => 'pending',
            'proof_rejection_reason' => $validated['rejection_reason'],
            'proof_verified_at' => null,
        ]);

        AuditLogService::log(
            action: 'PAYMENT_PROOF_REJECTED',
            modelType: 'SaaSPayment',
            modelId: $payment->id,
            newValues: ['reason' => $validated['rejection_reason']]
        );

        return back()->with('warning', '⚠️ Bukti pembayaran ditolak. Owner harus mengunggah ulang bukti yang valid.');
    }
}
