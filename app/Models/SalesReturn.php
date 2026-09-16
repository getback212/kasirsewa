<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'outlet_id',
        'sale_id',
        'cashier_id',
        'return_number',
        'subtotal',
        'refund_amount',
        'reason',
        'status',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'refund_amount' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(SalesReturnItem::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }
}
