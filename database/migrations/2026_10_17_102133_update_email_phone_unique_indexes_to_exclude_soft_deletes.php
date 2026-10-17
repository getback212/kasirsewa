<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Update email & phone unique constraints to exclude soft-deleted rows.
 * 
 * Problem: Users table uses SoftDeletes. When a user is soft-deleted,
 * the unique constraint on email/phone still applies, preventing re-use
 * of deleted accounts' credentials.
 * 
 * Solution: Use partial indexes that only apply to rows where deleted_at IS NULL.
 * This allows email/phone reuse after deletion.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop existing unique constraints
            $table->dropUnique(['email']);
            $table->dropUnique(['phone']);
        });

        // Add partial unique indexes (PostgreSQL syntax)
        DB::statement('CREATE UNIQUE INDEX users_email_unique ON users(email) WHERE deleted_at IS NULL');
        DB::statement('CREATE UNIQUE INDEX users_phone_unique ON users(phone) WHERE deleted_at IS NULL AND phone IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS users_email_unique');
        DB::statement('DROP INDEX IF EXISTS users_phone_unique');

        Schema::table('users', function (Blueprint $table) {
            $table->unique('email');
            $table->unique('phone')->nullable();
        });
    }
};
