<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'tenant_id',
        'name',
        'short_name',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
