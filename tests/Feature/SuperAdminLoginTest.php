<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminLoginTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that SUPER_ADMIN can log in via /super-admin/login
     * even when company_id references a non-existent company.
     *
     * This reproduces the bug where AuditLogService::log() fails
     * with foreign key violation because super admin's company_id
     * points to a deleted/missing company.
     */
    public function test_super_admin_login_succeeds_even_without_company(): void
    {
        // Create a super admin user WITHOUT an associated company
        $superAdmin = User::factory()->create([
            'email' => 'superadmin@test.com',
            'password' => bcrypt('password123'),
            'company_id' => 99999, // Non-existent company ID
            'is_active' => true,
        ]);

        $superAdmin->assignRole('SUPER_ADMIN');

        // Login via super admin portal — should NOT throw foreign key error
        $response = $this->post('/super-admin/login', [
            'email' => 'superadmin@test.com',
            'password' => 'password123',
        ]);

        // Should redirect to admin dashboard (login succeeds)
        $response->assertRedirect('/admin/dashboard');

        // User should be authenticated
        $this->assertAuthenticatedAs($superAdmin);
    }

    /**
     * Test that audit log is created with null company_id when
     * the user's referenced company does not exist.
     */
    public function test_audit_log_falls_back_to_null_when_company_missing(): void
    {
        $superAdmin = User::factory()->create([
            'email' => 'superadmin2@test.com',
            'password' => bcrypt('password123'),
            'company_id' => 88888, // Non-existent
            'is_active' => true,
        ]);
        $superAdmin->assignRole('SUPER_ADMIN');

        $this->post('/super-admin/login', [
            'email' => 'superadmin2@test.com',
            'password' => 'password123',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $superAdmin->id,
            'action' => 'SUPER_ADMIN_LOGIN',
            'company_id' => null, // Must be null, not 88888
        ]);
    }

    /**
     * Test normal login (non-super-admin) also handles missing company gracefully.
     */
    public function test_normal_user_login_handles_missing_company(): void
    {
        $user = User::factory()->create([
            'email' => 'normaluser@test.com',
            'password' => bcrypt('password123'),
            'company_id' => 77777, // Non-existent
            'is_active' => true,
        ]);
        $user->assignRole('OWNER');

        $response = $this->post('/login', [
            'email' => 'normaluser@test.com',
            'password' => 'password123',
        ]);

        // Should succeed and redirect to dashboard
        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);

        // Audit log should have null company_id
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'USER_LOGIN',
            'company_id' => null,
        ]);
    }

    /**
     * Test that when company DOES exist, it is used normally.
     */
    public function test_audit_log_uses_existing_company_id(): void
    {
        $company = Company::create([
            'name' => 'Test Company',
            'registration_number' => 'TEST-001',
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'email' => 'withcompany@test.com',
            'password' => bcrypt('password123'),
            'company_id' => $company->id,
            'is_active' => true,
        ]);
        $user->assignRole('OWNER');

        $this->post('/login', [
            'email' => 'withcompany@test.com',
            'password' => 'password123',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'USER_LOGIN',
            'company_id' => $company->id,
        ]);
    }
}
