<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Exception;

class DatabaseRestoreCommand extends Command
{
    protected $signature = 'db:restore {filename : Nama file backup .sql.gz yang ada di direktori storage/app/private/backups}';
    protected $description = 'Memulihkan (restore) database PostgreSQL dari file backup terkompresi (.sql.gz)';

    public function handle(): int
    {
        $filename = $this->argument('filename');
        $backupDir = storage_path('app/private/backups');
        $gzFilePath = "{$backupDir}/{$filename}";

        if (! file_exists($gzFilePath)) {
            // Check without .gz or in storage/app/backups
            if (file_exists("{$backupDir}/{$filename}.sql.gz")) {
                $gzFilePath = "{$backupDir}/{$filename}.sql.gz";
            } else {
                $this->error("File backup {$filename} tidak ditemukan di direktori backup!");
                return Command::FAILURE;
            }
        }

        $this->info("Memulai proses pemulihan (restore) database dari file: {$filename}...");

        $database = config('database.connections.pgsql.database');
        $username = config('database.connections.pgsql.username');
        $password = config('database.connections.pgsql.password');
        $host = config('database.connections.pgsql.host');
        $port = config('database.connections.pgsql.port');

        putenv("PGPASSWORD={$password}");

        // Drop schema public first to ensure clean state before restore
        $dropCmd = "psql -h {$host} -p {$port} -U {$username} -d {$database} -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'";
        exec($dropCmd, $dropOutput, $dropReturnCode);

        // Command to decompress and pipe directly into psql
        $cmd = "gunzip -c {$gzFilePath} | psql -h {$host} -p {$port} -U {$username} -d {$database}";
        exec($cmd, $output, $returnCode);

        putenv('PGPASSWORD');

        if ($returnCode !== 0) {
            $this->error('Gagal memulihkan (restore) database PostgreSQL!');
            return Command::FAILURE;
        }

        $this->info('Database PostgreSQL berhasil dipulihkan (restore) 100%!');
        return Command::SUCCESS;
    }
}
