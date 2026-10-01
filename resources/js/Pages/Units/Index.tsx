import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Boxes, Plus, Search, Edit3, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PageProps } from '@/Types';

interface UnitItem {
    id: number;
    name: string;
    short_name: string;
    created_at: string;
}

interface UnitsPageProps extends PageProps {
    units: {
        data: UnitItem[];
        links: any[];
        total: number;
    };
    filters: { search?: string };
}

export default function UnitsIndex({ units, filters }: UnitsPageProps) {
    const { flash } = usePage<UnitsPageProps>().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);

    const createForm = useForm({
        name: '',
        short_name: '',
    });

    const editForm = useForm({
        name: '',
        short_name: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/units', { search }, { preserveState: true });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/units', {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUnit) return;

        editForm.put(`/units/${editingUnit.id}`, {
            onSuccess: () => {
                setEditingUnit(null);
                editForm.reset();
            }
        });
    };

    const handleDelete = (unit: UnitItem) => {
        if (confirm(`Apakah Anda yakin ingin menghapus satuan unit '${unit.name}' (${unit.short_name})?`)) {
            router.delete(`/units/${unit.id}`);
        }
    };

    return (
        <AppLayout title="Satuan Unit Barang">
            <Head title="Manajemen Satuan Unit Barang - KasirSewa" />

            <div className="w-full space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Boxes className="w-5 h-5 text-emerald-400" /> Satuan Unit Barang
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Kelola bebas daftar satuan unit barang produk (Pcs, Kg, Gram, Dus, Pack, Botol, Liter, Meter, Roll, Dozen, dll).
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95 shrink-0"
                    >
                        <Plus className="w-4 h-4" /> + Tambah Satuan Unit
                    </button>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* SEARCH TOOLBAR */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari Nama Satuan Unit / Singkatan (misal: Kilogram, Pcs, kg, dus)..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                        />
                    </form>
                </div>

                {/* UNITS TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">NAMA SATUAN UNIT</th>
                                    <th className="p-4">SINGKATAN (SHORT CODE)</th>
                                    <th className="p-4">TANGGAL DIBUAT</th>
                                    <th className="p-4 text-right">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
                                {units.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500">
                                            Belum ada satuan unit barang recorded. Klik "+ Tambah Satuan Unit" untuk menambahkan.
                                        </td>
                                    </tr>
                                ) : (
                                    units.data.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-4 font-bold text-white">
                                                {u.name}
                                            </td>
                                            <td className="p-4 font-mono font-bold text-emerald-400 uppercase">
                                                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                    {u.short_name}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-400 font-mono text-[11px]">
                                                {new Date(u.created_at).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingUnit(u);
                                                        editForm.setData({ name: u.name, short_name: u.short_name });
                                                    }}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 text-blue-400" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(u)}
                                                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL CREATE UNIT */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <form onSubmit={handleCreateSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <Boxes className="w-5 h-5 text-emerald-400" /> Tambah Satuan Unit Baru
                                </h3>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Nama Satuan Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Kilogram / Pieces / Pack / Dus"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                    {createForm.errors.name && <p className="text-xs text-rose-400 mt-1">{createForm.errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Singkatan / Short Name (Gudang/POS)</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.short_name}
                                        onChange={(e) => createForm.setData('short_name', e.target.value)}
                                        placeholder="Contoh: kg / pcs / pack / dus"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold"
                                    />
                                    {createForm.errors.short_name && <p className="text-xs text-rose-400 mt-1">{createForm.errors.short_name}</p>}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl">Batal</button>
                                <button type="submit" disabled={createForm.processing} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg">
                                    {createForm.processing ? 'Menyimpan...' : 'Simpan Satuan'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODAL EDIT UNIT */}
                {editingUnit && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <form onSubmit={handleEditSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <Edit3 className="w-5 h-5 text-blue-400" /> Edit Satuan Unit Barang
                                </h3>
                                <button type="button" onClick={() => setEditingUnit(null)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Nama Satuan Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Kilogram"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Singkatan (Short Name)</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.short_name}
                                        onChange={(e) => editForm.setData('short_name', e.target.value)}
                                        placeholder="Contoh: kg"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingUnit(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl">Batal</button>
                                <button type="submit" disabled={editForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg">
                                    {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
