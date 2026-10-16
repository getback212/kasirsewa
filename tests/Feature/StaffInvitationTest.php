<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class StaffInvitationTest extends TestCase
{
    public function test_owner_can_create_staff_and_send_gmail_and_whatsapp_invitation()
    {
        $this->seed(RolePermissionSeeder::class);
        Mail::fake();

        $tenant = Tenant::create(['name' => 'Toko Invite Test', 'slug' => 'toko-invite-test', 'status' => 'active']);
        $company = Company::create(['tenant_id' => $tenant->id, 'name' => 'Toko Invite Test']);
        $outlet = Outlet::create(['company_id' => $company->id, 'tenant_id' => $tenant->id, 'code' => 'OUT-77', 'name' => 'Outlet Invite Test', 'is_active' => true]);

        $owner = User::factory()->create(['company_id' => $company->id, 'tenant_id' => $tenant->id, 'outlet_id' => $outlet->id, 'email_verified_at' => now()]);
        $owner->assignRole(UserRole::OWNER->value);

        // Owner invites staff with email and whatsapp number
        $response = $this->actingAs($owner)->withSession(['active_tenant_id' => $tenant->id])->post('/users', [
            'name' => 'Kasir Santi Gmail',
            'email' => 'kasirsanti.gmail@example.com',
            'phone' => '081234567890',
            'password' => 'password123',
            'role' => UserRole::CASHIER->value,
            'outlet_id' => $outlet->id,
            'send_invite' => true,
        ]);

        $response->assertRedirect();

        $staff = User::where('email', 'kasirsanti.gmail@example.com')->first();
        $this->assertNotNull($staff);
        $this->assertTrue($staff->hasRole(UserRole::CASHIER->value));
        $this->assertNotNull($staff->email_verified_at);
        $this->assertEquals('6281234567890', $staff->phone);
    }
}
