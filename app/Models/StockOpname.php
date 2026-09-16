<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockOpname extends Model
{
    use HasFactory;

    protected $fillable = [
        'outlet_id',
        'user_id',
        'opname_number',
        'opname_date',
        'status',
        'note',
    ];

    protected $casts = [
        'opname_date' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
