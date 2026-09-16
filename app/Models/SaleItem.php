<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'product_id',
        'product_name_snapshot',
        'sku_snapshot',
        'price_snapshot',
        'cost_price_snapshot',
        'quantity',
        'discount_amount',
        'subtotal',
    ];

    protected $casts = [
        'price_snapshot' => 'decimal:2',
        'cost_price_snapshot' => 'decimal:2',
        'quantity' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
