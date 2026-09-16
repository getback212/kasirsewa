<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->decimal('tax_percentage', 5, 2)->default(11.00)->after('address');
            $table->boolean('enable_ppn')->default(true)->after('tax_percentage');
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn(['tax_percentage', 'enable_ppn']);
        });
    }
};
