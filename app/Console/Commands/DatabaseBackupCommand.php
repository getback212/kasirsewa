<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Exception;

class DatabaseBackupCommand extends Command
{
    protected $signature = 'db:backup {--path= : Subdirektori penyimpanan file backup}';
    protected $description = 'Membuat backup database PostgreSQL terkompresi (.sql.gz) secara otomatis';

    public function handle(): int
    {
        $this->info('Starting PostgreSQL database backup process...');

        $database = config('database.connections.pgsql.database');
        $username = config('database.connections.pgsql.username');
        $password = config('database.connections.pgsql.password');
        $host = config('database.connections.pgsql.host');
        $port = config('database.connections.pgsql.port');

        $customPath = $this->option('path') ?: 'backups';
        $backupDir = storage_path("app/private/{$customPath}");
        if (! file_exists($backupDir)) {
            mkdir($backupDir, 0777, true);
        }

        // Migrate any old backup files from storage/app/backups to storage/app/private/backups
        $oldDir = storage_path('app/backups');
        if (file_exists($oldDir)) {
            foreach (glob("{$oldDir}/*.sql.gz") as $oldFile) {
                $targetFile = $backupDir . '/' . basename($oldFile);
                if (!file_exists($targetFile)) {
                    rename($oldFile, $targetFile);
                }
            }
        }

        $timestamp = now()->format('Y-m-d_H-i-s');
        $filename = "pos_backup_{$timestamp}.sql";
        $filePath = "{$backupDir}/{$filename}";
        $gzFilePath = "{$filePath}.gz";

        putenv("PGPASSWORD={$password}");

        $cmd = "pg_dump -h {$host} -p {$port} -U {$username} -d {$database} -F p -f {$filePath}";

        exec($cmd, $output, $returnCode);

        putenv('PGPASSWORD');

        if ($returnCode !== 0 || ! file_exists($filePath)) {
            $this->error('Gagal membuat backup database PostgreSQL!');
            return Command::FAILURE;
        }

        // Compress SQL file to .gz
        exec("gzip -f {$filePath}");

        if (file_exists($gzFilePath)) {
            $fileSize = number_format(filesize($gzFilePath) / 1024, 2);
            $this->info("Backup PostgreSQL berhasil dibuat: {$filename}.gz ({$fileSize} KB)");

            // Clean up backups older than 30 days
            $files = glob("{$backupDir}/*.sql.gz");
            $expirationTime = now()->subDays(30)->timestamp;

            foreach ($files as $file) {
                if (filemtime($file) < $expirationTime) {
                    unlink($file);
                }
            }

            return Command::SUCCESS;
        }

        $this->error('Gagal mengompresi file backup PostgreSQL!');
        return Command::FAILURE;
    }
}
