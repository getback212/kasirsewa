<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
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
