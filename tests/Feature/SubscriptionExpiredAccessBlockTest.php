<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Tests\TestCase;

class SubscriptionExpiredAccessBlockTest extends TestCase
{
    public function test_owner_with_expired_trial_cannot_access_dashboard()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        // Create plan
        $plan = Plan::firstOrCreate(['slug' => 'test-plan'], [
            'name' => 'Test Plan',
            'monthly_price' => 99000,
            'is_active' => true,
        ]);

        // Create tenant
        $tenant = Tenant::create(['name' => 'Test Expired Tenant', 'status' => 'active']);

        // Create owner
        $owner = User::create([
            'name' => 'Owner Test',
            'email' => 'owner.expired@test.com',
            'password' => bcrypt('password'),
            'tenant_id' => $tenant->id,
        ]);
        $owner->assignRole('OWNER');

        // Create expired subscription
        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'expired',
            'billing_cycle' => 'monthly',
            'starts_at' => now()->subDays(14),
            'expires_at' => now()->subDays(7),
            'trial_ends_at' => now()->subDays(7),
        ]);

        // Update tenant to past_due
        $tenant->update(['status' => 'past_due']);

        // Test: Subscription is expired
        $this->assertEquals('expired', $subscription->fresh()->status);
        $this->assertEquals('past_due', $tenant->fresh()->status);

        // Test: Owner cannot access dashboard
        $response = $this->actingAs($owner)->get('/dashboard');

        // Expected: redirect to subscription expired page with error
        $response->assertRedirect('/subscription/expired');
        $response->assertSessionHas('error');
    }

    public function test_owner_with_expired_subscription_can_access_subscription_page()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $plan = Plan::firstOrCreate(['slug' => 'test-plan'], [
            'name' => 'Test Plan',
            'monthly_price' => 99000,
            'is_active' => true,
        ]);

        $tenant = Tenant::create(['name' => 'Test Expired Tenant 2', 'status' => 'past_due']);

        $owner = User::create([
            'name' => 'Owner Test 2',
            'email' => 'owner.expired2@test.com',
            'password' => bcrypt('password'),
            'tenant_id' => $tenant->id,
        ]);
        $owner->assignRole('OWNER');

        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'expired',
            'billing_cycle' => 'monthly',
            'starts_at' => now()->subDays(14),
            'expires_at' => now()->subDays(7),
            'trial_ends_at' => now()->subDays(7),
        ]);

        // Test: Owner CAN access subscription page
        $response = $this->actingAs($owner)->get('/subscription');
        $response->assertOk();
    }
}
