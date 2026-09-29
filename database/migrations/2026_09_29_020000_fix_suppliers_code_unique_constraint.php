<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropUnique('suppliers_code_unique');
            $table->unique(['tenant_id', 'code'], 'suppliers_tenant_id_code_unique');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropUnique('suppliers_tenant_id_code_unique');
            $table->unique('code', 'suppliers_code_unique');
        });
    }
};
