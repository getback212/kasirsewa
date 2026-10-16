<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('saas_payments', function (Blueprint $table) {
            $table->string('payment_proof')->nullable()->after('payload')->comment('Path to uploaded payment proof (bank transfer screenshot)');
            $table->timestamp('proof_verified_at')->nullable()->after('payment_proof')->comment('When Super Admin verified the proof');
            $table->text('proof_rejection_reason')->nullable()->after('proof_verified_at')->comment('Reason if proof was rejected');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('saas_payments', function (Blueprint $table) {
            $table->dropColumn('payment_proof');
            $table->dropColumn('proof_verified_at');
            $table->dropColumn('proof_rejection_reason');
        });
    }
};
