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
    protected function safeFilename(string $filename): string
    {
        $filename = basename($filename);

        if ($filename === '' || str_contains($filename, '..') || !preg_match('/^[a-zA-Z0-9_\-.]+$/', $filename)) {
            abort(400, 'Nama file backup tidak valid.');
        }

        return $filename;
    }

    protected function getBackupDir(Request $request): string
    {
        $user = $request->user();
        if ($user->hasRole('SUPER_ADMIN')) {
            return 'backups/saas_global';
        }
        $tenantId = session('active_tenant_id', $user->tenant_id ?? 'common');
        return "backups/tenants/tenant_{$tenantId}";
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        if (!$user->hasRole(['SUPER_ADMIN', 'OWNER']) && !$user->hasPermissionTo('view-audit-logs')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola backup database.');
        }

        $backupDir = $this->getBackupDir($request);
        $files = Storage::disk('local')->files($backupDir);

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
            'isSuperAdmin' => $user->hasRole('SUPER_ADMIN'),
        ]);
    }

    public function runBackup(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasRole(['SUPER_ADMIN', 'OWNER']) && !$user->hasPermissionTo('view-audit-logs')) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuat backup database.');
        }

        $backupDir = $this->getBackupDir($request);
        Artisan::call(DatabaseBackupCommand::class, ['--path' => $backupDir]);

        return back()->with('success', $user->hasRole('SUPER_ADMIN') 
            ? 'Backup database global SaaS PostgreSQL berhasil dibuat!' 
            : 'Backup data toko PostgreSQL berhasil dibuat!'
        );
    }

    public function upload(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
            abort(403, 'Hanya Pemilik Toko (Owner) atau Super Admin yang memiliki wewenang meng-upload backup.');
        }

        $request->validate([
            'backup_file' => ['required', 'file', 'max:102400'], // max 100MB
        ]);

        $file = $request->file('backup_file');
        $originalName = $file->getClientOriginalName();
        
        $cleanName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $originalName);
        if (!str_ends_with($cleanName, '.sql.gz') && !str_ends_with($cleanName, '.sql') && !str_ends_with($cleanName, '.gz')) {
            $cleanName .= '.sql.gz';
        }

        $backupDir = $this->getBackupDir($request);
        $file->storeAs($backupDir, $cleanName, 'local');

        return back()->with('success', "File backup database '{$cleanName}' berhasil di-upload!");
    }

    public function restore(Request $request, string $filename): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasRole(['SUPER_ADMIN', 'OWNER'])) {
            abort(403, 'Hanya Pemilik Toko (Owner) atau Super Admin yang berwenang memulihkan database.');
        }

        $filename = $this->safeFilename($filename);
        $backupDir = $this->getBackupDir($request);
        $filePath = "{$backupDir}/{$filename}";

        $exitCode = Artisan::call(DatabaseRestoreCommand::class, [
            'filename' => $filePath,
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

        $filename = $this->safeFilename($filename);
        $backupDir = $this->getBackupDir($request);
        $filePath = "{$backupDir}/{$filename}";

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

        $filename = $this->safeFilename($filename);
        $backupDir = $this->getBackupDir($request);
        $filePath = "{$backupDir}/{$filename}";

        if (Storage::disk('local')->exists($filePath)) {
            Storage::disk('local')->delete($filePath);
            return back()->with('success', "File backup {$filename} berhasil dihapus!");
        }

        return back()->with('error', "File backup {$filename} tidak ditemukan.");
    }
}
