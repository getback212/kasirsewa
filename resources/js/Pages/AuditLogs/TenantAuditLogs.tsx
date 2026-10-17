import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Calendar, Filter, Search, Clock, User, FileText, Eye, ChevronRight } from 'lucide-react';

interface AuditLog {
    id: number;
    action: string;
    model_type: string;
    model_id: number;
    user: { id: number; name: string; email: string } | null;
    tenant: { id: number; name: string } | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

interface Props {
    logs: {
        data: AuditLog[];
        links: any;
        meta: any;
    };
    actions: string[];
    users: { id: number; name: string; email: string }[];
    filters: {
        action: string | null;
        user_id: string | null;
        date_from: string | null;
        date_to: string | null;
        search: string | null;
    };
}

const actionIcons: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    USER_CREATE: { icon: <User className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-400', label: 'Tambah Pengguna' },
    USER_UPDATE: { icon: <User className="w-4 h-4" />, color: 'bg-yellow-500/20 text-yellow-400', label: 'Edit Pengguna' },
    USER_DELETE: { icon: <User className="w-4 h-4" />, color: 'bg-red-500/20 text-red-400', label: 'Hapus Pengguna' },
    LOGIN: { icon: <Clock className="w-4 h-4" />, color: 'bg-green-500/20 text-green-400', label: 'Login' },
    PAYMENT_CONFIRMED: { icon: <FileText className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400', label: 'Konfirmasi Pembayaran' },
    PAYMENT_REJECTED: { icon: <FileText className="w-4 h-4" />, color: 'bg-rose-500/20 text-rose-400', label: 'Tolak Pembayaran' },
    SUBSCRIPTION_ACTIVATED: { icon: <FileText className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-400', label: 'Aktivasi Langganan' },
};

export default function TenantAuditLogs({ logs, actions, users, filters }: Props) {
    const [filterAction, setFilterAction] = useState(filters.action || '');
    const [filterUserId, setFilterUserId] = useState(filters.user_id || '');
    const [filterDateFrom, setFilterDateFrom] = useState(filters.date_from || '');
    const [filterDateTo, setFilterDateTo] = useState(filters.date_to || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const handleFilter = () => {
        const params = new URLSearchParams();
        if (filterAction) params.append('action', filterAction);
        if (filterUserId) params.append('user_id', filterUserId);
        if (filterDateFrom) params.append('date_from', filterDateFrom);
        if (filterDateTo) params.append('date_to', filterDateTo);
        if (searchQuery) params.append('search', searchQuery);

        router.get(`/tenant-audit-logs?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setFilterAction('');
        setFilterUserId('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setSearchQuery('');
        router.get('/tenant-audit-logs');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionConfig = (action: string) => {
        return actionIcons[action] || { 
            icon: <FileText className="w-4 h-4" />, 
            color: 'bg-slate-500/20 text-slate-400', 
            label: action.replace(/_/g, ' ') 
        };
    };

    return (
        <AppLayout>
            <Head title="Audit Log Toko" />

            <div className="min-h-screen bg-slate-950 text-slate-100">
                <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                    
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">📋 Audit Log Toko</h1>
                        <p className="text-slate-400 text-sm mt-1">Pantau semua aktivitas di toko Anda</p>
                    </div>

                    {/* Filters Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-5 h-5 text-blue-400" />
                            <h2 className="font-bold">Filter & Pencarian</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Pencarian</label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                                    <input
                                        type="text"
                                        placeholder="Aksi atau nama user..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Action Filter */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Tipe Aktivitas</label>
                                <select
                                    value={filterAction}
                                    onChange={(e) => setFilterAction(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition"
                                >
                                    <option value="">Semua Aktivitas</option>
                                    {actions.map(action => (
                                        <option key={action} value={action}>{action}</option>
                                    ))}
                                </select>
                            </div>

                            {/* User Filter */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Pengguna</label>
                                <select
                                    value={filterUserId}
                                    onChange={(e) => setFilterUserId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition"
                                >
                                    <option value="">Semua Pengguna</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date From */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Dari Tanggal</label>
                                <input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition"
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Sampai Tanggal</label>
                                <input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleFilter}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition"
                            >
                                🔍 Terapkan Filter
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
                            >
                                ✕ Hapus Filter
                            </button>
                        </div>
                    </div>

                    {/* Audit Logs Timeline */}
                    <div className="space-y-3">
                        {logs.data.length > 0 ? (
                            logs.data.map((log) => {
                                const config = getActionConfig(log.action);
                                return (
                                    <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition">
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                                                {config.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm">{config.label}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-lg ${config.color}`}>
                                                        {log.action}
                                                    </span>
                                                </div>
                                                
                                                <div className="mt-2 space-y-1 text-xs text-slate-400">
                                                    <p>👤 <span className="text-slate-300">{log.user?.name || 'Sistem'}</span> ({log.user?.email})</p>
                                                    <p>⏰ {formatDate(log.created_at)}</p>
                                                    {log.model_type && (
                                                        <p>📌 {log.model_type} #{log.model_id}</p>
                                                    )}
                                                </div>

                                                {/* Changed Values */}
                                                {log.new_values && Object.keys(log.new_values).length > 0 && (
                                                    <div className="mt-3 p-3 bg-slate-950/50 rounded-lg text-xs space-y-1">
                                                        {Object.entries(log.new_values).map(([key, value]) => (
                                                            <p key={key} className="text-slate-300">
                                                                <span className="text-slate-400">{key}:</span> {String(value)}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Detail Link */}
                                            <a
                                                href={`/tenant-audit-logs/${log.id}`}
                                                className="text-blue-400 hover:text-blue-300 transition flex-shrink-0"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">Belum ada audit log</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {logs.meta?.last_page > 1 && (
                        <div className="flex justify-center gap-2">
                            {logs.links.map((link: any, idx: number) => (
                                <a
                                    key={idx}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold transition ${
                                        link.active
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </AppLayout>
    );
}
