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
        'debt_balance',
    ];

    protected $casts = [
        'debt_balance' => 'decimal:2',
    ];
}
