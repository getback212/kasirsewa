<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('category'); // listrik_water_internet, gaji_karyawan, sewa_tempat, maintenance, operasional_harian, lain_lain
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('amount', 15, 2)->default(0.00);
            $table->date('expense_date');
            $table->string('receipt_photo_url')->nullable();
            $table->timestamps();

            $table->index(['outlet_id', 'expense_date']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
