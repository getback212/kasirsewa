import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Sparkles, Plus, Search, Edit3, Trash2, CheckCircle2, Tag, Percent, DollarSign } from 'lucide-react';
import { formatThousand, parseThousand } from '@/Utils/format';
import type { PageProps } from '@/Types';

interface DiscountItem {
    id: number;
    code: string | null;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_spend: number;
    max_discount: number | null;
    is_active: boolean;
    created_at: string;
}

interface DiscountsPageProps extends PageProps {
    discounts: {
        data: DiscountItem[];
        links: any[];
        total: number;
    };
    filters: { search?: string };
}

export default function DiscountsIndex({ discounts, filters }: DiscountsPageProps) {
    const { flash } = usePage<DiscountsPageProps>().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<DiscountItem | null>(null);

    const createForm = useForm({
        name: '',
        code: '',
        type: 'percentage',
        value: '',
        min_spend: '0',
        max_discount: '',
    });

    const editForm = useForm({
        name: '',
        code: '',
        type: 'percentage',
        value: '',
        min_spend: '0',
        max_discount: '',
        is_active: true,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/discounts', { search }, { preserveState: true });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/discounts', {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDiscount) return;

        editForm.put(`/discounts/${editingDiscount.id}`, {
            onSuccess: () => {
                setEditingDiscount(null);
                editForm.reset();
            }
        });
    };

    const handleDelete = (discount: DiscountItem) => {
        if (confirm(`Apakah Anda yakin ingin menghapus promo diskon '${discount.name}'?`)) {
            router.delete(`/discounts/${discount.id}`);
        }
    };

    return (
        <AppLayout title="Voucher Promo & Diskon">
            <Head title="Manajemen Voucher Promo & Diskon Toko - KasirSewa" />

            <div className="w-full space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" /> Voucher Promo & Diskon Toko
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Buat potongan diskon persen (%), diskon nominal (Rp), atau kode voucher promo untuk transaksi kasir POS.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95 shrink-0"
                    >
                        <Plus className="w-4 h-4" /> + Buat Promo Diskon Baru
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
                            placeholder="Cari Nama Promo / Kode Voucher Diskon..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none"
                        />
                    </form>
                </div>

                {/* DISCOUNTS TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">NAMA PROMO</th>
                                    <th className="p-4">KODE VOUCHER</th>
                                    <th className="p-4">TIPE & NILAI DISKON</th>
                                    <th className="p-4">MINIMAL BELANJA</th>
                                    <th className="p-4 text-center">STATUS</th>
                                    <th className="p-4 text-right">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
                                {discounts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500">
                                            Belum ada promo diskon recorded. Klik "+ Buat Promo Diskon Baru" untuk menambahkan.
                                        </td>
                                    </tr>
                                ) : (
                                    discounts.data.map((d) => (
                                        <tr key={d.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-4 font-bold text-white">
                                                {d.name}
                                            </td>
                                            <td className="p-4 font-mono font-bold text-amber-400 uppercase">
                                                {d.code ? (
                                                    <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                        🎟️ {d.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 font-sans text-[11px]">Otomatis</span>
                                                )}
                                            </td>
                                            <td className="p-4 font-mono font-bold text-emerald-400">
                                                {d.type === 'percentage' ? `${d.value}% Off` : `Rp ${formatThousand(d.value)}`}
                                            </td>
                                            <td className="p-4 font-mono text-slate-300">
                                                Rp {formatThousand(d.min_spend)}
                                            </td>
                                            <td className="p-4 text-center font-sans">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    d.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                                }`}>
                                                    {d.is_active ? 'AKTIF' : 'NONAKTIF'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingDiscount(d);
                                                        editForm.setData({
                                                            name: d.name,
                                                            code: d.code || '',
                                                            type: d.type,
                                                            value: String(d.value),
                                                            min_spend: String(d.min_spend),
                                                            max_discount: d.max_discount ? String(d.max_discount) : '',
                                                            is_active: d.is_active,
                                                        });
                                                    }}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 text-blue-400" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(d)}
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

                {/* MODAL CREATE DISCOUNT */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <form onSubmit={handleCreateSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" /> Buat Promo Diskon Baru
                                </h3>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Nama Promo / Voucher</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Promo Gaji Pertama 10% / Cashback Rp 5.000"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Kode Voucher (Opsional)</label>
                                        <input
                                            type="text"
                                            value={createForm.data.code}
                                            onChange={(e) => createForm.setData('code', e.target.value)}
                                            placeholder="e.g. HEMAT10"
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-bold uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Tipe Potongan</label>
                                        <select
                                            value={createForm.data.type}
                                            onChange={(e) => createForm.setData('type', e.target.value as any)}
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                        >
                                            <option value="percentage">Persen (%)</option>
                                            <option value="fixed">Nominal Rupiah (Rp)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">
                                            Nilai Diskon ({createForm.data.type === 'percentage' ? '%' : 'Rp'})
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={createForm.data.type === 'percentage' ? createForm.data.value : formatThousand(createForm.data.value)}
                                            onChange={(e) => createForm.setData('value', createForm.data.type === 'percentage' ? e.target.value : parseThousand(e.target.value))}
                                            placeholder={createForm.data.type === 'percentage' ? '10' : '5.000'}
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Minimal Belanja (Rp)</label>
                                        <input
                                            type="text"
                                            value={formatThousand(createForm.data.min_spend)}
                                            onChange={(e) => createForm.setData('min_spend', parseThousand(e.target.value))}
                                            placeholder="0"
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl">Batal</button>
                                <button type="submit" disabled={createForm.processing} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg">
                                    {createForm.processing ? 'Menyimpan...' : 'Simpan Promo'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
