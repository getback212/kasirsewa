import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Receipt, 
    Plus, 
    Edit, 
    Trash2, 
    CheckCircle2, 
    AlertCircle, 
    Filter, 
    DollarSign,
    Zap,
    Users,
    Building2,
    Wrench,
    ShoppingBag,
    MoreHorizontal
} from 'lucide-react';
import type { PageProps } from '@/Types';

interface ExpenseItem {
    id: number;
    category: string;
    title: string;
    description?: string;
    amount: number;
    expense_date: string;
    user?: {
        name: string;
    };
    created_at: string;
}

interface ExpensesPageProps extends PageProps {
    expenses: ExpenseItem[];
    totalExpenses: number;
    filters: {
        start_date: string;
        end_date: string;
        category?: string;
    };
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
    listrik_water_internet: { label: 'Listrik / Air / Internet', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    gaji_karyawan: { label: 'Gaji & Bonus Karyawan', icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    sewa_tempat: { label: 'Sewa Tempat / Gedung', icon: Building2, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    maintenance: { label: 'Perbaikan / Maintenance', icon: Wrench, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    operasional_harian: { label: 'Operasional Toko Harian', icon: ShoppingBag, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    lain_lain: { label: 'Lain-lain (Lainnya)', icon: MoreHorizontal, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
};

export default function ExpensesIndex({ expenses, totalExpenses, filters }: ExpensesPageProps) {
    const { flash } = usePage<ExpensesPageProps>().props;

    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

    const createForm = useForm({
        category: 'operasional_harian',
        title: '',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
    });

    const editForm = useForm({
        category: 'operasional_harian',
        title: '',
        description: '',
        amount: '',
        expense_date: '',
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/expenses', {
            start_date: startDate,
            end_date: endDate,
            category: selectedCategory || undefined,
        }, { preserveState: true });
    };

    const handleCreateExpense = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/expenses', {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const openEditModal = (exp: ExpenseItem) => {
        setEditingExpense(exp);
        editForm.setData({
            category: exp.category,
            title: exp.title,
            description: exp.description || '',
            amount: String(exp.amount),
            expense_date: exp.expense_date,
        });
    };

    const handleUpdateExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingExpense) return;

        editForm.put(`/expenses/${editingExpense.id}`, {
            onSuccess: () => {
                setEditingExpense(null);
            },
        });
    };

    const handleDeleteExpense = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus catatan pengeluaran operasional ini?')) {
            router.delete(`/expenses/${id}`);
        }
    };

