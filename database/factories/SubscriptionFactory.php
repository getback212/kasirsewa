<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    protected $model = Subscription::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'plan_id' => Plan::factory(),
            'status' => 'trial',
            'billing_cycle' => 'monthly',
            'starts_at' => now(),
            'expires_at' => now()->addDays(7),
            'trial_ends_at' => now()->addDays(7),
            'auto_renew' => false,
        ];
    }
}
