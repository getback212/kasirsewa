<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class StaffUserDeleteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        collect(['view-users', 'create-users', 'update-users', 'delete-users', 'assign-roles'])
            ->map(fn ($name) => Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']));
        Role::firstOrCreate(['name' => UserRole::OWNER->value, 'guard_name' => 'web'])->syncPermissions([
            'view-users', 'create-users', 'update-users', 'delete-users', 'assign-roles',
        ]);
        Role::firstOrCreate(['name' => UserRole::CASHIER->value, 'guard_name' => 'web'])->syncPermissions([]);
    }

    private function createTenantOwner(Outlet $outlet): User
    {
        $owner = User::factory()->create([
            'tenant_id' => $outlet->tenant_id,
            'company_id' => $outlet->company_id,
            'outlet_id' => $outlet->id,
            'is_active' => true,
            'password' => bcrypt('password'),
        ]);
        $owner->syncRoles([UserRole::OWNER->value]);
        $owner->givePermissionTo(['view-users', 'create-users', 'update-users', 'delete-users', 'assign-roles']);

        return $owner;
    }

    public function test_soft_deletes_cashier_staff_account(): void
    {
        $outlet = Outlet::factory()->create();
        $owner = $this->createTenantOwner($outlet);
        $cashier = User::factory()->create([
            'tenant_id' => $outlet->tenant_id,
            'company_id' => $outlet->company_id,
            'outlet_id' => $outlet->id,
            'is_active' => true,
        ]);
        $cashier->syncRoles([UserRole::CASHIER->value]);

        $response = $this->actingAs($owner)->delete(route('users.destroy', $cashier->id));
        $response->assertRedirect();
        $this->assertSoftDeleted('users', ['id' => $cashier->id]);
        $this->assertDatabaseHas('model_has_roles', ['model_id' => $cashier->id]);
    }

    public function test_prevents_hard_delete_when_sales_history_exists(): void
    {
        $outlet = Outlet::factory()->create();
        $owner = $this->createTenantOwner($outlet);
        $cashier = User::factory()->create([
            'tenant_id' => $outlet->tenant_id,
            'company_id' => $outlet->company_id,
            'outlet_id' => $outlet->id,
            'is_active' => true,
        ]);
        $cashier->syncRoles([UserRole::CASHIER->value]);

        $tenantId = $outlet->tenant_id;
        \DB::table('sales')->insert([
            'tenant_id' => $tenantId,
            'outlet_id' => $outlet->id,
            'cashier_id' => $cashier->id,
            'invoice_number' => 'INV-TEST-001',
            'subtotal' => 10000,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'grand_total' => 10000,
            'payment_status' => 'paid',
            'paid_amount' => 10000,
            'change_amount' => 0,
            'sale_date' => now(),
            'transaction_status' => 'completed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($owner)->delete(route('users.destroy', $cashier->id), ['force' => true]);
        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $cashier->id]);
    }

    public function test_cannot_force_delete_owner(): void
    {
        $outlet = Outlet::factory()->create();
        $owner1 = $this->createTenantOwner($outlet);
        $owner2 = User::factory()->create([
            'tenant_id' => $outlet->tenant_id,
            'company_id' => $outlet->company_id,
            'outlet_id' => $outlet->id,
        ]);
        $owner2->syncRoles([UserRole::OWNER->value]);
        $owner2->givePermissionTo(['view-users', 'create-users', 'update-users', 'delete-users']);

        $response = $this->actingAs($owner1)->delete(route('users.destroy', $owner2->id), ['force' => true]);
        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $owner2->id]);
    }
}
