<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        return [
            'name' => 'Paket ' . $this->faker->unique()->word(),
            'slug' => $this->faker->unique()->slug(),
            'description' => $this->faker->sentence(),
            'monthly_price' => 99000,
            'yearly_price' => 990000,
            'max_stores' => 1,
            'max_users' => 3,
            'max_products' => 500,
            'max_transactions' => 1000,
            'is_active' => true,
        ];
    }
}
