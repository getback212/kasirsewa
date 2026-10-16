<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

class Customer extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'tenant_id',
        'code',
        'name',
        'phone',
        'email',
        'address',
        'credit_balance',
        'credit_limit',
        'debt_balance',
    ];

    protected $casts = [
        'credit_balance' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'debt_balance' => 'decimal:2',
    ];
}
