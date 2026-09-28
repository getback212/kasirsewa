import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Building2, Plus, Search, Edit, CheckCircle2, AlertCircle, Shield, Store, Users, Trash2 } from 'lucide-react';
import type { PageProps } from '@/Types';

interface TenantItem {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    status: 'active' | 'past_due' | 'grace_period' | 'suspended' | 'expired' | 'cancelled';
    created_at: string;
    owner?: {
        name: string;
        email: string;
    };
    subscription?: {
        status: string;
        plan?: {
            name: string;
        };
    };
    stores?: any[];
}

interface PlanOption {
    id: number;
    name: string;
    monthly_price: number;
}

interface TenantsPageProps extends PageProps {
    tenants: {
        data: TenantItem[];
        links: any[];
        total: number;
    };
    plans: PlanOption[];
    filters: { search?: string };
}

export default function TenantsIndex({ tenants, plans = [], filters }: TenantsPageProps) {
    const { flash } = usePage<TenantsPageProps>().props;
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
    const [deletingTenant, setDeletingTenant] = useState<TenantItem | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const createForm = useForm({
        name: '',
        domain: '',
        plan_id: plans[0]?.id || 1,
        owner_name: '',
        owner_email: '',
        owner_password: 'password',
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

    const handleDeleteTenant = () => {
        if (!deletingTenant) return;
        router.delete(`/admin/tenants/${deletingTenant.id}`, {
            onSuccess: () => setDeletingTenant(null),
        });
    };

    return (
        <AppLayout title="Kelola Tenant SaaS">
            <Head title="Manajemen Tenant SaaS Multi-Tenant - Super Admin" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-400" /> Manajemen Tenant & Toko Penyewa SaaS
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Kelola pendaftaran toko pelanggan, paket berlangganan, domain khusus, dan status keaktifan tenant.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambah Tenant Baru</span>
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
                                            <td className="p-4 text-right font-sans space-x-2">
                                                <button
                                                    onClick={() => router.post(`/admin/tenants/${t.id}/impersonate`)}
                                                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition active:scale-95"
                                                    title="Login sebagai tenant ini"
                                                >
                                                    <Store className="w-3.5 h-3.5 text-emerald-400" /> Impersonate
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(t)}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Edit className="w-3.5 h-3.5 text-blue-400" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeletingTenant(t)}
                                                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition active:scale-95"
                                                    title="Hapus Tenant Toko"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Hapus
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
                                    <Building2 className="w-5 h-5 text-blue-400" /> Daftarkan Tenant Toko Baru
                                </h3>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Nama Toko Tenant</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="Contoh: BerkahPRO Retail Enterprise"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Domain / Subdomain Khusus (Opsional)</label>
                                    <input
                                        type="text"
                                        value={createForm.data.domain}
                                        onChange={(e) => createForm.setData('domain', e.target.value)}
                                        placeholder="berkah.superbackend.my.id atau kasir-berkah.com"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Pilih Paket SaaS Berlangganan</label>
                                    <select
                                        value={createForm.data.plan_id}
                                        onChange={(e) => createForm.setData('plan_id', Number(e.target.value))}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    >
                                        {plans.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} - Rp {Number(p.monthly_price).toLocaleString('id-ID')}/bln
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="border-t border-slate-800 pt-3 space-y-3">
                                    <span className="font-bold text-slate-300 block">Informasi Akun Pemilik (Owner Toko):</span>

                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Nama Pemilik Toko</label>
                                        <input
                                            type="text"
                                            required
                                            value={createForm.data.owner_name}
                                            onChange={(e) => createForm.setData('owner_name', e.target.value)}
                                            placeholder="Nama Lengkap Pemilik"
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Email Owner</label>
                                        <input
                                            type="email"
                                            required
                                            value={createForm.data.owner_email}
                                            onChange={(e) => createForm.setData('owner_email', e.target.value)}
                                            placeholder="owner@toko.com"
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Password Awal Owner</label>
                                        <input
                                            type="text"
                                            required
                                            value={createForm.data.owner_password}
                                            onChange={(e) => createForm.setData('owner_password', e.target.value)}
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold"
                                        />
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
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <Edit className="w-5 h-5 text-blue-400" /> Edit Tenant Toko: {editingTenant.name}
                                </h3>
                                <button type="button" onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <form onSubmit={handleUpdateSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Nama Toko Tenant</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Subdomain Khusus</label>
                                    <input
                                        type="text"
                                        value={editForm.data.domain}
                                        onChange={(e) => editForm.setData('domain', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Status Keaktifan Subskripsi</label>
                                    <select
                                        value={editForm.data.status}
                                        onChange={(e) => editForm.setData('status', e.target.value as any)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    >
                                        <option value="active">Active (Aktif Normal)</option>
                                        <option value="past_due">Past Due (Menunggak Tagihan)</option>
                                        <option value="grace_period">Grace Period (Masa Tenggang)</option>
                                        <option value="suspended">Suspended (Ditangguhkan / Kunci Fitur)</option>
                                        <option value="expired">Expired (Kadaluarsa)</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-3">
                                    <button type="button" onClick={() => setEditingTenant(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl">Batal</button>
                                    <button type="submit" disabled={editForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg">
                                        {editForm.processing ? '⏳ Menyimpan...' : 'Perbarui Tenant'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL KONFIRMASI HAPUS TENANT */}
                {deletingTenant && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                            <div className="flex items-center gap-3 text-rose-400">
                                <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-white">Hapus Tenant Toko?</h3>
                                    <p className="text-xs text-slate-400">Tindakan ini akan menghapus toko & seluruh relasi data tenant.</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs">
                                <p className="text-slate-300"><strong>Nama Tenant:</strong> {deletingTenant.name}</p>
                                <p className="text-slate-300"><strong>Owner:</strong> {deletingTenant.owner?.name} ({deletingTenant.owner?.email})</p>
                                <p className="text-slate-300"><strong>Paket SaaS:</strong> {deletingTenant.subscription?.plan?.name}</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setDeletingTenant(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl">Batal</button>
                                <button type="button" onClick={handleDeleteTenant} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Ya, Hapus Tenant
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
