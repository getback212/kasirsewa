<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Create roles
        $roles = [
            UserRole::SUPER_ADMIN->value,
            UserRole::OWNER->value,
            UserRole::MANAGER->value,
            UserRole::CASHIER->value,
            UserRole::WAREHOUSE->value,
        ];

        foreach ($roles as $roleName) {
            \Spatie\Permission\Models\Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web']
            );
        }

        // 1. SUPER ADMIN (global, no tenant)
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@kasirsewa.com',
            'password' => Hash::make('superadmin123'),
            'phone' => '081234567890',
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $superAdmin->syncRoles([UserRole::SUPER_ADMIN->value]);

        // 2. Create Tenant + Company + Outlet
        $tenant = Tenant::create([
            'name' => 'Toko Berkah',
            'slug' => 'toko-berkah-001',
            'domain' => 'toko-berkah-001.superbackend.my.id',
            'status' => 'active',
        ]);

        $company = Company::create([
            'name' => 'Toko Berkah',
            'registration_number' => 'REG-' . strtoupper(Str::random(6)),
            'is_active' => true,
        ]);

        $outlet = Outlet::create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'code' => 'OUT-0001',
            'name' => 'Outlet Utama',
            'phone' => '081234567890',
            'address' => 'Jl. Raya Utama No. 1',
            'is_active' => true,
        ]);

        // 3. OWNER
        $owner = User::create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'name' => 'Ari Getback',
            'email' => 'owner@tokobekah.com',
            'password' => Hash::make('owner123'),
            'phone' => '081234567891',
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $owner->syncRoles([UserRole::OWNER->value]);
        $tenant->update(['owner_id' => $owner->id]);

        // 4. MANAGER
        $manager = User::create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'name' => 'Manager Toko',
            'email' => 'manager@tokobekah.com',
            'password' => Hash::make('manager123'),
            'phone' => '081234567892',
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $manager->syncRoles([UserRole::MANAGER->value]);

        // 5. CASHIER
        $cashier = User::create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'name' => 'Kasir Utama',
            'email' => 'cashier@tokobekah.com',
            'password' => Hash::make('cashier123'),
            'phone' => '081234567893',
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $cashier->syncRoles([UserRole::CASHIER->value]);

        // 6. WAREHOUSE STAFF
        $warehouse = User::create([
            'company_id' => $company->id,
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'name' => 'Staf Gudang',
            'email' => 'warehouse@tokobekah.com',
            'password' => Hash::make('warehouse123'),
            'phone' => '081234567894',
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $warehouse->syncRoles([UserRole::WAREHOUSE->value]);

        // 7. Create Plan + Subscription
        $plan = Plan::firstOrCreate(
            ['slug' => 'starter-basic'],
            [
                'name' => 'Starter Basic',
                'description' => 'Paket dasar untuk toko kecil',
                'monthly_price' => 99000,
                'yearly_price' => 990000,
                'max_users' => 5,
                'max_stores' => 1,
                'max_products' => 100,
                'is_active' => true,
            ]
        );

        Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'trial',
            'billing_cycle' => 'monthly',
            'starts_at' => now(),
            'expires_at' => now()->addDays(7),
            'trial_ends_at' => now()->addDays(7),
            'auto_renew' => true,
        ]);

        echo "\n✅ Data seeder complete:\n";
        echo "  Super Admin: superadmin@kasirsewa.com / superadmin123\n";
        echo "  Owner: owner@tokobekah.com / owner123\n";
        echo "  Manager: manager@tokobekah.com / manager123\n";
        echo "  Cashier: cashier@tokobekah.com / cashier123\n";
        echo "  Warehouse: warehouse@tokobekah.com / warehouse123\n";
    }
}
