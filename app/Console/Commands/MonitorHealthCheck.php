<?php

namespace App\Console\Commands;

use App\Services\Monitoring\HealthMonitor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MonitorHealthCheck extends Command
{
    protected $signature = 'monitor:health {--company_id=6}';
    protected $description = 'Check system health and log metrics (database, redis, tunnel, disk)';

    public function handle(HealthMonitor $monitor): int
    {
        $companyId = $this->option('company_id');

        $this->info('Running system health checks...');

        // Check all services
        $status = $monitor->getAllStatus();

        foreach ($status as $service => $check) {
            $serviceStatus = $check['status'];
            $this->line("  $service: " . strtoupper($serviceStatus));

            // Log to database
            DB::table('service_status')->updateOrInsert(
                ['company_id' => $companyId, 'service_name' => $service],
                [
                    'status' => $serviceStatus,
                    'last_check' => now(),
                    'uptime_percent' => $serviceStatus === 'up' ? 100 : 0,
                ]
            );

            // Alert on down status
            if ($serviceStatus === 'down') {
                DB::table('alert_logs')->insert([
                    'company_id' => $companyId,
                    'alert_type' => 'service_down',
                    'severity' => 'critical',
                    'message' => "Service '$service' is DOWN",
                    'details' => json_encode($check),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->error("⚠ Alert: $service is DOWN");
            }
        }

        $this->info('✓ Health check complete');
        return Command::SUCCESS;
    }
}
