<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Deleting a staff account physically (UserController::destroy) cascaded
 * through `sales.cashier_id`, `purchases.user_id`, `shifts.user_id`, and the
 * rest — erasing the cashier's sales history along with the account. Add
 * soft deletes so "hapus staff" only deactivates the account, and keep the
 * hard-delete path for tenant purges (which delete the business rows first,
 * inside a transaction).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
