<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Subscription;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class GoogleAuthTenantRegistrationTest extends TestCase
{
    /**
     * ✅ NEW: Unregistered users via Google are rejected & redirected to /register
     * (Security fix: prevents auto-creation of tenant for unauthorized emails)
     */
    public function test_unregistered_user_via_google_redirects_to_register()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
        $abstractUser->shouldReceive('getId')->andReturn('112233445566778899');
        $abstractUser->shouldReceive('getName')->andReturn('Bunda Siti Google');
        $abstractUser->shouldReceive('getEmail')->andReturn('sitigoogle@example.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/default-avatar');
        $abstractUser->shouldReceive('getNickname')->andReturn('sitigoogle');

        $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/auth/google/callback');
        
        // ✅ FIXED: Redirect to /register, not /dashboard
        $response->assertRedirect('/register');
        $response->assertSessionHas('info', '📧 Email Anda belum terdaftar. Silakan daftar terlebih dahulu untuk membuat toko baru.');

        // ✅ Verify NO tenant was auto-created
        $tenant = Tenant::where('name', 'LIKE', '%Bunda Siti Google%')->first();
        $this->assertNull($tenant);

        // ✅ Verify NO user was created
        $user = User::where('email', 'sitigoogle@example.com')->first();
        $this->assertNull($user);

        // ✅ User NOT authenticated
        $this->assertGuest();
    }

    /**
     * ✅ Existing user can login via Google and get redirected to dashboard
     */
    public function test_existing_user_via_google_redirects_to_dashboard()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        // 1. Create existing user
        $plan = Plan::where('slug', 'starter-basic')->first() ?? Plan::create([
            'name' => 'Starter',
            'slug' => 'starter-basic',
            'price' => 0,
            'is_active' => true,
        ]);

        $tenant = Tenant::create(['name' => 'Existing Store']);
        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'billing_cycle' => 'monthly',
            'starts_at' => now(),
            'expires_at' => now()->addDays(30),
        ]);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'company_id' => $tenant->id,
            'name' => 'Existing Owner',
            'email' => 'existing@example.com',
            'password' => bcrypt('password123'),
            'google_id' => null,
        ]);
        $user->assignRole('OWNER');

        // 2. Mock Google SSO
        $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
        $abstractUser->shouldReceive('getId')->andReturn('999888777666555');
        $abstractUser->shouldReceive('getName')->andReturn('Existing Owner');
        $abstractUser->shouldReceive('getEmail')->andReturn('existing@example.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/avatar');
        $abstractUser->shouldReceive('getNickname')->andReturn('existing');

        $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        // 3. Attempt Google login
        $response = $this->get('/auth/google/callback');

        // ✅ Redirect to dashboard (existing user)
        $response->assertRedirect('/dashboard');

        // ✅ User authenticated
        $this->assertAuthenticatedAs($user);

        // ✅ google_id linked to user
        $this->assertEquals('999888777666555', $user->fresh()->google_id);
    }
}
