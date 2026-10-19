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
        // Query performance monitoring
        Schema::create('query_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('query_type'); // SELECT, INSERT, UPDATE, DELETE
            $table->string('table_name');
            $table->decimal('duration_ms', 8, 3); // milliseconds
            $table->decimal('rows_affected', 10, 0)->nullable();
            $table->text('query_text')->nullable();
            $table->string('user_id')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
            $table->index(['company_id', 'created_at']);
            $table->index('table_name');
            $table->index('duration_ms'); // Find slow queries
        });

        // Backup status tracking
        Schema::create('backup_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('backup_type'); // full, incremental, wal
            $table->string('status'); // running, completed, failed
            $table->string('backup_path');
            $table->decimal('size_mb', 12, 2);
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->string('checksum')->nullable(); // For integrity verification
            $table->timestamps();
            $table->index(['company_id', 'created_at']);
            $table->index('status');
        });

        // System health metrics
        Schema::create('health_metrics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('metric_name'); // cpu, memory, disk, db_connections
            $table->decimal('value', 8, 2);
            $table->string('unit'); // %, GB, connections
            $table->string('status'); // ok, warning, critical
            $table->timestamp('recorded_at');
            $table->timestamps();
            $table->index(['company_id', 'metric_name', 'recorded_at']);
        });

        // Uptime tracking
        Schema::create('service_status', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('service_name'); // app, database, redis, tunnel
            $table->string('status'); // up, down, degraded
            $table->timestamp('last_check');
            $table->decimal('uptime_percent', 5, 2)->default(100);
            $table->text('error_message')->nullable();
            $table->timestamps();
            $table->unique(['company_id', 'service_name']);
        });

        // Alert logs
        Schema::create('alert_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('alert_type'); // high_disk, slow_query, backup_failed, service_down
            $table->string('severity'); // info, warning, critical
            $table->text('message');
            $table->text('details')->nullable();
            $table->string('status')->default('new'); // new, acknowledged, resolved
            $table->string('acknowledged_by')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();
            $table->index(['company_id', 'severity', 'created_at']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('query_logs');
        Schema::dropIfExists('backup_logs');
        Schema::dropIfExists('health_metrics');
        Schema::dropIfExists('service_status');
        Schema::dropIfExists('alert_logs');
    }
};
