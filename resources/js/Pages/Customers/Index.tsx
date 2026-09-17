import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Users, Plus, Search, CheckCircle2, Phone, MapPin } from 'lucide-react';
import type { PageProps } from '@/Types';

interface CustomerItem {
    id: number;
    code: string;
    name: string;
    phone: string | null;
    address: string | null;
    created_at: string;
}

interface CustomersPageProps extends PageProps {
    customers: {
        data: CustomerItem[];
        links: any[];
        total: number;
    };
    filters: { search?: string };
}

export default function CustomersIndex({ customers, filters }: CustomersPageProps) {
    const { flash } = usePage<CustomersPageProps>().props;
    const [showCreateModal, setShowCreateModal] = useState(false);

    const createForm = useForm({
        name: '',
        phone: '',
        address: '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/customers', {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    return (
        <AppLayout title="Manajemen Pelanggan Member">
            <Head title="Manajemen Pelanggan Member Toko - KasirSewa" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" /> Database Pelanggan & Member Toko
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Kelola data pelanggan langganan untuk pencatatan transaksi kasir & poin member.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambah Pelanggan Member</span>
                    </button>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* CUSTOMERS TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden text-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">KODE MEMBER</th>
                                    <th className="p-4">NAMA PELANGGAN</th>
                                    <th className="p-4">NO. TELEPON / WA</th>
                                    <th className="p-4">ALAMAT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {customers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500 font-sans">
                                            Belum ada data pelanggan member.
                                        </td>
                                    </tr>
                                ) : (
                                    customers.data.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-800/40">
                                            <td className="p-4 font-bold text-blue-400">{c.code}</td>
                                            <td className="p-4 font-sans font-bold text-white text-xs">{c.name}</td>
                                            <td className="p-4 text-slate-300 font-mono">
                                                {c.phone || '-'}
                                            </td>
                                            <td className="p-4 font-sans text-slate-400">
                                                {c.address || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL CREATE CUSTOMER */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-400" /> Tambah Pelanggan Member
                                </h3>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Nama Lengkap Pelanggan</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Budi Santoso"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">No. WhatsApp / HP</label>
                                    <input
                                        type="text"
                                        value={createForm.data.phone}
                                        onChange={(e) => createForm.setData('phone', e.target.value)}
                                        placeholder="081234567890"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Alamat Singkat</label>
                                    <textarea
                                        rows={2}
                                        value={createForm.data.address}
                                        onChange={(e) => createForm.setData('address', e.target.value)}
                                        placeholder="Alamat domisili pelanggan"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                </div>

                                <div className="flex gap-3 pt-3">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl">Batal</button>
                                    <button type="submit" disabled={createForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg">
                                        {createForm.processing ? '⏳ Menyimpan...' : 'Simpan Member'}
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
