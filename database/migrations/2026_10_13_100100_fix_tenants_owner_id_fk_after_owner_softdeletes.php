<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        try {
            DB::statement('ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_owner_id_foreign');
            DB::statement('ALTER TABLE tenants ADD CONSTRAINT tenants_owner_id_foreign FOREIGN KEY (owner_id) REFERENCES users (id)');
        } catch (\Throwable $e) {
            // ignore
        }

        try {
            DB::statement('UPDATE tenants t SET owner_id = u.id FROM users u WHERE t.owner_id IS NOT NULL AND u.tenant_id = t.id AND u.deleted_at IS NULL LIMIT 1');
        } catch (\Throwable $e) {
            // ignore
        }
    }

    public function down(): void
    {
        try {
            DB::statement('ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_owner_id_foreign');
            DB::statement('ALTER TABLE tenants ADD CONSTRAINT tenants_owner_id_foreign FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL');
        } catch (\Throwable $e) {
            // ignore
        }
    }
};
