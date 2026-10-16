<?php

namespace Tests\Feature;

use App\Actions\Shifts\CloseShiftAction;
use App\Models\AuditLog;
use App\Models\Outlet;
use App\Models\Shift;
use App\Models\User;
use App\Services\Audit\AuditLogService;
use Tests\TestCase;

class TenantIsolationSecurityTest extends TestCase
{
    private function ownerOfCompany(int $companyId): User
    {
        $email = match ($companyId) {
            1 => 'owner@example.test',
            2 => 'sinarjaya@example.test',
        };

        return User::where('email', $email)->firstOrFail();
    }

    public function test_owner_only_sees_audit_logs_belonging_to_their_own_company(): void
    {
        $owner1 = $this->ownerOfCompany(1);

        AuditLog::create([
            'company_id' => 1,
            'user_id' => $owner1->id,
            'action' => 'AUDIT_OWN_COMPANY_ONE',
        ]);

        // company berbeda tetapi tenant sama dengan pemilik -> tidak boleh terlihat
        AuditLog::create([
            'company_id' => 2,
            'action' => 'AUDIT_CROSS_COMPANY_SAME_TENANT',
        ]);

        // company berbeda tetapi user pelaku adalah owner1 -> tidak boleh terlihat
        AuditLog::create([
            'company_id' => 2,
            'user_id' => $owner1->id,
            'action' => 'AUDIT_CROSS_COMPANY_SAME_ACTOR',
        ]);

        $response = $this->actingAs($owner1)->get('/audit-logs');

        $response->assertOk();
        $response->assertSee('AUDIT_OWN_COMPANY_ONE');
        $response->assertDontSee('AUDIT_CROSS_COMPANY_SAME_TENANT');
        $response->assertDontSee('AUDIT_CROSS_COMPANY_SAME_ACTOR');
    }

    public function test_owner_cannot_see_logs_authored_by_super_admin(): void
    {
        $owner1 = $this->ownerOfCompany(1);
        $superAdmin = User::where('email', 'admin@example.com')->firstOrFail();

        // Log milik company owner, tetapi pelakunya Super Admin -> wajib disembunyikan.
        AuditLog::create([
            'company_id' => 1,
            'user_id' => $superAdmin->id,
            'action' => 'AUDIT_SUPER_ADMIN_GLOBAL_LOGIN',
        ]);

        $response = $this->actingAs($owner1)->get('/audit-logs');

        $response->assertOk();
        $response->assertDontSee('AUDIT_SUPER_ADMIN_GLOBAL_LOGIN');

        // Super Admin tetap melihat semua log termasuk miliknya sendiri.
        $adminResponse = $this->actingAs($superAdmin)->get('/audit-logs');

        $adminResponse->assertOk();
        $adminResponse->assertSee('AUDIT_SUPER_ADMIN_GLOBAL_LOGIN');
    }

    public function test_impersonation_entry_is_attributed_to_super_admin_and_hidden_from_owner(): void
    {
        $owner1 = $this->ownerOfCompany(1);
        $superAdmin = User::where('email', 'admin@example.com')->firstOrFail();

        $this->actingAs($superAdmin)->post("/admin/tenants/{$owner1->tenant_id}/impersonate");

        // Entri impersonasi wajib tercatat atas nama Super Admin pelaksana.
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'SAAS_TENANT_IMPERSONATE',
            'user_id' => $superAdmin->id,
        ]);

        // Owner tidak melihat entri impersonasi dalam daftar audit log-nya.
        $response = $this->actingAs($owner1)->get('/audit-logs');

        $response->assertOk();
        $response->assertDontSee('SAAS_TENANT_IMPERSONATE');
    }

    public function test_close_shift_action_rejects_shift_owned_by_another_company(): void
    {
        $owner1 = $this->ownerOfCompany(1);
        $owner2 = $this->ownerOfCompany(2);

        $outlet1 = Outlet::where('company_id', 1)->firstOrFail();

        $shift = Shift::create([
            'outlet_id' => $outlet1->id,
            'tenant_id' => $outlet1->tenant_id,
            'user_id' => $owner1->id,
            'opening_cash' => 100000,
            'status' => 'open',
            'opened_at' => now(),
        ]);

        $caught = false;
        try {
            (new CloseShiftAction)->execute(
                shiftId: $shift->id,
                actualCash: 0.0,
                userId: $owner2->id
            );
        } catch (\Throwable $e) {
            $caught = true;
        }

        $this->assertTrue($caught, 'Action harus menolak shift milik company lain.');
        $this->assertSame('open', $shift->fresh()->status, 'Shift tidak boleh berubah status.');
    }

    public function test_audit_log_service_persists_identity_from_explicit_user_id_without_auth(): void
    {
        $owner1 = $this->ownerOfCompany(1);

        // Tidak ada actingAs: meniru pemanggilan dari queue/job.
        $log = AuditLogService::log('QUEUE_TEST_ACTION', null, null, null, null, $owner1->id);

        $this->assertSame(1, (int) $log->company_id);
        $this->assertSame($owner1->id, (int) $log->user_id);
    }
}
