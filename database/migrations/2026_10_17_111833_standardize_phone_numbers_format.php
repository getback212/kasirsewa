<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Standardize all phone numbers to 62xxx format.
     * Convert 0xxx → 62xxx, ensure all stored consistently.
     */
    public function up(): void
    {
        DB::statement(
            "UPDATE users SET phone = CASE
                WHEN phone IS NULL THEN NULL
                WHEN phone ~ '^0[0-9]' THEN '62' || SUBSTRING(phone, 2)
                WHEN phone ~ '^62[0-9]' THEN phone
                ELSE '62' || phone
            END
            WHERE phone IS NOT NULL AND phone != ''"
        );
    }

    /**
     * Reverse: convert back to 0xxx format (optional).
     */
    public function down(): void
    {
        DB::statement(
            "UPDATE users SET phone = CASE
                WHEN phone IS NULL THEN NULL
                WHEN phone ~ '^62[0-9]' THEN '0' || SUBSTRING(phone, 3)
                ELSE phone
            END
            WHERE phone IS NOT NULL AND phone != ''"
        );
    }
};
