<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Subscription;
use Tests\TestCase;

class TenantRegistrationTrialTest extends TestCase
{
    public function test_prospective_tenant_can_register_and_starts_7_day_free_trial_for_starter_plan()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $plan = Plan::firstOrCreate(
            ['slug' => 'starter-basic'],
            ['name' => 'Starter Basic', 'monthly_price' => 99000, 'yearly_price' => 990000, 'max_stores' => 1, 'max_users' => 3, 'max_products' => 500, 'is_active' => true]
        );

        $storeName = 'Toko Trial Audit ' . rand(1000, 9999);
        $email = 'owner.trial' . rand(1000, 9999) . '@example.com';

        $response = $this->post('/register', [
            'store_name' => $storeName,
            'owner_name' => 'Bunda Siti Owner',
            'email' => $email,
            'phone' => '0812' . rand(10000000, 99999999),
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
        ]);

        $response->assertRedirect('/dashboard');

        // 1. Verify tenant was created
        $tenant = Tenant::where('name', $storeName)->first();
        $this->assertNotNull($tenant);

        // 2. Verify owner was created and assigned OWNER role
        $owner = User::where('email', $email)->first();
        $this->assertNotNull($owner);
        $this->assertEquals($tenant->id, $owner->tenant_id);

        // 3. Verify subscription is status 'trial' with 7-day duration
        $subscription = Subscription::where('tenant_id', $tenant->id)->first();
        $this->assertNotNull($subscription);
        $this->assertEquals('trial', $subscription->status);
        $this->assertEquals($plan->id, $subscription->plan_id);

        // 4. Verify user is automatically logged in
        $this->assertAuthenticatedAs($owner);
    }
}
