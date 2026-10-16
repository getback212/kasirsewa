<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaaSPayment extends Model
{
    use HasFactory;

    protected $table = 'saas_payments';

    protected $fillable = [
        'tenant_id',
        'invoice_id',
        'payment_number',
        'payment_method',
        'gateway_name',
        'gateway_transaction_id',
        'amount',
        'status',
        'paid_at',
        'payload',
        'payment_proof',
        'proof_verified_at',
        'proof_rejection_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'proof_verified_at' => 'datetime',
        'payload' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
