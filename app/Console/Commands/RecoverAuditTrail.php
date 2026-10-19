<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RecoverAuditTrail extends Command
{
    protected $signature = 'audit:recover {--dry-run : Show what would be recovered without applying}';
    protected $description = 'Recover data from audit trail after unexpected shutdown (power outage, crash)';

    public function handle()
    {
        $this->info('Starting audit trail recovery...');
        $dryRun = $this->option('dry-run');

        // Find loyalty data inconsistencies
        $mismatches = $this->findMismatches();

        if (empty($mismatches)) {
            $this->info('✓ No inconsistencies detected. Database is consistent.');
            return Command::SUCCESS;
        }

        $this->warn('Found ' . count($mismatches) . ' inconsistencies:');
        $this->table(['Model', 'ID', 'Field', 'Current', 'Should Be', 'Source Log'], $mismatches);

        if ($dryRun) {
            $this->info('(--dry-run mode: no changes applied)');
            return Command::SUCCESS;
        }

        if (! $this->confirm('Apply recovery?')) {
            $this->info('Recovery cancelled.');
            return Command::SUCCESS;
        }

        // Apply recovery
        $recovered = 0;
        foreach ($mismatches as $mismatch) {
            try {
                DB::table($this->getTableName($mismatch['Model']))
                    ->where('id', $mismatch['ID'])
                    ->update([$mismatch['Field'] => $mismatch['Should Be']]);

                // Log recovery action
                DB::table('audit_logs')->insert([
                    'company_id' => $this->getCompanyId($mismatch['Model'], $mismatch['ID']),
                    'user_id' => auth()->id() ?? 0,
                    'action' => 'SYSTEM_RECOVERY',
                    'model_type' => $mismatch['Model'],
                    'model_id' => $mismatch['ID'],
                    'old_values' => json_encode([
                        'field' => $mismatch['Field'],
                        'value' => $mismatch['Current'],
                        'reason' => 'Data inconsistency detected',
                    ]),
                    'new_values' => json_encode([
                        'field' => $mismatch['Field'],
                        'value' => $mismatch['Should Be'],
                        'source_log_id' => $mismatch['Source Log'],
                    ]),
                    'ip_address' => request()?->ip() ?? '127.0.0.1',
                    'user_agent' => 'System Recovery',
                    'tenant_id' => $this->getCompanyId($mismatch['Model'], $mismatch['ID']),
                    'visible_to' => 'admin',
                ]);

                $recovered++;
                $this->line("✓ Recovered {$mismatch['Model']} ID {$mismatch['ID']}");
            } catch (\Exception $e) {
                $this->error("✗ Failed to recover {$mismatch['Model']} ID {$mismatch['ID']}: {$e->getMessage()}");
            }
        }

        $this->info("✓ Recovery complete: $recovered items restored");
        return Command::SUCCESS;
    }

    private function findMismatches(): array
    {
        $mismatches = [];
        $companyId = auth()->user()?->company_id ?? 6;

        // Check loyalty points from audit logs
        $customers = DB::table('customers')
            ->where('company_id', $companyId)
            ->get(['id', 'code', 'loyalty_points']);

        foreach ($customers as $customer) {
            // Get last loyalty audit log
            $lastLog = DB::table('audit_logs')
                ->where('model_type', 'Customer')
                ->where('model_id', $customer->id)
                ->where('action', 'like', 'LOYALTY%')
                ->latest('id')
                ->first();

            if ($lastLog) {
                $data = json_decode($lastLog->old_values, true);
                $expectedPoints = $data['new_balance'] ?? null;

                if ($expectedPoints && (float) $customer->loyalty_points !== (float) $expectedPoints) {
                    $mismatches[] = [
                        'Model' => 'Customer',
                        'ID' => $customer->id,
                        'Field' => 'loyalty_points',
                        'Current' => $customer->loyalty_points,
                        'Should Be' => $expectedPoints,
                        'Source Log' => $lastLog->id,
                    ];
                }
            }
        }

        return $mismatches;
    }

    private function getTableName(string $modelType): string
    {
        return match ($modelType) {
            'Customer' => 'customers',
            'Product' => 'products',
            'Sale' => 'sales',
            default => strtolower($modelType) . 's',
        };
    }

    private function getCompanyId(string $modelType, int $modelId): int
    {
        $table = $this->getTableName($modelType);
        return DB::table($table)->find($modelId)?->company_id ?? 6;
    }
}