    return (
        <AppLayout title="Biaya Operasional Toko">
            <Head title="💸 Kelola Biaya & Pengeluaran Operasional - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-rose-400" /> Biaya & Pengeluaran Operasional Toko
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Pencatatan beban operasional listrik, air, internet, gaji karyawan, sewa tempat, perbaikan, dan biaya harian toko.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <div className="bg-slate-950 border border-slate-800 p-3 px-4 rounded-2xl flex items-center gap-3 shrink-0">
                            <DollarSign className="w-5 h-5 text-rose-400" />
                            <div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase block">TOTAL PENGELUARAN</span>
                                <span className="text-base font-black text-rose-400 font-mono">
                                    Rp {totalExpenses.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shrink-0"
                        >
                            <Plus className="w-4 h-4" /> + Catat Biaya Baru
                        </button>
                    </div>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* FILTER TOOLBAR */}
                <form onSubmit={handleFilter} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row flex-wrap items-end gap-3 text-xs">
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-slate-400 font-semibold mb-1">Dari Tanggal</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                        />
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-slate-400 font-semibold mb-1">Sampai Tanggal</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                        />
                    </div>

                    <div className="flex-1 min-w-[180px]">
                        <label className="block text-slate-400 font-semibold mb-1">Kategori Biaya</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                        >
                            <option value="">Semua Kategori</option>
                            {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                        <Filter className="w-3.5 h-3.5" /> Filter Data
                    </button>
                </form>

                {/* EXPENSES TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="p-4">Tanggal & Waktu</th>
                                    <th className="p-4">Kategori Pengeluaran</th>
                                    <th className="p-4">Judul & Keterangan</th>
                                    <th className="p-4 text-right">Nominal Rp</th>
                                    <th className="p-4">Dicatat Oleh</th>
                                    <th className="p-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80 font-medium">
                                {expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-500">
                                            Belum ada catatan pengeluaran operasional pada periode tanggal yang dipilih.
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map((exp) => {
                                        const cat = CATEGORY_MAP[exp.category] || CATEGORY_MAP.lain_lain;
                                        const Icon = cat.icon;
                                        return (
                                            <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                                                <td className="p-4 font-mono whitespace-nowrap text-slate-300">
                                                    {exp.expense_date}
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-xl font-bold border flex items-center gap-1.5 w-max text-[11px] ${cat.color}`}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                        <span>{cat.label}</span>
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-bold text-white block">{exp.title}</span>
                                                    {exp.description && (
                                                        <span className="text-[11px] text-slate-400 block mt-0.5">{exp.description}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right font-mono font-black text-rose-400 whitespace-nowrap">
                                                    Rp {Number(exp.amount).toLocaleString('id-ID')}
                                                </td>
                                                <td className="p-4 text-slate-400 whitespace-nowrap">
                                                    {exp.user?.name || 'Staff'}
                                                </td>
                                                <td className="p-4 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => openEditModal(exp)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
                                                            title="Edit Pengeluaran"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteExpense(exp.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                                                            title="Hapus Catatan"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* MODAL CATAT BIAYA OPERASIONAL BARU */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                    <form onSubmit={handleCreateExpense} className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Plus className="w-4 h-4 text-rose-400" /> Catat Biaya Operasional Baru
                            </h3>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div>
                            <label className="block text-slate-400 font-semibold mb-1">Kategori Biaya Operasional</label>
                            <select
                                required
                                value={createForm.data.category}
                                onChange={(e) => createForm.setData('category', e.target.value)}
                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                            >
                                {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-slate-400 font-semibold mb-1">Judul / Keperluan Biaya</label>
                            <input
                                type="text"
                                required
                                value={createForm.data.title}
                                onChange={(e) => createForm.setData('title', e.target.value)}
                                placeholder="Contoh: Tagihan Listrik PLN Bulan September"
                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nominal Rp</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={createForm.data.amount}
                                    onChange={(e) => createForm.setData('amount', e.target.value)}
                                    placeholder="500000"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-rose-400 font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Tanggal Pengeluaran</label>
                                <input
                                    type="date"
                                    required
                                    value={createForm.data.expense_date}
                                    onChange={(e) => createForm.setData('expense_date', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 font-semibold mb-1">Keterangan Catatan (Opsional)</label>
                            <textarea
                                rows={2}
                                value={createForm.data.description}
                                onChange={(e) => createForm.setData('description', e.target.value)}
                                placeholder="Catatan tambahan..."
                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                            />
                        </div>

                        <div className="flex gap-2.5 pt-2 border-t border-slate-800">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                            <button type="submit" disabled={createForm.processing} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50">
                                {createForm.processing ? '⏳ Menyimpan...' : 'Simpan Biaya'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL EDIT BIAYA OPERASIONAL */}
            {editingExpense && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                    <form onSubmit={handleUpdateExpense} className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Edit className="w-4 h-4 text-blue-400" /> Edit Catatan Biaya Operasional
                            </h3>
                            <button type="button" onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div>
                            <label className="block text-slate-400 font-semibold mb-1">Kategori Biaya Operasional</label>
                            <select
                                required
                                value={editForm.data.category}
                                onChange={(e) => editForm.setData('category', e.target.value)}
                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                            >
                                {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-slate-400 font-semibold mb-1">Judul / Keperluan Biaya</label>
                            <input
                                type="text"
                                required
                                value={editForm.data.title}
                                onChange={(e) => editForm.setData('title', e.target.value)}
                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nominal Rp</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={editForm.data.amount}
                                    onChange={(e) => editForm.setData('amount', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-rose-400 font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Tanggal Pengeluaran</label>
                                <input
                                    type="date"
                                    required
                                    value={editForm.data.expense_date}
                                    onChange={(e) => editForm.setData('expense_date', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 font-semibold mb-1">Keterangan Catatan (Opsional)</label>
                            <textarea
                                rows={2}
                                value={editForm.data.description}
                                onChange={(e) => editForm.setData('description', e.target.value)}
                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                            />
                        </div>

                        <div className="flex gap-2.5 pt-2 border-t border-slate-800">
                            <button type="button" onClick={() => setEditingExpense(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                            <button type="submit" disabled={editForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg cursor-pointer disabled:opacity-50">
                                {editForm.processing ? '⏳ Simpan...' : 'Update Data'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AppLayout>
    );
}
