<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class DatabaseBackupCommand extends Command
{
    protected $signature = 'db:backup {--path= : Subdirektori penyimpanan file backup}';

    protected $description = 'Membuat backup database PostgreSQL terkompresi (.sql.gz) secara otomatis';

    public function handle(): int
    {
        $this->info('Starting PostgreSQL database backup process...');

        $database = escapeshellarg(config('database.connections.pgsql.database'));
        $username = escapeshellarg(config('database.connections.pgsql.username'));
        $password = config('database.connections.pgsql.password');
        $host = escapeshellarg(config('database.connections.pgsql.host'));
        $port = escapeshellarg((string) config('database.connections.pgsql.port'));

        $customPath = preg_replace('/[^a-zA-Z0-9_\/-]/', '', $this->option('path')) ?: 'backups';
        // Pakai Storage facade agar konsisten dengan command backup lain
        // dan bisa di-fake saat testing.
        $disk = Storage::disk('local');
        if (! $disk->exists($customPath) && ! $disk->makeDirectory($customPath)) {
            $this->error('Gagal membuat direktori backup (permission ditolak). Hubungi administrator server.');

            return Command::FAILURE;
        }
        // Pastikan direktori bisa dibaca user web meskipun command dijalankan
        // sebagai root (mis. via scheduler/queue container).
        @chmod($disk->path($customPath), 0755);
        $backupDir = $disk->path($customPath);

        $oldDir = storage_path('app/backups');
        if (file_exists($oldDir)) {
            foreach (glob("{$oldDir}/*.sql.gz") as $oldFile) {
                $targetFile = $backupDir.'/'.basename($oldFile);
                if (! file_exists($targetFile)) {
                    @rename($oldFile, $targetFile);
                }
            }
        }

        $timestamp = now()->format('Y-m-d_H-i-s');
        $filename = "pos_backup_{$timestamp}.sql";
        $filePath = $backupDir.'/'.$filename;
        $gzFilePath = $filePath.'.gz';

        putenv("PGPASSWORD={$password}");

        $cmd = "pg_dump -h {$host} -p {$port} -U {$username} -d {$database} -F p -f ".escapeshellarg($filePath);
        exec($cmd, $output, $returnCode);

        putenv('PGPASSWORD');

        if ($returnCode !== 0 || ! file_exists($filePath)) {
            $this->error('Gagal membuat backup database PostgreSQL!');

            return Command::FAILURE;
        }

        exec('gzip -f '.escapeshellarg($filePath), $output, $returnCode);

        if ($returnCode !== 0 || ! file_exists($gzFilePath)) {
            $this->error('Gagal mengompresi file backup PostgreSQL!');

            return Command::FAILURE;
        }
        @chmod($gzFilePath, 0644);

        $fileSize = number_format(filesize($gzFilePath) / 1024, 2);
        $this->info("Backup PostgreSQL berhasil dibuat: {$filename}.gz ({$fileSize} KB)");

        $files = $disk->files($customPath);
        $expirationTime = now()->subDays(30)->timestamp;
        foreach ($files as $file) {
            if (! str_ends_with($file, '.sql.gz')) {
                continue;
            }
            if ($disk->lastModified($file) < $expirationTime) {
                $disk->delete($file);
            }
        }

        return Command::SUCCESS;
    }
}
