<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_login_page_can_be_rendered(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }

    public function test_owner_can_authenticate_with_valid_credentials(): void
    {
        $response = $this->post('/login', [
            'email' => 'owner@example.test',
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/dashboard');
    }

    public function test_cashier_authenticates_and_redirects_to_pos(): void
    {
        $response = $this->post('/login', [
            'email' => 'cashier@example.test',
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/pos');
    }

    public function test_users_cannot_authenticate_with_invalid_password(): void
    {
        $response = $this->post('/login', [
            'email' => 'owner@example.test',
            'password' => 'WrongPassword123!',
        ]);

        $this->assertGuest();
    }

    public function test_inactive_users_are_blocked_from_authenticating(): void
    {
        $user = User::where('email', 'cashier@example.test')->first();
        $user->update(['is_active' => false]);

        $response = $this->post('/login', [
            'email' => 'cashier@example.test',
            'password' => 'PosRetail2026!',
        ]);

        $this->assertGuest();
    }
}
