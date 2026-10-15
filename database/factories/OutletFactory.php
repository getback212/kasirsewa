<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Outlet;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Outlet>
 */
class OutletFactory extends Factory
{
    protected $model = Outlet::class;

    public function definition(): array
    {
        $tenant = Tenant::factory()->create();
        $company = Company::factory()->create();

        return [
            'tenant_id' => $tenant->id,
            'company_id' => $company->id,
            'name' => $this->faker->company(),
            'code' => strtoupper($this->faker->bothify('OUT-###')),
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'is_active' => true,
        ];
    }
}
