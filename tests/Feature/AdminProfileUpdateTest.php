<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AdminProfileUpdateTest extends TestCase
{
    #[Test]
    public function super_admin_can_view_profile_edit_page(): void
    {
        $admin = User::factory()->create([
            'email' => 'profile.admin@test.com',
            'name' => 'Super Admin',
            'is_active' => true,
        ]);
        $admin->assignRole('SUPER_ADMIN');

        $this->actingAs($admin, 'web');

        $response = $this->get('/admin/profile');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/ProfileEdit')
            ->where('profile.email', 'profile.admin@test.com')
        );
    }

    #[Test]
    public function super_admin_can_update_own_profile_name_and_email(): void
    {
        $admin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'profile.update@test.com',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $admin->assignRole('SUPER_ADMIN');

        $this->actingAs($admin, 'web');

        $response = $this->put('/admin/profile', [
            'name' => 'Updated Admin Name',
            'email' => 'profile.updated@test.com',
            'current_password' => 'password',
        ]);

        $response->assertRedirect('/admin/profile');
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'name' => 'Updated Admin Name',
            'email' => 'profile.updated@test.com',
        ]);
    }

    #[Test]
    public function non_admin_cannot_access_profile_route(): void
    {
        $user = User::factory()->create([
            'email' => 'profile.owner@test.com',
            'is_active' => true,
        ]);
        $user->assignRole('OWNER');

        $this->actingAs($user, 'web');

        $response = $this->get('/admin/profile');
        $response->assertForbidden();
    }
}
