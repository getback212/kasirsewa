<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\Tenant;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\User;
use App\Enums\UserRole;
use App\Enums\StockMovementType;
use App\Actions\Inventory\AdjustStockAction;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Create Permissions & Roles
        $permissions = [
            'access-super-admin', 'manage-tenants', 'manage-plans', 'manage-billing',
            'view-outlets', 'create-outlets', 'edit-outlets', 'delete-outlets',
            'view-users', 'create-users', 'edit-users', 'delete-users',
            'view-products', 'create-products', 'edit-products', 'delete-products',
            'view-categories', 'create-categories', 'edit-categories', 'delete-categories',
            'view-units', 'create-units', 'edit-units', 'delete-units',
            'view-customers', 'create-customers', 'edit-customers', 'delete-customers',
            'view-suppliers', 'create-suppliers', 'edit-suppliers', 'delete-suppliers',
            'view-stock', 'adjust-stock', 'stock-opname', 'transfer-stock',
            'access-pos', 'open-shift', 'close-shift', 'process-sale', 'void-sale', 'process-return', 'cash-movement',
            'view-purchases', 'create-purchases',
            'view-expenses', 'create-expenses', 'edit-expenses', 'delete-expenses',
            'view-dashboard', 'view-reports-sales', 'view-reports-financial', 'view-reports-inventory', 'view-audit-logs',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (UserRole::cases() as $roleEnum) {
            Role::findOrCreate($roleEnum->value, 'web');
        }

        $superAdminRole = Role::findByName(UserRole::SUPER_ADMIN->value, 'web');
        $superAdminRole->givePermissionTo(Permission::all());

        $ownerRole = Role::findByName(UserRole::OWNER->value, 'web');
        $ownerRole->givePermissionTo(Permission::all());

        $managerRole = Role::findByName(UserRole::MANAGER->value, 'web');
        $managerRole->givePermissionTo([
            'view-outlets', 'view-users', 'create-users', 'edit-users',
            'view-products', 'create-products', 'edit-products',
            'view-categories', 'create-categories', 'edit-categories',
            'view-units', 'create-units', 'edit-units',
            'view-customers', 'create-customers', 'edit-customers',
            'view-suppliers', 'create-suppliers', 'edit-suppliers',
            'view-stock', 'adjust-stock', 'stock-opname', 'transfer-stock',
            'access-pos', 'open-shift', 'close-shift', 'process-sale', 'void-sale', 'process-return', 'cash-movement',
            'view-purchases', 'create-purchases',
            'view-dashboard', 'view-reports-sales', 'view-reports-inventory',
        ]);

        $cashierRole = Role::findByName(UserRole::CASHIER->value, 'web');
        $cashierRole->syncPermissions([
            'access-pos', 'open-shift', 'close-shift', 'process-sale', 'cash-movement',
            'view-customers', 'create-customers',
        ]);

        $warehouseRole = Role::findByName(UserRole::WAREHOUSE->value, 'web');
        $warehouseRole->givePermissionTo([
            'view-products', 'create-products', 'edit-products', 'delete-products',
            'view-categories', 'create-categories', 'edit-categories',
            'view-units', 'create-units', 'edit-units',
            'view-stock', 'adjust-stock', 'stock-opname', 'transfer-stock',
            'view-purchases', 'create-purchases', 'view-suppliers', 'create-suppliers', 'edit-suppliers',
        ]);

        // 2. Create Global Super Admin User
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Super Admin SaaS',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $superAdmin->syncRoles([UserRole::SUPER_ADMIN->value]);

        // 3. Create SaaS Subscription Plans
        $planBasic = Plan::updateOrCreate(
            ['slug' => 'starter-basic'],
            [
                'name' => 'Starter Basic',
                'description' => 'Paket hemat untuk UMKM & Toko Tunggal',
                'monthly_price' => 99000,
                'yearly_price' => 990000,
                'max_users' => 3,
                'max_stores' => 1,
                'max_products' => 500,
                'max_transactions' => 3000,
                'features' => ['Kasir POS Speed Touch', 'Stok Gudang Realtime', 'Struk Thermal 58mm', 'Laporan Penjualan'],
                'is_active' => true,
            ]
        );

        $planPro = Plan::updateOrCreate(
            ['slug' => 'business-pro'],
            [
                'name' => 'Business Pro',
                'description' => 'Paket lengkap untuk bisnis retail multi cabang',
                'monthly_price' => 199000,
                'yearly_price' => 1990000,
                'max_users' => 10,
                'max_stores' => 3,
                'max_products' => 2500,
                'max_transactions' => 15000,
                'features' => ['Multi Cabang Store', 'Transfer Stok Cabang', 'Laporan Laba HPP', 'Dual Screen Sync', 'Audit Logs'],
                'is_active' => true,
            ]
        );

        $planEnterprise = Plan::updateOrCreate(
            ['slug' => 'enterprise-unlimited'],
            [
                'name' => 'Enterprise Unlimited',
                'description' => 'Paket skala besar tanpa batas outlet & produk',
                'monthly_price' => 399000,
                'yearly_price' => 3990000,
                'max_users' => 50,
                'max_stores' => 10,
                'max_products' => 10000,
                'max_transactions' => 100000,
                'features' => ['Unlimited Outlets', 'Dedicated Manager Roles', 'Automated Database Backup', 'API & Webhook Access'],
                'is_active' => true,
            ]
        );

        // 4. Create Demo Tenant 1 (BerkahPRO Retail Store)
        $tenant1 = Tenant::updateOrCreate(
            ['slug' => 'berkah-pro'],
            [
                'name' => 'BerkahPRO Retail Enterprise',
                'domain' => 'berkah.kasirsewa.com',
                'status' => 'active',
            ]
        );

        session(['active_tenant_id' => $tenant1->id]);

        $company1 = Company::updateOrCreate(
            ['id' => 1],
            ['name' => $tenant1->name, 'registration_number' => 'REG-SaaS-001', 'is_active' => true]
        );

        $outlet1 = Outlet::updateOrCreate(
            ['code' => 'OUT-001'],
            [
                'company_id' => $company1->id,
                'tenant_id' => $tenant1->id,
                'name' => 'BerkahPRO Store Utama',
                'phone' => '021-5551234',
                'address' => 'Jl. Sudirman No. 1, Jakarta Pusat',
                'is_active' => true,
            ]
        );

        $owner1 = User::updateOrCreate(
            ['email' => 'owner@example.test'],
            [
                'company_id' => $company1->id,
                'tenant_id' => $tenant1->id,
                'outlet_id' => $outlet1->id,
                'name' => 'Owner Pemilik Toko',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $owner1->syncRoles([UserRole::OWNER->value]);
        $tenant1->update(['owner_id' => $owner1->id]);

        $cashier1 = User::updateOrCreate(
            ['email' => 'cashier@example.test'],
            [
                'company_id' => $company1->id,
                'tenant_id' => $tenant1->id,
                'outlet_id' => $outlet1->id,
                'name' => 'Kasir Santi',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $cashier1->syncRoles([UserRole::CASHIER->value]);

        $warehouse1 = User::updateOrCreate(
            ['email' => 'warehouse@example.test'],
            [
                'company_id' => $company1->id,
                'tenant_id' => $tenant1->id,
                'outlet_id' => $outlet1->id,
                'name' => 'Staf Gudang Budi',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $warehouse1->syncRoles([UserRole::WAREHOUSE->value]);

        Subscription::updateOrCreate(
            ['tenant_id' => $tenant1->id],
            [
                'plan_id' => $planBasic->id,
                'status' => 'active',
                'billing_cycle' => 'monthly',
                'starts_at' => now(),
                'expires_at' => now()->addDays(30),
                'trial_ends_at' => now()->addDays(7),
                'auto_renew' => true,
            ]
        );

        // 5. Create Master Categories, Units, Products for Tenant 1
        $catFood = Category::updateOrCreate(
            ['company_id' => $company1->id, 'name' => 'Makanan & Minuman'],
            ['tenant_id' => $tenant1->id, 'slug' => Str::slug('Makanan & Minuman'), 'is_active' => true]
        );

        $catGadget = Category::updateOrCreate(
            ['company_id' => $company1->id, 'name' => 'Elektronik & Gadget'],
            ['tenant_id' => $tenant1->id, 'slug' => Str::slug('Elektronik & Gadget'), 'is_active' => true]
        );

        $unitPcs = Unit::updateOrCreate(
            ['company_id' => $company1->id, 'short_name' => 'pcs'],
            ['tenant_id' => $tenant1->id, 'name' => 'Pieces']
        );

        $unitBox = Unit::updateOrCreate(
            ['company_id' => $company1->id, 'short_name' => 'box'],
            ['tenant_id' => $tenant1->id, 'name' => 'Box Container']
        );

        Customer::updateOrCreate(
            ['code' => 'CUST-001'],
            [
                'company_id' => $company1->id,
                'tenant_id' => $tenant1->id,
                'name' => 'Pelanggan Umum (Cash)',
                'phone' => '-',
                'email' => null,
                'address' => null,
            ]
        );

        Supplier::updateOrCreate(
            ['code' => 'SUPP-001'],
            [
                'company_id' => $company1->id,
                'tenant_id' => $tenant1->id,
                'name' => 'PT Indofood Distributor',
                'phone' => '021-5559999',
                'email' => 'sales@indofood.test',
                'address' => 'Kawasan Industri Pulo Gadung',
            ]
        );

        $p1 = Product::updateOrCreate(
            ['sku' => 'SKU-KOPI-001'],
            [
                'company_id' => $company1->id,
                'tenant_id' => $tenant1->id,
                'category_id' => $catFood->id,
                'unit_id' => $unitPcs->id,
                'barcode' => '899123456701',
                'name' => 'Kopi Instant Sachet 25g',
                'description' => 'Kopi sachet nikmat mantap',
                'purchase_price' => 2500,
                'selling_price' => 3500,
                'minimum_stock' => 10,
                'is_active' => true,
            ]
        );

        $p2 = Product::updateOrCreate(
            ['sku' => 'SKU-CHARGER-002'],
            [
                'company_id' => $company1->id,
                'tenant_id' => $tenant1->id,
                'category_id' => $catGadget->id,
                'unit_id' => $unitBox->id,
                'barcode' => '899123456702',
                'name' => 'Charger Fast Charging 25W',
                'description' => 'Charger HP fast charging Type-C',
                'purchase_price' => 125000,
                'selling_price' => 175000,
                'minimum_stock' => 5,
                'is_active' => true,
            ]
        );

        // Seed Initial Inventory Stocks
        $adjustAction = new AdjustStockAction();
        $adjustAction->execute($outlet1->id, $p1->id, 50.00, StockMovementType::PURCHASE, $owner1->id, null, null, 'Stok awal saldo gudang');
        $adjustAction->execute($outlet1->id, $p2->id, 18.00, StockMovementType::PURCHASE, $owner1->id, null, null, 'Stok awal saldo gudang');

        // 6. Create Demo Tenant 2 (Sinar Jaya Supermarket)
        $tenant2 = Tenant::updateOrCreate(
            ['slug' => 'sinar-jaya'],
            [
                'name' => 'Sinar Jaya Supermarket',
                'domain' => 'sinarjaya.kasirsewa.com',
                'status' => 'active',
            ]
        );

        session(['active_tenant_id' => $tenant2->id]);

        $company2 = Company::updateOrCreate(
            ['id' => 2],
            ['name' => $tenant2->name, 'registration_number' => 'REG-SaaS-002', 'is_active' => true]
        );

        $outlet2 = Outlet::updateOrCreate(
            ['code' => 'OUT-SJ01'],
            [
                'company_id' => $company2->id,
                'tenant_id' => $tenant2->id,
                'name' => 'Sinar Jaya Mart Cabang 1',
                'phone' => '021-7778888',
                'address' => 'Jl. Pemuda No. 88, Surabaya',
                'is_active' => true,
            ]
        );

        $owner2 = User::updateOrCreate(
            ['email' => 'sinarjaya@example.test'],
            [
                'company_id' => $company2->id,
                'tenant_id' => $tenant2->id,
                'outlet_id' => $outlet2->id,
                'name' => 'Pak Hendra (Sinar Jaya)',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $owner2->syncRoles([UserRole::OWNER->value]);
        $tenant2->update(['owner_id' => $owner2->id]);

        Subscription::updateOrCreate(
            ['tenant_id' => $tenant2->id],
            [
                'plan_id' => $planEnterprise->id,
                'status' => 'active',
                'billing_cycle' => 'yearly',
                'starts_at' => now(),
                'expires_at' => now()->addYear(),
                'trial_ends_at' => null,
                'auto_renew' => true,
            ]
        );

        session()->forget('active_tenant_id');

        // Sync PostgreSQL Primary Key Auto-Increment Sequences
        if (config('database.default') === 'pgsql') {
            $tables = ['companies', 'tenants', 'outlets', 'users', 'plans', 'subscriptions', 'invoices', 'customers', 'categories', 'units', 'products', 'suppliers'];
            foreach ($tables as $table) {
                try {
                    DB::statement("SELECT setval('{$table}_id_seq', (SELECT COALESCE(MAX(id), 1) FROM {$table}));");
                } catch (\Throwable $e) {}
            }
        }
    }
}
