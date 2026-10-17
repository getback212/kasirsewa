<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('audit-logs:purge {--months=24 : Retention period in months}')]
#[Description('Delete audit logs older than specified months (default: 24 months for compliance)')]
class PurgeOldAuditLogs extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $months = (int) ($this->option('months') ?? 24);
        $cutoffDate = now()->subMonths($months);

        $this->info("🧹 Purging audit logs older than {$months} months (before {$cutoffDate->format('Y-m-d')})...");

        try {
            $deletedCount = AuditLog::where('created_at', '<', $cutoffDate)->delete();

            $this->info("✅ Successfully deleted {$deletedCount} old audit log entries.");

            // Log the purge action
            \Log::info("Audit logs purged: {$deletedCount} entries deleted (before {$cutoffDate->toDateString()})");

        } catch (\Exception $e) {
            $this->error("❌ Error purging audit logs: {$e->getMessage()}");
            return 1;
        }

        return 0;
    }
}
