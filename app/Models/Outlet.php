<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Outlet extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'phone',
        'address',
        'tax_percentage',
        'enable_ppn',
        'qris_payload',
        'qris_image_url',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'enable_ppn' => 'boolean',
        'tax_percentage' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
