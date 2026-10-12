<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->string('display_pair_token', 64)->nullable()->unique()->after('qris_image_url');
        });

        // Isi token acak untuk outlet yang sudah ada.
        foreach (\App\Models\Outlet::whereNull('display_pair_token')->cursor() as $outlet) {
            $outlet->update(['display_pair_token' => 'DISP-'.mb_strtoupper(\Illuminate\Support\Str::random(12))]);
        }
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn(['display_pair_token']);
        });
    }
};
