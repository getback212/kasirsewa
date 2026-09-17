<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
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
    ];
}
