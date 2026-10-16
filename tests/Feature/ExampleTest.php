<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_access_welcome_landing_page(): void
    {
        $response = $this->get('https://superbackend.my.id/');
        $response->assertStatus(200);
    }

    public function test_authenticated_owner_can_access_dashboard(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::where('email', 'owner@example.test')->first();

        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertStatus(200);
    }
}
