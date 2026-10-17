<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add impersonation tracking + visibility control to audit logs.
     * 
     * impersonated_by: If super admin acts as another user, record who impersonated
     * visible_to: Control who can see this log ('super_admin_only' or 'tenant')
     */
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // If super admin impersonates a tenant/user, record the impersonator's ID
            $table->unsignedBigInteger('impersonated_by')->nullable()->after('user_id');
            $table->foreign('impersonated_by')->references('id')->on('users')->nullOnDelete();

            // Visibility scope: 'super_admin_only' = super admin only, 'tenant' = visible to tenant
            $table->string('visible_to')->default('tenant')->after('impersonated_by');
            $table->index('visible_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropForeignKey(['impersonated_by']);
            $table->dropColumn(['impersonated_by', 'visible_to']);
        });
    }
};
