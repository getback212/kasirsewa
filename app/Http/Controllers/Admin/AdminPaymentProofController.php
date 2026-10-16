<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SaaSPayment;
use Inertia\Response;

class AdminPaymentProofController extends Controller
{
    /**
     * Show payment proofs dashboard for Super Admin
     * Displays all payments with their verification status
     */
    public function index(): Response
    {
        try {
            // Check authorization
            $user = auth()->user();
            if (!$user || !$user->hasRole('SUPER_ADMIN')) {
                abort(403, 'Only Super Admin can access payment proof verification.');
            }

            // Fetch all payments with eager loading
            $payments = SaaSPayment::query()
                ->with('invoice.tenant.owner')
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform to array with status
            $paymentsArray = $payments->map(function ($payment) {
                $invoice = $payment->invoice;
                $tenant = $invoice?->tenant;
                $owner = $tenant?->owner;

                // Determine verification status
                if ($payment->proof_verified_at) {
                    $status = 'approved';
                } elseif ($payment->proof_rejection_reason) {
                    $status = 'rejected';
                } elseif ($payment->payment_proof) {
                    $status = 'pending_verification';
                } else {
                    $status = 'pending_upload';
                }

                return [
                    'id' => $payment->id,
                    'invoice_id' => $payment->invoice_id,
                    'payment_number' => $payment->payment_number,
                    'amount' => (string)$payment->amount,
                    'status' => $payment->status,
                    'verification_status' => $status, // pending_upload, pending_verification, approved, rejected
                    'payment_proof' => $payment->payment_proof,
                    'proof_verified_at' => $payment->proof_verified_at?->toIso8601String(),
                    'proof_rejection_reason' => $payment->proof_rejection_reason,
                    'created_at' => $payment->created_at?->toIso8601String(),
                    'invoice' => $invoice ? [
                        'invoice_number' => $invoice->invoice_number,
                        'total' => (string)$invoice->total,
                        'due_at' => $invoice->due_at?->toIso8601String(),
                        'tenant' => $tenant ? [
                            'id' => $tenant->id,
                            'name' => $tenant->name,
                            'owner' => $owner ? [
                                'id' => $owner->id,
                                'name' => $owner->name,
                                'email' => $owner->email,
                                'phone' => $owner->phone,
                            ] : null,
                        ] : null,
                    ] : null,
                ];
            })->toArray();

            // Count by status for dashboard summary
            $summary = [
                'total' => count($paymentsArray),
                'pending_upload' => count(array_filter($paymentsArray, fn($p) => $p['verification_status'] === 'pending_upload')),
                'pending_verification' => count(array_filter($paymentsArray, fn($p) => $p['verification_status'] === 'pending_verification')),
                'approved' => count(array_filter($paymentsArray, fn($p) => $p['verification_status'] === 'approved')),
                'rejected' => count(array_filter($paymentsArray, fn($p) => $p['verification_status'] === 'rejected')),
            ];

            return inertia('Admin/PaymentProofsIndex', [
                'payments' => $paymentsArray,
                'summary' => $summary,
                'filters' => request()->only('verification_status'),
            ]);
        } catch (\Throwable $e) {
            \Log::error('AdminPaymentProofController.index error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            abort(500, 'Internal server error. Please try again later.');
        }
    }
}
