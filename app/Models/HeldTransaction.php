<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HeldTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'outlet_id',
        'cashier_id',
        'customer_id',
        'reference_note',
        'grand_total',
        'expired_at',
    ];

    protected $casts = [
        'grand_total' => 'decimal:2',
        'expired_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(HeldTransactionItem::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
