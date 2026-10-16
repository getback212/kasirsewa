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
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@kasirsewa.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('superadmin123'),
                'phone' => '081234567890',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $superAdmin->syncRoles([UserRole::SUPER_ADMIN->value]);

        // 2. Create Tenant + Company + Outlet
        $company = Company::firstOrCreate(
            ['name' => 'Toko Berkah'],
            [
                'registration_number' => 'REG-' . strtoupper(Str::random(6)),
                'is_active' => true,
            ]
        );

        $tenant = Tenant::firstOrCreate(
            ['slug' => 'toko-berkah-001'],
            [
                'name' => 'Toko Berkah',
                'domain' => 'toko-berkah-001.superbackend.my.id',
                'status' => 'active',
            ]
        );

        $outlet = Outlet::firstOrCreate(
            ['company_id' => $company->id, 'code' => 'OUT-0001'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Outlet Utama',
                'phone' => '081234567890',
                'address' => 'Jl. Raya Utama No. 1',
                'is_active' => true,
            ]
        );

        // 3. OWNER
        $owner = User::firstOrCreate(
            ['email' => 'owner@tokobekah.com'],
            [
                'company_id' => $company->id,
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'name' => 'Ari Getback',
                'password' => Hash::make('owner123'),
                'phone' => '081234567891',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $owner->syncRoles([UserRole::OWNER->value]);
        $tenant->update(['owner_id' => $owner->id]);

        // 4. MANAGER
        $manager = User::firstOrCreate(
            ['email' => 'manager@tokobekah.com'],
            [
                'company_id' => $company->id,
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'name' => 'Manager Toko',
                'password' => Hash::make('manager123'),
                'phone' => '081234567892',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $manager->syncRoles([UserRole::MANAGER->value]);

        // 5. CASHIER
        $cashier = User::firstOrCreate(
            ['email' => 'cashier@tokobekah.com'],
            [
                'company_id' => $company->id,
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'name' => 'Kasir Utama',
                'password' => Hash::make('cashier123'),
                'phone' => '081234567893',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $cashier->syncRoles([UserRole::CASHIER->value]);

        // 6. WAREHOUSE STAFF
        $warehouse = User::firstOrCreate(
            ['email' => 'warehouse@tokobekah.com'],
            [
                'company_id' => $company->id,
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'name' => 'Staf Gudang',
                'password' => Hash::make('warehouse123'),
                'phone' => '081234567894',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $warehouse->syncRoles([UserRole::WAREHOUSE->value]);

        // 7. Create Plans + Subscription
        $plans = [
            [
                'slug' => 'starter-basic',
                'name' => 'Starter Basic',
                'description' => 'Paket dasar untuk toko kecil',
                'monthly_price' => 99000,
                'yearly_price' => 990000,
                'max_users' => 5,
                'max_stores' => 1,
                'max_products' => 100,
                'max_transactions' => 5000,
            ],
            [
                'slug' => 'professional',
                'name' => 'Professional',
                'description' => 'Paket untuk bisnis menengah',
                'monthly_price' => 499000,
                'yearly_price' => 4990000,
                'max_users' => 20,
                'max_stores' => 3,
                'max_products' => 5000,
                'max_transactions' => 50000,
            ],
            [
                'slug' => 'enterprise',
                'name' => 'Enterprise',
                'description' => 'Paket unlimited untuk enterprise',
                'monthly_price' => 1999000,
                'yearly_price' => 19990000,
                'max_users' => 999,
                'max_stores' => 999,
                'max_products' => 999999,
                'max_transactions' => 999999,
            ],
        ];

        foreach ($plans as $planData) {
            Plan::firstOrCreate(
                ['slug' => $planData['slug']],
                array_merge($planData, ['is_active' => true])
            );
        }

        // Get first plan (Starter Basic) for trial subscription
        $starterPlan = Plan::where('slug', 'starter-basic')->first();
        
        Subscription::firstOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'plan_id' => $starterPlan->id,
                'status' => 'trial',
                'billing_cycle' => 'monthly',
                'starts_at' => now(),
                'expires_at' => now()->addDays(7),
                'trial_ends_at' => now()->addDays(7),
                'auto_renew' => true,
            ]
        );

        echo "\n✅ Data seeder complete:\n";
        echo "  Super Admin: superadmin@kasirsewa.com / superadmin123\n";
        echo "  Owner: owner@tokobekah.com / owner123\n";
        echo "  Manager: manager@tokobekah.com / manager123\n";
        echo "  Cashier: cashier@tokobekah.com / cashier123\n";
        echo "  Warehouse: warehouse@tokobekah.com / warehouse123\n";
    }
}
