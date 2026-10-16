<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait BelongsToOutlet
{
    protected static function bootBelongsToOutlet(): void
    {
        static::creating(function (Model $model) {
            if (empty($model->outlet_id) && Auth::check() && Auth::user()->outlet_id) {
                $model->outlet_id = Auth::user()->outlet_id;
            }
        });

        static::addGlobalScope('outlet_scope', function (Builder $builder) {
            if (Auth::check()) {
                $user = Auth::user();
                // Super Admin & Owner can access all outlets if selected session outlet is set, otherwise default to user's assigned outlet
                if ($user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
                    $selectedOutletId = session('active_outlet_id', $user->outlet_id);
                    if ($selectedOutletId) {
                        $builder->where($builder->getModel()->getTable().'.outlet_id', $selectedOutletId);
                    }
                } else {
                    $builder->where($builder->getModel()->getTable().'.outlet_id', $user->outlet_id);
                }
            }
        });
    }
}
