<?php

namespace App\Http\Controllers\Audit;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER']) && ! $user->hasPermissionTo('view-audit-logs')) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat audit log sistem.');
        }

        $query = AuditLog::with('user:id,name,email');

        // Scoping: non-SUPER_ADMIN hanya melihat log milik company sendiri
        if (! $user->hasRole('SUPER_ADMIN')) {
            $companyId = $user->company_id;
            if (! $companyId) {
                abort(403, 'Akun Anda belum terhubung ke company manapun.');
            }
            $query->where('company_id', $companyId);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('action', 'ILIKE', "%{$search}%")
                    ->orWhere('ip_address', 'ILIKE', "%{$search}%")
                    ->orWhereHas('user', function ($uQuery) use ($search) {
                        $uQuery->where('name', 'ILIKE', "%{$search}%");
                    });
            });
        }

        $logs = $query->latest()->paginate(25)->withQueryString();

        return Inertia::render('AuditLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['search']),
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $user = $request->user();
        $query = AuditLog::query();
        if (! $user->hasRole('SUPER_ADMIN')) {
            $companyId = $user->company_id;
            if (! $companyId) {
                abort(403, 'Akun Anda belum terhubung ke company manapun.');
            }
            $query->where('company_id', $companyId);
        }
        $log = $query->findOrFail($id);
        $log->delete();

        return redirect()->back()->with('success', "Baris audit log #{$id} berhasil dihapus/disembunyikan.");
    }

    public function clear(Request $request)
    {
        $user = $request->user();
        if (! $user->hasRole('SUPER_ADMIN')) {
            abort(403, 'Hanya Super Admin yang berwenang membersihkan audit log.');
        }

        AuditLog::query()->delete();

        return redirect()->back()->with('success', 'Seluruh riwayat audit log sistem berhasil dibersihkan.');
    }
}
