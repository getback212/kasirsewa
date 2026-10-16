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
        $payments = SaaSPayment::with([
            'invoice.tenant.owner',
        ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'invoice_id' => $payment->invoice_id,
                    'payment_number' => $payment->payment_number,
                    'amount' => $payment->amount,
                    'status' => $payment->status,
                    'payment_proof' => $payment->payment_proof,
                    'proof_verified_at' => $payment->proof_verified_at,
                    'proof_rejection_reason' => $payment->proof_rejection_reason,
                    'created_at' => $payment->created_at,
                    'invoice' => $payment->invoice ? [
                        'invoice_number' => $payment->invoice->invoice_number,
                        'total' => $payment->invoice->total,
                        'due_at' => $payment->invoice->due_at,
                        'tenant' => $payment->invoice->tenant ? [
                            'name' => $payment->invoice->tenant->name,
                            'owner' => $payment->invoice->tenant->owner ? [
                                'name' => $payment->invoice->tenant->owner->name,
                                'email' => $payment->invoice->tenant->owner->email,
                                'phone' => $payment->invoice->tenant->owner->phone,
                            ] : null,
                        ] : null,
                    ] : null,
                ];
            });

        return inertia('Admin/PaymentProofsIndex', [
            'payments' => $payments,
            'filters' => request()->only('status'),
        ]);
    }
}
