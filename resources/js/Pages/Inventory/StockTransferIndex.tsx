import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeftRight, Plus, CheckCircle2, Send, Inbox, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import type { PageProps } from '@/Types';

interface OutletItem {
    id: number;
    code: string;
    name: string;
}

interface ProductItem {
    id: number;
    sku: string;
    name: string;
}

interface TransferRecord {
    id: number;
    transfer_number: string;
    status: 'draft' | 'sent' | 'received' | 'cancelled';
    sent_at?: string;
    received_at?: string;
    note?: string;
    from_outlet?: OutletItem;
    to_outlet?: OutletItem;
    user?: { name: string };
    items?: any[];
}

interface StockTransferPageProps extends PageProps {
    transfers: {
        data: TransferRecord[];
        links: any[];
        total: number;
    };
    allOutlets: OutletItem[];
    products: ProductItem[];
}

export default function StockTransferIndex({ transfers, allOutlets, products }: StockTransferPageProps) {
    const { currentOutlet, flash } = usePage<StockTransferPageProps>().props;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [cartItems, setCartItems] = useState<any[]>([]);

    const [fromOutletId, setFromOutletId] = useState<number>(currentOutlet?.id || (allOutlets.length > 0 ? allOutlets[0].id : 0));
    const [toOutletId, setToOutletId] = useState<number>(allOutlets.length > 1 ? allOutlets[1].id : 0);
    const [selectedProductId, setSelectedProductId] = useState<number>(products.length > 0 ? products[0].id : 0);
    const [transferQty, setTransferQty] = useState<number>(10);

    const { data, processing, reset } = useForm({
        note: 'Transfer stok antar cabang outlet toko',
    });

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        const prod = products.find((p) => p.id === Number(selectedProductId));
        if (!prod) return;

        setCartItems((prev) => [
            ...prev,
            {
                product_id: prod.id,
                sku: prod.sku,
                name: prod.name,
                quantity: transferQty,
            },
        ]);
    };

    const removeItem = (index: number) => {
        setCartItems(cartItems.filter((_, i) => i !== index));
    };

    const handleSubmitTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        if (cartItems.length === 0) {
            alert('Masukkan minimal 1 produk barang yang akan ditransfer.');
            return;
        }

        const payload = {
            from_outlet_id: fromOutletId,
            to_outlet_id: toOutletId,
            items: cartItems.map((i) => ({
                product_id: i.product_id,
                quantity: i.quantity,
            })),
            note: data.note,
        };

        router.post('/stock-transfers', payload, {
            onSuccess: () => {
                setShowCreateModal(false);
                setCartItems([]);
                reset();
            },
        });
    };

    const handleSend = (id: number) => {
        if (confirm('Kirim transfer stok ini sekarang? Stok outlet asal akan dipotong.')) {
            router.post(`/stock-transfers/${id}/send`);
        }
    };

    const handleReceive = (id: number) => {
        if (confirm('Terima transfer stok ini sekarang? Stok outlet tujuan akan bertambah.')) {
            router.post(`/stock-transfers/${id}/receive`);
        }
    };

    return (
        <AppLayout title="Transfer Stok">
            <Head title="Transfer Stok Antar Outlet - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <ArrowLeftRight className="w-5 h-5 text-purple-400" /> Transfer Stok Antar Cabang Outlet Toko
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Distribusi stok antar outlet (Draft $\to$ Sent $\to$ Received) dengan pemotongan & penambahan stok atomik.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> + Buat Transfer Stok Baru
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

                {/* TRANSFERS AUDIT TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 font-bold text-xs text-white">
                        📋 Daftar Transfer Stok (Total: {transfers.total})
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">NO. TRANSFER</th>
                                    <th className="p-4">OUTLET ASAL</th>
                                    <th className="p-4">OUTLET TUJUAN</th>
                                    <th className="p-4 text-center">JUMLAH ITEM</th>
                                    <th className="p-4 text-center">STATUS</th>
                                    <th className="p-4 text-right">AKSI PROCESS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {transfers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                                            Belum ada histori transfer stok recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    transfers.data.map((trf) => (
                                        <tr key={trf.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-4 font-bold text-purple-400">{trf.transfer_number}</td>
                                            <td className="p-4 font-sans font-bold text-white">
                                                {trf.from_outlet?.name || 'Outlet Asal'}
                                            </td>
                                            <td className="p-4 font-sans font-bold text-white flex items-center gap-1.5">
                                                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                                                <span>{trf.to_outlet?.name || 'Outlet Tujuan'}</span>
                                            </td>
                                            <td className="p-4 text-center text-slate-300 font-bold">
                                                {trf.items ? trf.items.length : 0} Item
                                            </td>
                                            <td className="p-4 text-center font-sans">
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                                                    trf.status === 'received'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                        : trf.status === 'sent'
                                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                        : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {trf.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-sans space-x-2">
                                                {trf.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleSend(trf.id)}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Send className="w-3.5 h-3.5" /> Kirim Stok
                                                    </button>
                                                )}
                                                {trf.status === 'sent' && (
                                                    <button
                                                        onClick={() => handleReceive(trf.id)}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Inbox className="w-3.5 h-3.5" /> Terima Stok
                                                    </button>
                                                )}
                                                {trf.status === 'received' && (
                                                    <span className="text-slate-500 text-[10px]">Selesai</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL CREATOR TRANSFER STOK */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <ArrowLeftRight className="w-5 h-5 text-purple-400" /> Buat Draft Transfer Stok Antar Outlet
                                </h3>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Outlet Pengirim (Asal)</label>
                                    <select
                                        value={fromOutletId}
                                        onChange={(e) => setFromOutletId(Number(e.target.value))}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    >
                                        {allOutlets.map((o) => (
                                            <option key={o.id} value={o.id}>[{o.code}] {o.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Outlet Penerima (Tujuan)</label>
                                    <select
                                        value={toOutletId}
                                        onChange={(e) => setToOutletId(Number(e.target.value))}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-purple-400 font-bold"
                                    >
                                        {allOutlets.filter((o) => o.id !== fromOutletId).map((o) => (
                                            <option key={o.id} value={o.id}>[{o.code}] {o.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* ADD ITEM ROW */}
                            <form onSubmit={handleAddItem} className="grid grid-cols-12 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                <div className="col-span-6">
                                    <label className="block text-slate-400 font-semibold mb-1">Pilih Produk</label>
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(Number(e.target.value))}
                                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-semibold"
                                    >
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-3">
                                    <label className="block text-slate-400 font-semibold mb-1">Qty Transfer</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={transferQty}
                                        onChange={(e) => setTransferQty(Number(e.target.value))}
                                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                    />
                                </div>

                                <div className="col-span-3 flex items-end">
                                    <button
                                        type="submit"
                                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4 text-purple-400" /> + Item
                                    </button>
                                </div>
                            </form>

                            {/* ITEMS LIST */}
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold">
                                        <tr>
                                            <th className="p-3">SKU</th>
                                            <th className="p-3">PRODUK</th>
                                            <th className="p-3 text-center">QTY DITRANSFER</th>
                                            <th className="p-3 text-right">AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 font-mono">
                                        {cartItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-6 text-center text-slate-500 font-sans">
                                                    Belum ada barang ditambahkan ke daftar transfer.
                                                </td>
                                            </tr>
                                        ) : (
                                            cartItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-800/40">
                                                    <td className="p-3 font-bold text-white">{item.sku}</td>
                                                    <td className="p-3 font-bold text-white font-sans">{item.name}</td>
                                                    <td className="p-3 text-center font-bold text-purple-400">+{item.quantity}</td>
                                                    <td className="p-3 text-right font-sans">
                                                        <button onClick={() => removeItem(idx)} className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/20">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {cartItems.length > 0 && (
                                <button
                                    onClick={handleSubmitTransfer}
                                    disabled={processing}
                                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                                >
                                    <ArrowLeftRight className="w-5 h-5" /> SIMPAN DRAFT TRANSFER STOK
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
