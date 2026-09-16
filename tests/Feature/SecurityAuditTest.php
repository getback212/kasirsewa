<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\Audit\AuditLogService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SecurityAuditTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_security_headers_are_applied_to_responses(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);

        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    public function test_sensitive_passwords_are_redacted_from_audit_logs(): void
    {
        $user = User::first();

        $this->actingAs($user);

        $audit = AuditLogService::log(
            action: 'USER_PASSWORD_CHANGE',
            oldValues: ['password' => 'OldSecret123!'],
            newValues: ['password' => 'NewSecret456!']
        );

        $this->assertEquals('[REDACTED]', $audit->old_values['password']);
        $this->assertEquals('[REDACTED]', $audit->new_values['password']);
    }

    public function test_cashier_cannot_access_owner_financial_reports(): void
    {
        $cashier = User::where('email', 'cashier@example.test')->first();

        $response = $this->actingAs($cashier)->get('/reports');

        $response->assertStatus(403);
    }

    public function test_cashier_cannot_access_master_products_catalog(): void
    {
        $cashier = User::where('email', 'cashier@example.test')->first();

        $response = $this->actingAs($cashier)->get('/products');

        $response->assertStatus(403);
    }

    public function test_cashier_cannot_access_sales_returns_module(): void
    {
        $cashier = User::where('email', 'cashier@example.test')->first();

        $response = $this->actingAs($cashier)->get('/sales-returns');

        $response->assertStatus(403);
    }

    public function test_cashier_cannot_access_outlet_settings(): void
    {
        $cashier = User::where('email', 'cashier@example.test')->first();

        $response = $this->actingAs($cashier)->get('/outlets');

        $response->assertStatus(403);
    }

    public function test_warehouse_cannot_access_outlet_settings(): void
    {
        $warehouse = User::where('email', 'warehouse@example.test')->first();

        $response = $this->actingAs($warehouse)->get('/outlets');

        $response->assertStatus(403);
    }

    public function test_owner_can_access_and_update_outlet_settings(): void
    {
        $owner = User::where('email', 'owner@example.test')->first();

        $response = $this->actingAs($owner)->get('/outlets');
        $response->assertStatus(200);

        $updateResponse = $this->actingAs($owner)->put('/outlets/1', [
            'code' => 'OUT-001',
            'name' => 'Toko Utama RetailPRO Audited',
            'phone' => '08123456789',
            'address' => 'Jl. Sudirman Audit No. 1',
            'tax_percentage' => 11,
            'enable_ppn' => true,
            'is_active' => true,
        ]);

        $updateResponse->assertRedirect();
        $this->assertDatabaseHas('outlets', [
            'id' => 1,
            'name' => 'Toko Utama RetailPRO Audited',
        ]);
    }
}
