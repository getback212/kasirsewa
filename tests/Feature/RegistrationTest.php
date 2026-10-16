<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_registration_page_can_be_rendered(): void
    {
        $response = $this->get('/register');
        $response->assertStatus(200);
    }

    public function test_prospective_tenant_owner_can_self_register_store(): void
    {
        $plan = Plan::first();

        $response = $this->post('/register', [
            'store_name' => 'Toko Minimarket Maju Jaya',
            'owner_name' => 'Pak Joko Susilo',
            'email' => 'joko.majujaya@example.com',
            'phone' => '081298765432',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
        ]);

        $this->assertAuthenticated();

        $tenant = Tenant::where('name', 'Toko Minimarket Maju Jaya')->first();
        $this->assertNotNull($tenant);

        $owner = User::where('email', 'joko.majujaya@example.com')->first();
        $this->assertNotNull($owner);
        $this->assertEquals($tenant->id, $owner->tenant_id);

        $response->assertRedirect('/dashboard');
    }
}
