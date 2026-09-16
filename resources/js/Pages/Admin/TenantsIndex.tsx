import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Building2, Plus, Search, Edit, CheckCircle2, AlertCircle, Shield, CreditCard, Users, Store, ExternalLink } from 'lucide-react';
import type { PageProps } from '@/Types';

interface TenantItem {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    domain: string | null;
    status: 'active' | 'past_due' | 'grace_period' | 'suspended' | 'expired' | 'cancelled';
    created_at: string;
    owner?: { name: string; email: string };
    subscription?: {
        status: string;
        expires_at: string;
        plan?: { name: string; monthly_price: number };
    };
    stores?: any[];
}

interface PlanItem {
    id: number;
    name: string;
    slug: string;
    monthly_price: number;
    max_users: number;
    max_stores: number;
}

interface TenantsPageProps extends PageProps {
    tenants: {
        data: TenantItem[];
        links: any[];
        total: number;
    };
    plans: PlanItem[];
    filters: { search?: string };
}

export default function TenantsIndex({ tenants, plans, filters }: TenantsPageProps) {
    const { flash } = usePage<TenantsPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);

    const createForm = useForm({
        name: '',
        domain: '',
        plan_id: plans.length > 0 ? String(plans[0].id) : '',
        owner_name: '',
        owner_email: '',
        owner_password: '',
    });

    const editForm = useForm({
        name: '',
        domain: '',
        status: 'active',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/tenants', { search }, { preserveState: true });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/tenants', {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const openEditModal = (t: TenantItem) => {
        setEditingTenant(t);
        editForm.setData({
            name: t.name,
            domain: t.domain || '',
            status: t.status,
        });
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenant) return;

        editForm.put(`/admin/tenants/${editingTenant.id}`, {
            onSuccess: () => setEditingTenant(null),
        });
    };

    return (
        <AppLayout title="Kelola Tenant SaaS">
            <Head title="Manajemen Tenant & Pelanggan SaaS - Super Admin" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-400" /> Manajemen Tenant & Pelanggan SaaS
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Kelola registrasi tenant baru, kontrol akses langganan, dan pemantauan status toko multi-tenant.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Daftarkan Tenant Baru</span>
                    </button>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* SEARCH FILTER BAR */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan nama tenant, slug, atau domain..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl">
                        Cari
                    </button>
                </form>

                {/* TENANTS TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">NAMA TENANT / SLUG</th>
                                    <th className="p-4">PEMILIK / EMAIL OWNER</th>
                                    <th className="p-4">PAKET SAAS</th>
                                    <th className="p-4">OUTLETS</th>
                                    <th className="p-4">STATUS</th>
                                    <th className="p-4 text-right">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {tenants.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                                            Belum ada tenant SaaS terdaftar.
                                        </td>
                                    </tr>
                                ) : (
                                    tenants.data.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-800/40">
                                            <td className="p-4">
                                                <div className="font-bold text-white text-xs font-sans">{t.name}</div>
                                                <div className="text-slate-500 text-[10px]">{t.slug} • {t.domain || 'no domain'}</div>
                                            </td>
                                            <td className="p-4 font-sans">
                                                <div className="font-semibold text-slate-200">{t.owner?.name || 'Owner N/A'}</div>
                                                <div className="text-slate-400 text-[10px]">{t.owner?.email || '-'}</div>
                                            </td>
                                            <td className="p-4 font-sans">
                                                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-bold">
                                                    {t.subscription?.plan?.name || 'Basic Plan'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-300 font-bold">
                                                {t.stores?.length || 1} Outlets
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                    t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-sans">
                                                <button
                                                    onClick={() => openEditModal(t)}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Edit className="w-3.5 h-3.5 text-blue-400" /> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL TAMBAH TENANT BARU */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-400" /> pDaftarkan Tenant Toko Baru
                                </h3>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Nama Perusahaan / Tenant</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Toko Sembako Jaya"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Subdomain (Opsional)</label>
                                        <input
                                            type="text"
                                            value={createForm.data.domain}
                                            onChange={(e) => createForm.setData('domain', e.target.value)}
                                            placeholder="toko.kasirsewa.com"
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Paket Berlangganan</label>
                                        <select
                                            value={createForm.data.plan_id}
                                            onChange={(e) => createForm.setData('plan_id', e.target.value)}
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                        >
                                            {plans.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name} (Rp {Number(p.monthly_price).toLocaleString('id-ID')}/bln)</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-800 space-y-3">
                                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">Informasi Akun Owner Pertama</span>
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Nama Owner</label>
                                        <input
                                            type="text"
                                            required
                                            value={createForm.data.owner_name}
                                            onChange={(e) => createForm.setData('owner_name', e.target.value)}
                                            placeholder="Budi Owner"
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-slate-400 font-semibold mb-1">Email Owner</label>
                                            <input
                                                type="email"
                                                required
                                                value={createForm.data.owner_email}
                                                onChange={(e) => createForm.setData('owner_email', e.target.value)}
                                                placeholder="owner@toko.com"
                                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 font-semibold mb-1">Password Owner</label>
                                            <input
                                                type="password"
                                                required
                                                value={createForm.data.owner_password}
                                                onChange={(e) => createForm.setData('owner_password', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-3">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl">Batal</button>
                                    <button type="submit" disabled={createForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg">
                                        {createForm.processing ? '⏳ Menyimpan...' : 'Simpan Tenant Baru'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL EDIT TENANT */}
                {editingTenant && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <Edit className="w-5 h-5 text-blue-400" /> Edit Status Tenant #{editingTenant.id}
                                </h3>
                                <button type="button" onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <form onSubmit={handleUpdateSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Nama Tenant</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Status Keaktifan Tenant</label>
                                    <select
                                        value={editForm.data.status}
                                        onChange={(e) => editForm.setData('status', e.target.value as any)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    >
                                        <option value="active">Active (Aktif Berlangganan)</option>
                                        <option value="past_due">Past Due (Jatuh Tempo)</option>
                                        <option value="grace_period">Grace Period (Masa Tenggang)</option>
                                        <option value="suspended">Suspended (Ditangguhkan)</option>
                                        <option value="expired">Expired (Berakhir)</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-3">
                                    <button type="button" onClick={() => setEditingTenant(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl">Batal</button>
                                    <button type="submit" disabled={editForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg">
                                        {editForm.processing ? '⏳ Menyimpan...' : 'Simpan Perubahan Tenant'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
