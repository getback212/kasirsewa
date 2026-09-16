import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { RotateCcw, Search, CheckCircle2, History, AlertCircle } from 'lucide-react';
import type { PageProps } from '@/Types';

interface SaleItemData {
    id: number;
    product_name_snapshot: string;
    sku_snapshot: string;
    price_snapshot: number;
    quantity: number;
}

interface SaleRecord {
    id: number;
    invoice_number: string;
    sale_date: string;
    grand_total: number;
    cashier?: { name: string };
    customer?: { name: string };
    items: SaleItemData[];
}

interface ReturnRecord {
    id: number;
    return_number: string;
    refund_amount: number;
    reason: string;
    created_at: string;
    sale?: { invoice_number: string };
    cashier?: { name: string };
}

interface ReturnsPageProps extends PageProps {
    sales: {
        data: SaleRecord[];
        links: any[];
        total: number;
    };
    returnsHistory: ReturnRecord[];
}

export default function ReturnsIndex({ sales, returnsHistory }: ReturnsPageProps) {
    const { flash } = usePage<ReturnsPageProps>().props;

    const [activeTab, setActiveTab] = useState<'sales' | 'history'>('sales');
    const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
    const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
    const [reason, setReason] = useState('Barang Cacat / Rusak saat diterima');
    const [search, setSearch] = useState('');

    const { post, processing } = useForm();

    const openReturnModal = (sale: SaleRecord) => {
        setSelectedSale(sale);
        const initialQtyMap: Record<number, number> = {};
        sale.items.forEach((item) => {
            initialQtyMap[item.id] = 0;
        });
        setReturnQuantities(initialQtyMap);
    };

    const handleProcessReturn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSale) return;

        const returnItems = Object.entries(returnQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([saleItemId, qty]) => ({
                sale_item_id: Number(saleItemId),
                quantity: qty,
            }));

        if (returnItems.length === 0) {
            alert('Pilih minimal 1 barang dengan jumlah retur > 0');
            return;
        }

        const payload = {
            sale_id: selectedSale.id,
            items: returnItems,
            reason,
        };

        post('/sales-returns', {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            onSuccess: () => {
                setSelectedSale(null);
            },
        } as any);
    };

    const filteredSales = sales.data.filter(
        (s) =>
            s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
            (s.customer && s.customer.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <AppLayout title="Retur Penjualan">
            <Head title="Retur Penjualan & Sales Return Engine - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-rose-400" /> Retur Penjualan & Refund Stock Engine
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Modul pengembalian barang dari pelanggan, validasi quantity retur max, dan pemulihan stok gudang otomatis.
                        </p>
                    </div>
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

                {/* TABS */}
                <div className="flex border-b border-slate-800 gap-6 text-xs font-bold">
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`pb-3 transition cursor-pointer ${
                            activeTab === 'sales'
                                ? 'text-rose-400 border-b-2 border-rose-400'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        🛒 Pilih Transaksi Penjualan ({sales.total})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 transition cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'history'
                                ? 'text-rose-400 border-b-2 border-rose-400'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" /> Histori Audit Retur ({returnsHistory.length})
                    </button>
                </div>

                {/* TAB 1: SALES LIST */}
                {activeTab === 'sales' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari Invoice No / Pelanggan..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-rose-500 focus:outline-none"
                            />
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                        <tr>
                                            <th className="p-4">INVOICE PENJUALAN</th>
                                            <th className="p-4">TANGGAL TRANSAKSI</th>
                                            <th className="p-4">PELANGGAN</th>
                                            <th className="p-4">TOTAL DIBAYAR</th>
                                            <th className="p-4">KASIR</th>
                                            <th className="p-4 text-right">AKSI RETUR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                        {filteredSales.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                                                    Belum ada transaksi penjualan completed yang dapat diretur.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSales.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-slate-800/40 transition">
                                                    <td className="p-4 font-bold text-white">{sale.invoice_number}</td>
                                                    <td className="p-4 text-slate-400">
                                                        {new Date(sale.sale_date).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="p-4 font-sans font-bold text-white">
                                                        {sale.customer?.name || 'Pelanggan Umum'}
                                                    </td>
                                                    <td className="p-4 font-bold text-emerald-400">
                                                        Rp {Number(sale.grand_total).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="p-4 font-sans text-slate-400">
                                                        {sale.cashier?.name || 'Kasir'}
                                                    </td>
                                                    <td className="p-4 text-right font-sans">
                                                        <button
                                                            onClick={() => openReturnModal(sale)}
                                                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1 ml-auto cursor-pointer"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" /> Retur Barang
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: RETURNS HISTORY */}
                {activeTab === 'history' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                    <tr>
                                        <th className="p-4">NO. RETUR</th>
                                        <th className="p-4">INVOICE ASAL</th>
                                        <th className="p-4">TOTAL REFUND (RP)</th>
                                        <th className="p-4">ALASAN RETUR</th>
                                        <th className="p-4">KASIR PROCESS</th>
                                        <th className="p-4">WAKTU RETUR</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                    {returnsHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                                                Belum ada audit log retur penjualan recorded.
                                            </td>
                                        </tr>
                                    ) : (
                                        returnsHistory.map((ret) => (
                                            <tr key={ret.id} className="hover:bg-slate-800/40 transition">
                                                <td className="p-4 font-bold text-rose-400">{ret.return_number}</td>
                                                <td className="p-4 text-white font-bold">{ret.sale?.invoice_number}</td>
                                                <td className="p-4 font-bold text-rose-400">
                                                    Rp {Number(ret.refund_amount).toLocaleString('id-ID')}
                                                </td>
                                                <td className="p-4 font-sans text-slate-300">{ret.reason}</td>
                                                <td className="p-4 font-sans text-slate-400">{ret.cashier?.name}</td>
                                                <td className="p-4 text-slate-400">
                                                    {new Date(ret.created_at).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MODAL PROCESS RETURN */}
                {selectedSale && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <form onSubmit={handleProcessReturn} className="w-full max-w-xl bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <RotateCcw className="w-5 h-5 text-rose-400" /> Form Retur Barang Invoice #{selectedSale.invoice_number}
                                </h3>
                                <button type="button" onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Alasan Retur Pengembalian</label>
                                <input
                                    type="text"
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Alasan retur..."
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-slate-400 font-semibold">Pilih Barang & Jumlah Yang Diretur</label>
                                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                                            <tr>
                                                <th className="p-3">NAMA ITEM</th>
                                                <th className="p-3">DIBELI</th>
                                                <th className="p-3">HARGA</th>
                                                <th className="p-3 text-right">QTY RETUR</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 font-mono">
                                            {selectedSale.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="p-3 font-bold text-white font-sans">{item.product_name_snapshot}</td>
                                                    <td className="p-3 text-slate-400">{item.quantity}</td>
                                                    <td className="p-3 text-emerald-400">Rp {Number(item.price_snapshot).toLocaleString('id-ID')}</td>
                                                    <td className="p-3 text-right">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.quantity}
                                                            value={returnQuantities[item.id] || 0}
                                                            onChange={(e) =>
                                                                setReturnQuantities({
                                                                    ...returnQuantities,
                                                                    [item.id]: Math.min(item.quantity, Math.max(0, Number(e.target.value))),
                                                                })
                                                            }
                                                            className="w-20 p-1.5 bg-slate-900 border border-slate-800 rounded text-right text-rose-400 font-bold"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setSelectedSale(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                                <button type="submit" disabled={processing} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                                    {processing ? '⏳ Memproses Retur...' : 'PROSES RETUR & KEMBALIKAN STOK'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
