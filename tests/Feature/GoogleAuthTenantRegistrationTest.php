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
    public function test_user_can_redirect_and_register_tenant_via_google_sso()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
        $abstractUser->shouldReceive('getId')->andReturn('112233445566778899');
        $abstractUser->shouldReceive('getName')->andReturn('Bunda Siti Google');
        $abstractUser->shouldReceive('getEmail')->andReturn('sitigoogle@example.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/default-avatar');
        $abstractUser->shouldReceive('getNickname')->andReturn('sitigoogle');

        $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/auth/google/callback');
        $response->assertRedirect('/dashboard');

        // 1. Verify tenant created
        $tenant = Tenant::where('name', 'LIKE', '%Bunda Siti Google%')->first();
        $this->assertNotNull($tenant);

        // 2. Verify owner created with google_id
        $owner = User::where('email', 'sitigoogle@example.com')->first();
        $this->assertNotNull($owner);
        $this->assertEquals('112233445566778899', $owner->google_id);

        // 3. Verify 7-day trial subscription created
        $subscription = Subscription::where('tenant_id', $tenant->id)->first();
        $this->assertNotNull($subscription);
        $this->assertEquals('trial', $subscription->status);

        // 4. Verify user authenticated
        $this->assertAuthenticatedAs($owner);
    }
}
