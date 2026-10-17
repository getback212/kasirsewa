import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Filter, Search, Building2, AlertCircle, Eye, ChevronRight } from 'lucide-react';

interface AuditLog {
    id: number;
    action: string;
    model_type: string;
    model_id: number;
    user: { id: number; name: string; email: string } | null;
    tenant: { id: number; name: string; slug: string } | null;
    impersonated_by_user: { id: number; name: string; email: string } | null;
    visible_to: string;
    created_at: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    logs: {
        data: AuditLog[];
        links: any;
        meta: any;
    };
    actions: string[];
    tenants: Tenant[];
    filters: {
        tenant_ids: string[] | null;
        action: string | null;
        user_id: string | null;
        date_from: string | null;
        date_to: string | null;
        search: string | null;
        show_impersonation: string | null;
    };
}

export default function SuperAdminAuditLogs({ logs, actions, tenants, filters }: Props) {
    const [filterTenantIds, setFilterTenantIds] = useState<string[]>(
        (filters.tenant_ids as string[]) || []
    );
    const [filterAction, setFilterAction] = useState(filters.action || '');
    const [filterUserId, setFilterUserId] = useState(filters.user_id || '');
    const [filterDateFrom, setFilterDateFrom] = useState(filters.date_from || '');
    const [filterDateTo, setFilterDateTo] = useState(filters.date_to || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [showImpersonation, setShowImpersonation] = useState(filters.show_impersonation || '0');

    const toggleTenant = (tenantId: string) => {
        setFilterTenantIds(prev =>
            prev.includes(tenantId)
                ? prev.filter(id => id !== tenantId)
                : [...prev, tenantId]
        );
    };

    const handleFilter = () => {
        const params = new URLSearchParams();
        if (filterTenantIds.length > 0) {
            filterTenantIds.forEach(id => params.append('tenant_ids[]', id));
        }
        if (filterAction) params.append('action', filterAction);
        if (filterUserId) params.append('user_id', filterUserId);
        if (filterDateFrom) params.append('date_from', filterDateFrom);
        if (filterDateTo) params.append('date_to', filterDateTo);
        if (searchQuery) params.append('search', searchQuery);
        if (showImpersonation !== '0') params.append('show_impersonation', showImpersonation);

        router.get(`/admin/audit-logs?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setFilterTenantIds([]);
        setFilterAction('');
        setFilterUserId('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setSearchQuery('');
        setShowImpersonation('0');
        router.get('/admin/audit-logs');
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

    const getActionColor = (action: string): string => {
        if (action.includes('CREATE') || action.includes('ACTIVATED')) return 'text-blue-400';
        if (action.includes('DELETE') || action.includes('REJECTED')) return 'text-red-400';
        if (action.includes('UPDATE')) return 'text-yellow-400';
        if (action.includes('LOGIN')) return 'text-green-400';
        return 'text-slate-400';
    };

    return (
        <AppLayout>
            <Head title="Audit Log - Super Admin" />

            <div className="min-h-screen bg-slate-950 text-slate-100">
                <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
                    
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">📊 Audit Log - Super Admin</h1>
                        <p className="text-slate-400 text-sm mt-1">Monitor semua aktivitas di semua tenant + impersonasi</p>
                    </div>

                    {/* Filters Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-5 h-5 text-blue-400" />
                            <h2 className="font-bold">Filter & Pencarian</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Pencarian</label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                                    <input
                                        type="text"
                                        placeholder="Aksi atau nama..."
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

                            {/* Show Impersonation */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Tampilkan</label>
                                <select
                                    value={showImpersonation}
                                    onChange={(e) => setShowImpersonation(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition"
                                >
                                    <option value="0">Semua Log</option>
                                    <option value="1">Hanya Impersonasi</option>
                                </select>
                            </div>
                        </div>

                        {/* Tenant Multi-Select */}
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-3">Filter Tenant</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                {tenants.map(tenant => (
                                    <button
                                        key={tenant.id}
                                        onClick={() => toggleTenant(String(tenant.id))}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                                            filterTenantIds.includes(String(tenant.id))
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        <Building2 className="w-3 h-3" />
                                        {tenant.name}
                                    </button>
                                ))}
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

                    {/* Audit Logs Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        {logs.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-800 border-b border-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold">Waktu</th>
                                            <th className="px-4 py-3 text-left font-bold">Aksi</th>
                                            <th className="px-4 py-3 text-left font-bold">Tenant</th>
                                            <th className="px-4 py-3 text-left font-bold">User</th>
                                            <th className="px-4 py-3 text-left font-bold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {logs.data.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-800/50 transition">
                                                <td className="px-4 py-3 text-slate-300">
                                                    {formatDate(log.created_at)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`font-bold ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-300">
                                                    {log.tenant ? (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="w-3 h-3 text-slate-500" />
                                                            {log.tenant.name}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500">Super Admin</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-300">
                                                    {log.impersonated_by_user ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <AlertCircle className="w-3 h-3 text-yellow-400" />
                                                                <span className="text-yellow-400 font-bold">Impersonasi</span>
                                                            </div>
                                                            <p className="text-slate-400 ml-5">
                                                                Oleh: {log.impersonated_by_user.name}
                                                            </p>
                                                            <p className="text-slate-400 ml-5">
                                                                Sebagai: {log.user?.name}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-slate-300">{log.user?.name || '-'}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        log.visible_to === 'super_admin_only'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-green-500/20 text-green-400'
                                                    }`}>
                                                        {log.visible_to === 'super_admin_only' ? '🔒 Admin' : '👁 Tenant'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400">
                                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Belum ada audit log</p>
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
