<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use BelongsToTenant, HasFactory;

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
