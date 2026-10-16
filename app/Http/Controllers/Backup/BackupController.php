<?php

namespace App\Http\Controllers\Backup;

use App\Console\Commands\DatabaseBackupCommand;
use App\Console\Commands\DatabaseRestoreCommand;
use App\Console\Commands\TenantBackupCommand;
use App\Console\Commands\TenantRestoreCommand;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
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

        if ($filename === '' || str_contains($filename, '..') || ! preg_match('/^[a-zA-Z0-9_\-.]+$/', $filename)) {
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
        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER']) && ! $user->hasPermissionTo('view-audit-logs')) {
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
                'size' => number_format($size / 1024, 2).' KB',
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
        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER']) && ! $user->hasPermissionTo('view-audit-logs')) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuat backup database.');
        }

        $backupDir = $this->getBackupDir($request);

        // Super Admin: full dump seluruh database SaaS (semua tenant).
        if ($user->hasRole('SUPER_ADMIN')) {
            $exitCode = Artisan::call(DatabaseBackupCommand::class, ['--path' => $backupDir]);

            return $exitCode === 0
                ? back()->with('success', 'Backup database global SaaS PostgreSQL berhasil dibuat!')
                : back()->with('error', 'Gagal membuat backup database global. Periksa log server.');
        }

        // Owner: backup khusus data tenant sendiri (tanpa data tenant lain).
        // Tenant diambil dari sisi server (tidak pernah dari input user).
        $tenantId = session('active_tenant_id', $user->tenant_id);
        if (! $tenantId || ! Tenant::whereKey($tenantId)->exists()) {
            abort(403, 'Tenant aktif tidak valid.');
        }

        $exitCode = Artisan::call(TenantBackupCommand::class, ['--tenant' => $tenantId, '--path' => $backupDir]);

        return $exitCode === 0
            ? back()->with('success', 'Backup data toko berhasil dibuat! File hanya berisi data milik tenant Anda.')
            : back()->with('error', 'Gagal membuat backup data toko. Periksa log server.');
    }

    public function upload(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER']) && ! $user->hasPermissionTo('view-audit-logs')) {
            abort(403, 'Anda tidak memiliki hak akses untuk meng-upload backup.');
        }

        $request->validate([
            'backup_file' => ['required', 'file', 'max:102400'], // max 100MB
        ]);

        $file = $request->file('backup_file');
        $originalName = $file->getClientOriginalName();

        $cleanName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $originalName);
        if (! str_ends_with($cleanName, '.sql.gz') && ! str_ends_with($cleanName, '.sql') && ! str_ends_with($cleanName, '.gz')) {
            $cleanName .= '.sql.gz';
        }

        $backupDir = $this->getBackupDir($request);
        $file->storeAs($backupDir, $cleanName, 'local');

        // Owner hanya boleh meng-upload file backup VALID milik tenant-nya
        // sendiri (nama, header, dan seluruh isi dicek). File racikan/asing
        // langsung dihapus dan ditolak.
        if (! $user->hasRole('SUPER_ADMIN')) {
            $tenantId = session('active_tenant_id', $user->tenant_id);
            if (! $tenantId || ! Tenant::whereKey($tenantId)->exists()) {
                abort(403, 'Tenant aktif tidak valid.');
            }

            $disk = Storage::disk('local');
            $storedPath = "{$backupDir}/{$cleanName}";
            $error = $this->validateTenantUpload($disk->path($storedPath), (int) $tenantId);
            if ($error !== null) {
                $disk->delete($storedPath);

                return back()->with('error', "Upload ditolak: {$error}");
            }
        }

        return back()->with('success', "File backup database '{$cleanName}' berhasil di-upload!");
    }

    /**
     * Validasi file upload milik Owner: pola nama + seluruh isi harus milik
     * tenant tersebut. Mengembalikan pesan error atau null bila valid.
     */
    protected function validateTenantUpload(string $fullPath, int $tenantId): ?string
    {
        if (! preg_match('/tenant_'.$tenantId.'_backup_.+\.sql(\.gz)?$/', basename($fullPath))) {
            return 'nama file harus pola backup tenant (tenant_'.$tenantId.'_backup_*.sql.gz).';
        }

        try {
            $parsed = TenantRestoreCommand::parseFile($fullPath);
        } catch (\RuntimeException $e) {
            return $e->getMessage();
        }

        return TenantRestoreCommand::validateBelongsToTenant($parsed, $tenantId);
    }

    public function restore(Request $request, string $filename): RedirectResponse
    {
        $user = $request->user();
        $filename = $this->safeFilename($filename);
        $backupDir = $this->getBackupDir($request);
        $filePath = "{$backupDir}/{$filename}";

        // Super Admin: restore global menimpa seluruh database SaaS.
        if ($user->hasRole('SUPER_ADMIN')) {
            $exitCode = Artisan::call(DatabaseRestoreCommand::class, [
                'filename' => $filePath,
            ]);

            if ($exitCode === 0) {
                Artisan::call('cache:clear');

                return back()->with('success', "Database PostgreSQL berhasil dipulihkan (restore) dari file {$filename}!");
            }

            return back()->with('error', "Gagal memulihkan database dari file {$filename}.");
        }

        // Owner: restore hanya dari file backup tenant sendiri, dan hanya
        // baris milik tenant-nya yang dihapus/ditulis ulang. Tenant diambil
        // dari sisi server (tidak pernah dari input user).
        if (! $user->hasRole('OWNER') && ! $user->hasPermissionTo('view-audit-logs')) {
            abort(403, 'Anda tidak memiliki hak akses untuk memulihkan data.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        if (! $tenantId || ! Tenant::whereKey($tenantId)->exists()) {
            abort(403, 'Tenant aktif tidak valid.');
        }

        $exitCode = Artisan::call(TenantRestoreCommand::class, [
            'filename' => $filePath,
            '--tenant' => $tenantId,
        ]);

        return $exitCode === 0
            ? back()->with('success', "Data toko berhasil dipulihkan dari file {$filename}! Hanya data milik tenant Anda yang diproses.")
            : back()->with('error', "Gagal memulihkan data toko dari file {$filename}. Pastikan file adalah backup tenant yang valid.");
    }

    public function download(Request $request, string $filename)
    {
        $user = $request->user();
        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER']) && ! $user->hasPermissionTo('view-audit-logs')) {
            abort(403, 'Anda tidak memiliki hak akses.');
        }

        $filename = $this->safeFilename($filename);
        $backupDir = $this->getBackupDir($request);
        $filePath = "{$backupDir}/{$filename}";

        if (! Storage::disk('local')->exists($filePath)) {
            abort(404, 'File backup tidak ditemukan.');
        }

        return Storage::disk('local')->download($filePath);
    }

    public function delete(Request $request, string $filename): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER']) && ! $user->hasPermissionTo('view-audit-logs')) {
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
