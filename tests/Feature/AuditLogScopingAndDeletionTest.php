<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use App\Enums\UserRole;
use Tests\TestCase;

class AuditLogScopingAndDeletionTest extends TestCase
{
    public function test_super_admin_can_view_all_logs_and_delete_single_audit_log_entry()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $superAdmin = User::factory()->create(['tenant_id' => null]);
        $superAdmin->assignRole(UserRole::SUPER_ADMIN->value);

        $log = AuditLog::create([
            'user_id' => $superAdmin->id,
            'action' => 'TEST_AUDIT_LOG_ACTION',
            'description' => 'Test Audit Entry Description',
            'ip_address' => '127.0.0.1',
        ]);

        // 1. Super Admin sees log
        $response = $this->actingAs($superAdmin)->get('/audit-logs');
        $response->assertSee('TEST_AUDIT_LOG_ACTION');

        // 2. Super Admin deletes single log entry
        $deleteResponse = $this->actingAs($superAdmin)->delete("/audit-logs/{$log->id}");
        $deleteResponse->assertRedirect();
        $this->assertDatabaseMissing('audit_logs', ['id' => $log->id]);
    }
}
