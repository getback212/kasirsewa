<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'outlet_id',
        'product_id',
        'type',
        'quantity',
        'before_stock',
        'after_stock',
        'reference_type',
        'reference_id',
        'user_id',
        'note',
        'created_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'before_stock' => 'decimal:2',
        'after_stock' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
