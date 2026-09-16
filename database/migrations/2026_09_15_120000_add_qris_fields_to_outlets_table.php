<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->text('qris_payload')->nullable()->after('enable_ppn');
            $table->string('qris_image_url')->nullable()->after('qris_payload');
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn(['qris_payload', 'qris_image_url']);
        });
    }
};
