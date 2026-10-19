<?php

namespace App\Services\Monitoring;

use Illuminate\Support\Facades\DB;

class HealthMonitor
{
    public function checkDatabase(): array
    {
        try {
            $start = microtime(true);
            DB::connection()->getPdo()->query('SELECT 1');
            $duration = (microtime(true) - $start) * 1000;

            DB::table('service_status')->updateOrInsert(
                ['company_id' => auth()->user()?->company_id ?? 6, 'service_name' => 'database'],
                ['status' => 'up', 'last_check' => now(), 'uptime_percent' => 100]
            );

            return ['status' => 'up', 'response_time_ms' => round($duration, 2)];
        } catch (\Exception $e) {
            DB::table('service_status')->updateOrInsert(
                ['company_id' => auth()->user()?->company_id ?? 6, 'service_name' => 'database'],
                ['status' => 'down', 'last_check' => now(), 'error_message' => $e->getMessage()]
            );

            return ['status' => 'down', 'error' => $e->getMessage()];
        }
    }

    public function checkRedis(): array
    {
        try {
            $start = microtime(true);
            $redis = app('redis.connection');
            $redis->ping();
            $duration = (microtime(true) - $start) * 1000;

            DB::table('service_status')->updateOrInsert(
                ['company_id' => auth()->user()?->company_id ?? 6, 'service_name' => 'redis'],
                ['status' => 'up', 'last_check' => now(), 'uptime_percent' => 100]
            );

            return ['status' => 'up', 'response_time_ms' => round($duration, 2)];
        } catch (\Exception $e) {
            DB::table('service_status')->updateOrInsert(
                ['company_id' => auth()->user()?->company_id ?? 6, 'service_name' => 'redis'],
                ['status' => 'down', 'last_check' => now(), 'error_message' => $e->getMessage()]
            );

            return ['status' => 'down', 'error' => $e->getMessage()];
        }
    }

    public function checkTunnel(): array
    {
        try {
            $start = microtime(true);
            $response = \Illuminate\Support\Facades\Http::timeout(5)->get('https://superbackend.my.id/health');
            $duration = (microtime(true) - $start) * 1000;

            $status = $response->successful() ? 'up' : 'degraded';

            DB::table('service_status')->updateOrInsert(
                ['company_id' => auth()->user()?->company_id ?? 6, 'service_name' => 'tunnel'],
                ['status' => $status, 'last_check' => now(), 'uptime_percent' => 100]
            );

            return ['status' => $status, 'response_time_ms' => round($duration, 2), 'status_code' => $response->status()];
        } catch (\Exception $e) {
            DB::table('service_status')->updateOrInsert(
                ['company_id' => auth()->user()?->company_id ?? 6, 'service_name' => 'tunnel'],
                ['status' => 'down', 'last_check' => now(), 'error_message' => $e->getMessage()]
            );

            return ['status' => 'down', 'error' => $e->getMessage()];
        }
    }

    public function getAllStatus(): array
    {
        return [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'tunnel' => $this->checkTunnel(),
        ];
    }

    public function logQuery(string $queryType, string $tableName, float $durationMs, ?int $rowsAffected = null): void
    {
        DB::table('query_logs')->insert([
            'company_id' => auth()->user()?->company_id ?? 6,
            'query_type' => $queryType,
            'table_name' => $tableName,
            'duration_ms' => $durationMs,
            'rows_affected' => $rowsAffected,
            'user_id' => auth()->id(),
            'ip_address' => request()->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function getSlowQueries(int $thresholdMs = 100, int $limit = 20): array
    {
        return DB::table('query_logs')
            ->where('company_id', auth()->user()?->company_id ?? 6)
            ->where('duration_ms', '>', $thresholdMs)
            ->latest('duration_ms')
            ->limit($limit)
            ->get()
            ->toArray();
    }
}
