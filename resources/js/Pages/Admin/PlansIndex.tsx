import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CreditCard, Plus, Search, Edit, CheckCircle2, AlertCircle, Shield, Sparkles, Building2 } from 'lucide-react';
import type { PageProps } from '@/Types';

interface PlanItem {
    id: number;
    name: string;
    slug: string;
    description: string;
    monthly_price: number;
    yearly_price: number;
    max_users: number;
    max_stores: number;
    max_products: number;
    max_transactions: number;
    is_active: boolean;
    subscriptions_count?: number;
}

interface PlansPageProps extends PageProps {
    plans: PlanItem[];
}

export default function PlansIndex({ plans = [] }: PlansPageProps) {
    const { flash } = usePage<PlansPageProps>().props;
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);

    const createForm = useForm({
        name: '',
        description: '',
        monthly_price: '199000',
        yearly_price: '1990000',
        max_users: '10',
        max_stores: '3',
        max_products: '2500',
        max_transactions: '15000',
    });

    const editForm = useForm({
        name: '',
        description: '',
        monthly_price: '0',
        yearly_price: '0',
        max_users: '1',
        max_stores: '1',
        max_products: '100',
        max_transactions: '1000',
        is_active: true,
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/plans', {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const openEditModal = (p: PlanItem) => {
        setEditingPlan(p);
        editForm.setData({
            name: p.name,
            description: p.description || '',
            monthly_price: String(p.monthly_price),
            yearly_price: String(p.yearly_price),
            max_users: String(p.max_users),
            max_stores: String(p.max_stores),
            max_products: String(p.max_products),
            max_transactions: String(p.max_transactions),
            is_active: p.is_active,
        });
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlan) return;

        editForm.put(`/admin/plans/${editingPlan.id}`, {
            onSuccess: () => setEditingPlan(null),
        });
    };

    return (
        <AppLayout title="Pengaturan Paket SaaS">
            <Head title="Manajemen Paket Berlangganan SaaS - Super Admin" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-400" /> Manajemen Paket Berlangganan SaaS
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Atur nama paket, harga bulanan/tahunan, dan batas limit kuota penggunaan bagi tenant.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Buat Paket SaaS Baru</span>
                    </button>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* PLANS TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">NAMA PAKET / SLUG</th>
                                    <th className="p-4">HARGA BULANAN</th>
                                    <th className="p-4">HARGA TAHUNAN</th>
                                    <th className="p-4">LIMIT KUOTA (STORES/USERS/PROD)</th>
                                    <th className="p-4">PELANGGAN</th>
                                    <th className="p-4 text-right">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {plans.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-800/40">
                                        <td className="p-4">
                                            <div className="font-bold text-white text-xs font-sans">{p.name}</div>
                                            <div className="text-slate-500 text-[10px]">{p.slug}</div>
                                        </td>
                                        <td className="p-4 font-bold text-emerald-400">
                                            Rp {Number(p.monthly_price).toLocaleString('id-ID')} /bln
                                        </td>
                                        <td className="p-4 font-bold text-blue-400">
                                            Rp {Number(p.yearly_price).toLocaleString('id-ID')} /thn
                                        </td>
                                        <td className="p-4 text-slate-300 font-sans">
                                            <div>{p.max_stores} Stores • {p.max_users} Users</div>
                                            <div className="text-slate-500 text-[10px] font-mono">{p.max_products.toLocaleString('id-ID')} Prod • {p.max_transactions.toLocaleString('id-ID')} Tx</div>
                                        </td>
                                        <td className="p-4 text-slate-300 font-bold font-sans">
                                            {p.subscriptions_count || 0} Tenants
                                        </td>
                                        <td className="p-4 text-right font-sans">
                                            <button
                                                onClick={() => openEditModal(p)}
                                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <Edit className="w-3.5 h-3.5 text-blue-400" /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL CREATE PLAN */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-blue-400" /> Tambah Paket SaaS Baru
                                </h3>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Nama Paket</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Premium Unlimited"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Harga Bulanan (Rp)</label>
                                        <input
                                            type="number"
                                            required
                                            value={createForm.data.monthly_price}
                                            onChange={(e) => createForm.setData('monthly_price', e.target.value)}
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Harga Tahunan (Rp)</label>
                                        <input
                                            type="number"
                                            required
                                            value={createForm.data.yearly_price}
                                            onChange={(e) => createForm.setData('yearly_price', e.target.value)}
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Max Outlet Toko</label>
                                        <input
                                            type="number"
                                            required
                                            value={createForm.data.max_stores}
                                            onChange={(e) => createForm.setData('max_stores', e.target.value)}
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Max User Staff</label>
                                        <input
                                            type="number"
                                            required
                                            value={createForm.data.max_users}
                                            onChange={(e) => createForm.setData('max_users', e.target.value)}
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-3">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl">Batal</button>
                                    <button type="submit" disabled={createForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg">
                                        {createForm.processing ? '⏳ Menyimpan...' : 'Simpan Paket Baru'}
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
