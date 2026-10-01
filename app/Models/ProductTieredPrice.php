<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductTieredPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'min_qty',
        'price',
    ];

    protected $casts = [
        'min_qty' => 'integer',
        'price' => 'float',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
