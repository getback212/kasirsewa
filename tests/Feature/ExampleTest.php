<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_owner_can_access_dashboard(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::where('email', 'owner@example.test')->first();

        $response = $this->actingAs($user)->get('/');
        $response->assertStatus(200);
    }
}
