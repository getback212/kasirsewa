import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Store, Plus, Edit, CheckCircle2, AlertCircle, Phone, MapPin, Percent } from 'lucide-react';
import type { PageProps } from '@/Types';

interface OutletItem {
    id: number;
    code: string;
    name: string;
    phone?: string;
    address?: string;
    tax_percentage: number;
    enable_ppn: boolean;
    qris_payload?: string;
    qris_image_url?: string;
    is_active: boolean;
    created_at: string;
}

interface OutletsPageProps extends PageProps {
    outlets: OutletItem[];
}

export default function OutletsIndex({ outlets }: OutletsPageProps) {
    const { flash, auth } = usePage<OutletsPageProps & { auth: any }>().props;

    const currentOutlet = auth?.currentOutlet;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<OutletItem | null>(null);

    const createForm = useForm({
        code: `OUT-00${outlets.length + 1}`,
        name: '',
        phone: '',
        address: '',
        tax_percentage: '11',
        enable_ppn: true,
        qris_payload: '',
        qris_image_url: '',
    });

    const editForm = useForm({
        code: '',
        name: '',
        phone: '',
        address: '',
        tax_percentage: '11',
        enable_ppn: true,
        qris_payload: '',
        qris_image_url: '',
        is_active: true,
    });

    const handleCreateOutlet = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/outlets', {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const openEditModal = (outlet: OutletItem) => {
        setEditingOutlet(outlet);
        editForm.setData({
            code: outlet.code,
            name: outlet.name,
            phone: outlet.phone || '',
            address: outlet.address || '',
            tax_percentage: String(outlet.tax_percentage ?? 11),
            enable_ppn: outlet.enable_ppn !== false,
            qris_payload: outlet.qris_payload || '',
            qris_image_url: outlet.qris_image_url || '',
            is_active: outlet.is_active,
        });
    };

    const handleUpdateOutlet = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOutlet) return;

        editForm.put(`/outlets/${editingOutlet.id}`, {
            onSuccess: () => {
                setEditingOutlet(null);
            },
        });
    };

    const handleSwitchOutlet = (outletId: number) => {
        router.post(`/outlets/${outletId}/switch`);
    };

    return (
        <AppLayout title="Pengaturan Outlet">
            <Head title="🏬 Konfigurasi Outlet Toko Cabang - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Store className="w-5 h-5 text-emerald-400" /> Konfigurasi Outlet Toko & Cabang Enterprise
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Pengaturan informasi toko, alamat cabang, kontak, default tarif PPN %, dan pembuatan outlet baru.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> + Tambah Outlet Cabang Baru
                    </button>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* OUTLETS CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {outlets.map((o) => {
                        const isCurrent = currentOutlet?.id === o.id;
                        return (
                            <div
                                key={o.id}
                                className={`bg-slate-900 border rounded-3xl p-5 space-y-4 shadow-xl transition relative ${
                                    isCurrent
                                        ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
                                        : 'border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-2xl border ${
                                            isCurrent ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                                        }`}>
                                            <Store className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 font-mono block font-bold">{o.code}</span>
                                            <h3 className="text-sm font-bold text-white">{o.name}</h3>
                                        </div>
                                    </div>

                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase border ${
                                        o.is_active
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                    }`}>
                                        {o.is_active ? 'AKTIF' : 'NON-AKTIF'}
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs text-slate-400 font-medium border-t border-b border-slate-800/60 py-3">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <span>{o.phone || 'Belum ada nomor telepon'}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{o.address || 'Belum ada alamat outlet'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                        <Percent className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                        <span className="font-mono text-slate-300 font-bold">
                                            Default PPN: {o.enable_ppn ? `${Number(o.tax_percentage)}%` : '0% (Non-PPN)'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(o)}
                                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                                    >
                                        <Edit className="w-3.5 h-3.5 text-blue-400" /> Edit Konfigurasi
                                    </button>

                                    {!isCurrent ? (
                                        <button
                                            onClick={() => handleSwitchOutlet(o.id)}
                                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer active:scale-95"
                                        >
                                            Ganti ke Cabang Ini
                                        </button>
                                    ) : (
                                        <span className="px-3 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] rounded-xl flex items-center">
                                            ✓ Sedang Aktif
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* MODAL TAMBAH OUTLET BARU */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <form onSubmit={handleCreateOutlet} className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Store className="w-4 h-4 text-emerald-400" /> Tambah Outlet Toko Cabang Baru
                                </h3>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1">
                                    <label className="block text-slate-400 font-semibold mb-1">Kode Outlet</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.code}
                                        onChange={(e) => createForm.setData('code', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-slate-400 font-semibold mb-1">Nama Outlet Cabang</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="e.g. RetailPRO Cabang Bandung"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nomor Telepon Toko</label>
                                <input
                                    type="text"
                                    value={createForm.data.phone}
                                    onChange={(e) => createForm.setData('phone', e.target.value)}
                                    placeholder="021-xxxxxxx"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Alamat Lengkap</label>
                                <textarea
                                    rows={2}
                                    value={createForm.data.address}
                                    onChange={(e) => createForm.setData('address', e.target.value)}
                                    placeholder="Jl. Merdeka No. 123..."
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Status PPN Pajak</label>
                                    <select
                                        value={createForm.data.enable_ppn ? '1' : '0'}
                                        onChange={(e) => createForm.setData('enable_ppn', e.target.value === '1')}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    >
                                        <option value="1">Aktifkan PPN</option>
                                        <option value="0">Non-PPN (0%)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Default PPN (%)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        value={createForm.data.tax_percentage}
                                        onChange={(e) => createForm.setData('tax_percentage', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-blue-400 font-mono font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                                <button type="submit" disabled={createForm.processing} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                                    {createForm.processing ? '⏳ Menyimpan...' : 'Simpan Outlet Baru'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODAL EDIT KONFIGURASI OUTLET */}
                {editingOutlet && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <form onSubmit={handleUpdateOutlet} className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Edit className="w-4 h-4 text-blue-400" /> Edit Konfigurasi Outlet #{editingOutlet.code}
                                </h3>
                                <button type="button" onClick={() => setEditingOutlet(null)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1">
                                    <label className="block text-slate-400 font-semibold mb-1">Kode Outlet</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.code}
                                        onChange={(e) => editForm.setData('code', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-slate-400 font-semibold mb-1">Nama Outlet Cabang</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nomor Telepon Toko</label>
                                <input
                                    type="text"
                                    value={editForm.data.phone}
                                    onChange={(e) => editForm.setData('phone', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Alamat Lengkap</label>
                                <textarea
                                    rows={2}
                                    value={editForm.data.address}
                                    onChange={(e) => editForm.setData('address', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Status PPN Pajak</label>
                                    <select
                                        value={editForm.data.enable_ppn ? '1' : '0'}
                                        onChange={(e) => editForm.setData('enable_ppn', e.target.value === '1')}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    >
                                        <option value="1">Aktifkan PPN</option>
                                        <option value="0">Non-PPN (0%)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Default PPN (%)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        value={editForm.data.tax_percentage}
                                        onChange={(e) => editForm.setData('tax_percentage', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-blue-400 font-mono font-bold"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                                <span className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-wider block">💳 Pengaturan QRIS Toko Resmi</span>
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Kode QRIS Teks / Payload (String dari Bank/e-Wallet)</label>
                                    <textarea
                                        rows={2}
                                        value={editForm.data.qris_payload}
                                        onChange={(e) => editForm.setData('qris_payload', e.target.value)}
                                        placeholder="Paste kode teks QRIS resmi toko (misal: 000201010211... atau link QRIS BCA/BRI/Mandiri/OVO/GoPay)"
                                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-[11px]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">URL Foto Stiker QRIS Toko (Opsional)</label>
                                    <input
                                        type="url"
                                        value={editForm.data.qris_image_url}
                                        onChange={(e) => editForm.setData('qris_image_url', e.target.value)}
                                        placeholder="https://domain-toko.com/qris-stiker.jpg"
                                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Status Operasional Outlet</label>
                                <select
                                    value={editForm.data.is_active ? '1' : '0'}
                                    onChange={(e) => editForm.setData('is_active', e.target.value === '1')}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                >
                                    <option value="1">Aktif (Operasional)</option>
                                    <option value="0">Non-Aktif (Tutup)</option>
                                </select>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setEditingOutlet(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                                <button type="submit" disabled={editForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                                    {editForm.processing ? '⏳ Update...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
