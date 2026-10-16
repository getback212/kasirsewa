<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SaaSPayment;
use Inertia\Response;

class AdminPaymentProofController extends Controller
{
    /**
     * Show payment proofs pending verification for Super Admin
     */
    public function index(): Response
    {
        try {
            // Check authorization
            $user = auth()->user();
            if (!$user || !$user->hasRole('SUPER_ADMIN')) {
                abort(403, 'Only Super Admin can access payment proof verification.');
            }

            // Fetch payments with eager loading to avoid N+1 queries
            $payments = SaaSPayment::query()
                ->with('invoice.tenant.owner')
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform to array safely
            $paymentsArray = $payments->map(function ($payment) {
                $invoice = $payment->invoice;
                $tenant = $invoice?->tenant;
                $owner = $tenant?->owner;

                return [
                    'id' => $payment->id,
                    'invoice_id' => $payment->invoice_id,
                    'payment_number' => $payment->payment_number,
                    'amount' => (string)$payment->amount, // Cast to string for safe JSON
                    'status' => $payment->status,
                    'payment_proof' => $payment->payment_proof,
                    'proof_verified_at' => $payment->proof_verified_at?->toIso8601String(),
                    'proof_rejection_reason' => $payment->proof_rejection_reason,
                    'created_at' => $payment->created_at?->toIso8601String(),
                    'invoice' => $invoice ? [
                        'invoice_number' => $invoice->invoice_number,
                        'total' => (string)$invoice->total,
                        'due_at' => $invoice->due_at?->toIso8601String(),
                        'tenant' => $tenant ? [
                            'name' => $tenant->name,
                            'owner' => $owner ? [
                                'name' => $owner->name,
                                'email' => $owner->email,
                                'phone' => $owner->phone,
                            ] : null,
                        ] : null,
                    ] : null,
                ];
            })->toArray();

            return inertia('Admin/PaymentProofsIndex', [
                'payments' => $paymentsArray,
                'filters' => request()->only('status'),
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
