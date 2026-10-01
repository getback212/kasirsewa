import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Warehouse, Plus, Search, AlertTriangle, History, ArrowUpRight, ArrowDownLeft, FileSpreadsheet, Receipt } from 'lucide-react';
import type { PageProps } from '@/Types';

interface StockItem {
    id: number;
    quantity: number;
    reserved_quantity: number;
    product: {
        id: number;
        sku: string;
        name: string;
        minimum_stock: number;
        category?: { name: string };
        unit?: { short_name: string };
    };
}

interface MovementItem {
    id: number;
    type: string;
    quantity: number;
    before_stock: number;
    after_stock: number;
    note?: string;
    created_at: string;
    product?: { name: string; sku: string };
    user?: { name: string };
}

interface InventoryPageProps extends PageProps {
    stocks: {
        data: StockItem[];
        links: any[];
        total: number;
    };
    movements: MovementItem[];
    allProducts: { id: number; sku: string; name: string }[];
    filters: { search?: string };
}

export default function InventoryIndex({ stocks, movements, allProducts, filters }: InventoryPageProps) {
    const { flash } = usePage<InventoryPageProps>().props;
    const [activeTab, setActiveTab] = useState<'stocks' | 'movements'>('stocks');
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [search, setSearch] = useState(filters.search || '');

    const { data, setData, post, processing, reset } = useForm({
        product_id: allProducts.length > 0 ? String(allProducts[0].id) : '',
        type: 'adjustment',
        quantity: '10',
        note: 'Penyesuaian stok gudang',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventory', { search }, { preserveState: true });
    };

    const handleAdjustSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/adjust', {
            onSuccess: () => {
                setShowAdjustModal(false);
                reset();
            },
        });
    };

    return (
        <AppLayout title="Stok Gudang">
            <Head title="Manajemen Stok & Inventory Engine - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Warehouse className="w-5 h-5 text-emerald-400" /> Atomic Inventory & Stock Movements Engine
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Pessimistic locking inventory engine, penyesuaian stok, dan audit trail histori pergerakan stok.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href="/inventory/export/excel"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                            title="Download laporan stok barang gudang format Excel"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Export Excel</span>
                        </a>

                        <a
                            href="/inventory/export/pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                            title="Cetak/simpan laporan stok barang gudang ke PDF"
                        >
                            <Receipt className="w-4 h-4" />
                            <span>Cetak PDF</span>
                        </a>

                        <button
                            onClick={() => setShowAdjustModal(true)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> + Penyesuaian Stok
                        </button>
                    </div>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-semibold">
                        {flash.error}
                    </div>
                )}

                {/* TABS */}
                <div className="flex border-b border-slate-800 gap-6 text-xs font-bold">
                    <button
                        onClick={() => setActiveTab('stocks')}
                        className={`pb-3 transition cursor-pointer ${
                            activeTab === 'stocks'
                                ? 'text-emerald-400 border-b-2 border-emerald-400'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        📦 Daftar Stok Outlet ({stocks.total})
                    </button>
                    <button
                        onClick={() => setActiveTab('movements')}
                        className={`pb-3 transition cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'movements'
                                ? 'text-emerald-400 border-b-2 border-emerald-400'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" /> Histori Movement Ledger ({movements.length})
                    </button>
                </div>

                {/* TAB 1: STOCKS LIST */}
                {activeTab === 'stocks' && (
                    <div className="space-y-4">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari Produk / SKU di Gudang Outlet..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                            />
                        </form>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                        <tr>
                                            <th className="p-4">SKU BARANG</th>
                                            <th className="p-4">NAMA PRODUK</th>
                                            <th className="p-4">KATEGORI</th>
                                            <th className="p-4 text-center">STOK GUDANG</th>
                                            <th className="p-4 text-center">STOK MINIMAL</th>
                                            <th className="p-4 text-center">STATUS STOK</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                        {stocks.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                                                    Belum ada data stok barang terdaftar di outlet ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            stocks.data.map((stock) => {
                                                const isLow = Number(stock.quantity) <= stock.product.minimum_stock;
                                                return (
                                                    <tr key={stock.id} className="hover:bg-slate-800/40 transition">
                                                        <td className="p-4 font-bold text-white">{stock.product.sku}</td>
                                                        <td className="p-4 font-sans font-bold text-white">{stock.product.name}</td>
                                                        <td className="p-4 font-sans text-slate-400">
                                                            {stock.product.category?.name || 'Umum'}
                                                        </td>
                                                        <td className="p-4 text-center font-bold text-emerald-400">
                                                            {Number(stock.quantity)} {stock.product.unit?.short_name || 'pcs'}
                                                        </td>
                                                        <td className="p-4 text-center text-slate-400">
                                                            {stock.product.minimum_stock}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {isLow ? (
                                                                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                                                    <AlertTriangle className="w-3 h-3" /> Stok Menipis
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-[10px]">
                                                                    Aman
                                                                </span>
                                                            )}
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
                )}

                {/* TAB 2: MOVEMENTS LEDGER */}
                {activeTab === 'movements' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                    <tr>
                                        <th className="p-4">WAKTU MOVEMENT</th>
                                        <th className="p-4">PRODUK</th>
                                        <th className="p-4">TIPE MOVEMENT</th>
                                        <th className="p-4 text-center">SEBELUM</th>
                                        <th className="p-4 text-center">PERUBAHAN</th>
                                        <th className="p-4 text-center">SESUDAH</th>
                                        <th className="p-4">CATATAN & USER</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                    {movements.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                                                Belum ada histori pergerakan stok tercatat.
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.map((mv) => {
                                            const isIncrease = Number(mv.quantity) > 0;
                                            return (
                                                <tr key={mv.id} className="hover:bg-slate-800/40 transition">
                                                    <td className="p-4 text-slate-400">
                                                        {new Date(mv.created_at).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="p-4 font-sans font-bold text-white">
                                                        {mv.product?.name || 'Produk'}
                                                    </td>
                                                    <td className="p-4 font-sans">
                                                        <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-semibold uppercase">
                                                            {mv.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center text-slate-400">{Number(mv.before_stock)}</td>
                                                    <td className="p-4 text-center font-bold">
                                                        <span className={`inline-flex items-center gap-0.5 ${isIncrease ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {isIncrease ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                                                            {isIncrease ? `+${Number(mv.quantity)}` : Number(mv.quantity)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center font-bold text-white">{Number(mv.after_stock)}</td>
                                                    <td className="p-4 font-sans text-slate-400">
                                                        <div>{mv.note || '-'}</div>
                                                        <div className="text-[10px] text-slate-500">By: {mv.user?.name || 'System'}</div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MODAL PENYESUAIAN STOK */}
                {showAdjustModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <form onSubmit={handleAdjustSubmit} className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Warehouse className="w-4 h-4 text-emerald-400" /> Penyesuaian Stok Manual
                                </h3>
                                <button type="button" onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Pilih Produk Barang</label>
                                <select
                                    value={data.product_id}
                                    onChange={(e) => setData('product_id', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                                >
                                    {allProducts.map((p) => (
                                        <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Tipe Penyesuaian</label>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                                >
                                    <option value="adjustment">Penyesuaian Manual (Adjustment)</option>
                                    <option value="purchase">Restok Pembelian (Purchase)</option>
                                    <option value="stock_opname">Hasil Opname Fisik (Stock Opname)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Jumlah Perubahan Stok (+ / -)</label>
                                <input
                                    type="number"
                                    required
                                    step="any"
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', e.target.value)}
                                    placeholder="Gunakan tanda - untuk mengurangi"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Masukkan `10` untuk menambah stok, `-5` untuk mengurangi stok.</p>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Catatan / Alasan Penyesuaian</label>
                                <textarea
                                    rows={2}
                                    value={data.note}
                                    onChange={(e) => setData('note', e.target.value)}
                                    placeholder="Alasan penyesuaian stok..."
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                                />
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setShowAdjustModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                                <button type="submit" disabled={processing} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                                    {processing ? '⏳ Menyimpan...' : 'Simpan Penyesuaian'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
