<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Exception;

class DatabaseRestoreCommand extends Command
{
    protected $signature = 'db:restore {filename : Nama file backup .sql.gz yang ada di direktori storage/app/private/backups}';
    protected $description = 'Memulihkan (restore) database PostgreSQL dari file backup terkompresi (.sql.gz)';

    public function handle(): int
    {
        $relative = $this->argument('filename');

        // Tolak path absolut & traversal: file harus berada di dalam
        // direktori backup storage (controller sudah membatasi direktorinya
        // per-role, jadi tenant tidak bisa menunjuk file tenant lain/global).
        if (! is_string($relative) || $relative === ''
            || str_contains($relative, '..')
            || str_starts_with($relative, '/')
            || str_contains($relative, "\0")
        ) {
            $this->error('Path file backup tidak valid.');
            return Command::FAILURE;
        }

        // Resolve lewat Storage facade agar konsisten saat disk di-fake dalam testing.
        $disk = Storage::disk('local');
        if (! $disk->exists($relative)) {
            $this->error("File backup {$relative} tidak ditemukan di direktori backup!");
            return Command::FAILURE;
        }

        $diskRoot = realpath($disk->path('.'));
        $gzFilePath = realpath($disk->path($relative));

        if ($gzFilePath === false || $diskRoot === false
            || ! str_starts_with($gzFilePath, $diskRoot . DIRECTORY_SEPARATOR)
        ) {
            $this->error("File backup {$relative} tidak ditemukan di direktori backup!");
            return Command::FAILURE;
        }

        $this->info("Memulai proses pemulihan (restore) database dari file: {$relative}...");

        $database = escapeshellarg(config('database.connections.pgsql.database'));
        $username = escapeshellarg(config('database.connections.pgsql.username'));
        $password = config('database.connections.pgsql.password');
        $host = escapeshellarg(config('database.connections.pgsql.host'));
        $port = escapeshellarg((string) config('database.connections.pgsql.port'));

        putenv("PGPASSWORD={$password}");

        // Drop schema public first to ensure clean state before restore
        $dropCmd = "psql -h {$host} -p {$port} -U {$username} -d {$database} -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'";
        exec($dropCmd, $dropOutput, $dropReturnCode);

        // Command to decompress and pipe directly into psql
        $cmd = "gunzip -c " . escapeshellarg($gzFilePath) . " | psql -h {$host} -p {$port} -U {$username} -d {$database}";
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
