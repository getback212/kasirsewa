import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ShieldCheck, Search, Eye, Terminal } from 'lucide-react';
import type { PageProps } from '@/Types';

interface AuditLogItem {
    id: number;
    action: string;
    model_type?: string;
    model_id?: number;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    user?: { name: string; email: string };
}

interface AuditLogsPageProps extends PageProps {
    logs: {
        data: AuditLogItem[];
        links: any[];
        total: number;
    };
    filters: { search?: string };
}

export default function AuditLogsIndex({ logs, filters }: AuditLogsPageProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/audit-logs', { search }, { preserveState: true });
    };

    return (
        <AppLayout title="Audit Logs">
            <Head title="Audit Logs System & Keamanan - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-amber-400" /> Audit Logs System & Keamanan Server
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Pencatatan otomatis setiap aktivitas sensitif (login/logout, pembuatan user, transaksi, IP Address, User Agent).
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="px-3.5 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold">
                            {logs.total} Total Audit Records
                        </span>
                        {auth.roles.includes('SUPER_ADMIN') && logs.total > 0 && (
                            <button
                                onClick={() => {
                                    if (confirm('⚠️ Apakah Anda yakin ingin membersihkan SELURUH riwayat audit log sistem?')) {
                                        router.delete('/audit-logs/clear');
                                    }
                                }}
                                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                                🧹 Bersihkan Semua Log
                            </button>
                        )}
                    </div>
                </div>

                {/* SEARCH TOOLBAR */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari Aktivitas Audit / Nama Staff / IP Address..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                        />
                    </form>
                </div>

                {/* AUDIT LOGS TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">WAKTU AUDIT</th>
                                    <th className="p-4">STAFF LOGGED</th>
                                    <th className="p-4">JENIS AKTIVITAS</th>
                                    <th className="p-4">MODEL / ENTITAS</th>
                                    <th className="p-4">IP ADDRESS</th>
                                    <th className="p-4 text-right">RINCIAN JSON</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                                            Belum ada log aktivitas audit recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-4 text-slate-400">
                                                {new Date(log.created_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-4 font-sans font-bold text-white">
                                                {log.user?.name || 'System / Guest'}
                                            </td>
                                            <td className="p-4 font-sans">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                                    log.action.includes('LOGIN')
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                        : log.action.includes('LOGOUT')
                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-400">
                                                {log.model_type ? `${log.model_type} #${log.model_id || ''}` : '-'}
                                            </td>
                                            <td className="p-4 text-slate-400">{log.ip_address}</td>
                                            <td className="p-4 text-right font-sans space-x-1.5">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Detail JSON
                                                </button>
                                                {auth.roles.includes('SUPER_ADMIN') && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`⚠️ Hapus baris audit log #${log.id}?`)) {
                                                                router.delete(`/audit-logs/${log.id}`);
                                                            }
                                                        }}
                                                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold cursor-pointer"
                                                        title="Hapus baris log ini"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL JSON DETAIL VIEWER */}
                {selectedLog && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-amber-400" /> Detail Audit Entry #{selectedLog.id}
                                </h3>
                                <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div className="space-y-3 font-mono">
                                <div>
                                    <span className="text-slate-400 block font-sans font-semibold mb-1">User Agent Header:</span>
                                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-300 break-all">
                                        {selectedLog.user_agent}
                                    </div>
                                </div>

                                {selectedLog.old_values && (
                                    <div>
                                        <span className="text-rose-400 block font-sans font-semibold mb-1">Nilai Lama (Old Values):</span>
                                        <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-rose-300 overflow-x-auto">
                                            {JSON.stringify(selectedLog.old_values, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {selectedLog.new_values && (
                                    <div>
                                        <span className="text-emerald-400 block font-sans font-semibold mb-1">Nilai Baru (New Values):</span>
                                        <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-emerald-300 overflow-x-auto">
                                            {JSON.stringify(selectedLog.new_values, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
