<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // 'saas_subdomain' = <label>.superbackend.my.id (covered by the
            // wildcard record), 'custom' = a domain the tenant owns.
            $table->string('domain_type', 32)->default('saas_subdomain')->after('domain');
            // 'active' | 'pending_dns' | 'failed' | 'none'
            $table->string('domain_status', 32)->default('active')->after('domain_type');
            // Where the tenant must point their DNS (shown in the UI).
            $table->string('domain_dns_target')->nullable()->after('domain_status');
            // Cloudflare for SaaS custom hostname id, when provisioning is on.
            $table->string('custom_hostname_id', 64)->nullable()->after('domain_dns_target');
            $table->timestamp('domain_checked_at')->nullable()->after('custom_hostname_id');
        });

        // Backfill existing rows so the new columns describe reality.
        DB::table('tenants')->whereNull('domain')->update([
            'domain_type' => 'saas_subdomain',
            'domain_status' => 'none',
        ]);

        DB::table('tenants')
            ->whereNotNull('domain')
            ->where('domain', 'like', '%.superbackend.my.id')
            ->update([
                'domain_type' => 'saas_subdomain',
                'domain_status' => 'active',
                'domain_dns_target' => DB::raw('domain'),
                'domain_checked_at' => now(),
            ]);

        DB::table('tenants')
            ->whereNotNull('domain')
            ->where('domain', 'not like', '%.superbackend.my.id')
            ->update([
                'domain_type' => 'custom',
                'domain_status' => 'pending_dns',
            ]);
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'domain_type',
                'domain_status',
                'domain_dns_target',
                'custom_hostname_id',
                'domain_checked_at',
            ]);
        });
    }
};
