<?php

namespace App\Http\Controllers\Backup;

use App\Http\Controllers\Controller;
use App\Console\Commands\DatabaseBackupCommand;
use App\Console\Commands\DatabaseRestoreCommand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BackupController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (!$user->hasRole(['SUPER_ADMIN', 'OWNER']) && !$user->hasPermissionTo('view-audit-logs')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola backup database.');
        }

        $files = Storage::disk('local')->files('backups');
        $backups = collect($files)->map(function ($filePath) {
            $filename = basename($filePath);
            $size = Storage::disk('local')->exists($filePath) ? Storage::disk('local')->size($filePath) : 0;
            $lastModified = Storage::disk('local')->exists($filePath) ? Storage::disk('local')->lastModified($filePath) : time();

            return [
                'filename' => $filename,
                'size' => number_format($size / 1024, 2) . ' KB',
                'created_at' => date('Y-m-d H:i:s', $lastModified),
            ];
        })->sortByDesc('created_at')->values()->all();

        return Inertia::render('Backups/Index', [
            'backups' => $backups,
        ]);
    }

    public function runBackup(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasRole(['SUPER_ADMIN', 'OWNER']) && !$user->hasPermissionTo('view-audit-logs')) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuat backup database.');
        }

        Artisan::call(DatabaseBackupCommand::class);
        return back()->with('success', 'Backup database PostgreSQL berhasil dibuat!');
    }

    public function upload(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
            abort(403, 'Hanya Pemilik Toko (Owner) yang memiliki wewenang untuk meng-upload file backup database.');
        }

        $request->validate([
            'backup_file' => ['required', 'file', 'max:102400'], // max 100MB
        ]);

        $file = $request->file('backup_file');
        $originalName = $file->getClientOriginalName();
        
        // Sanitize filename to ensure clean extension
        $cleanName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $originalName);
        if (!str_ends_with($cleanName, '.sql.gz') && !str_ends_with($cleanName, '.sql') && !str_ends_with($cleanName, '.gz')) {
            $cleanName .= '.sql.gz';
        }

        $file->storeAs('backups', $cleanName, 'local');

        return back()->with('success', "File backup database '{$cleanName}' berhasil di-upload! File ini kini siap di-restore.");
    }

    public function restore(Request $request, string $filename): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
            abort(403, 'Hanya Pemilik Toko (Owner) yang memiliki wewenang untuk memulihkan (restore) database.');
        }

        $exitCode = Artisan::call(DatabaseRestoreCommand::class, [
            'filename' => $filename,
        ]);

        if ($exitCode === 0) {
            Artisan::call('cache:clear');
            return back()->with('success', "Database PostgreSQL berhasil dipulihkan (restore) dari file {$filename}!");
        }

        return back()->with('error', "Gagal memulihkan database dari file {$filename}.");
    }

    public function download(Request $request, string $filename)
    {
        $user = $request->user();
        if (!$user->hasRole(['SUPER_ADMIN', 'OWNER']) && !$user->hasPermissionTo('view-audit-logs')) {
            abort(403, 'Anda tidak memiliki hak akses.');
        }

        $filePath = 'backups/' . $filename;
        if (!Storage::disk('local')->exists($filePath)) {
            abort(404, 'File backup tidak ditemukan.');
        }

        return Storage::disk('local')->download($filePath);
    }

    public function delete(Request $request, string $filename): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasRole(['SUPER_ADMIN', 'OWNER']) && !$user->hasPermissionTo('view-audit-logs')) {
            abort(403, 'Anda tidak memiliki hak akses.');
        }

        $filePath = 'backups/' . $filename;
        if (Storage::disk('local')->exists($filePath)) {
            Storage::disk('local')->delete($filePath);
            return back()->with('success', "File backup {$filename} berhasil dihapus!");
        }

        return back()->with('error', "File backup {$filename} tidak ditemukan.");
    }
}
