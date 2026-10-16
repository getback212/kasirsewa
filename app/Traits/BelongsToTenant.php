<?php

namespace App\Traits;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::creating(function (Model $model) {
            if (! $model->tenant_id && session()->has('active_tenant_id')) {
                $model->tenant_id = session('active_tenant_id');
            }
        });

        static::addGlobalScope('tenant_isolation', function (Builder $builder) {
            if (session()->has('active_tenant_id')) {
                $builder->where($builder->getModel()->getTable().'.tenant_id', session('active_tenant_id'));
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
