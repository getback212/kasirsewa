import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CheckCircle2, History, ClipboardCheck, AlertCircle } from 'lucide-react';
import type { PageProps } from '@/Types';

interface ProductOpnameItem {
    id: number;
    sku: string;
    name: string;
    system_quantity: number;
    unit: string;
}

interface OpnameRecord {
    id: number;
    opname_number: string;
    opname_date: string;
    status: string;
    note?: string;
    user?: { name: string };
    items?: any[];
}

interface StockOpnamePageProps extends PageProps {
    opnamesHistory: {
        data: OpnameRecord[];
        links: any[];
        total: number;
    };
    products: ProductOpnameItem[];
}

export default function StockOpnameIndex({ opnamesHistory, products }: StockOpnamePageProps) {
    const { flash } = usePage<StockOpnamePageProps>().props;

    const [activeTab, setActiveTab] = useState<'audit' | 'history'>('audit');
    const [physicalInputs, setPhysicalInputs] = useState<Record<number, number>>(() => {
        const initialMap: Record<number, number> = {};
        products.forEach((p) => {
            initialMap[p.id] = p.system_quantity;
        });
        return initialMap;
    });

    const { processing } = useForm();

    const handlePhysicalChange = (productId: number, val: number) => {
        setPhysicalInputs({
            ...physicalInputs,
            [productId]: Math.max(0, val),
        });
    };

    const handleSubmitOpname = (e: React.FormEvent) => {
        e.preventDefault();

        const items = products.map((p) => ({
            product_id: p.id,
            physical_quantity: physicalInputs[p.id] ?? p.system_quantity,
        }));

        const payload = {
            items,
            note: 'Audit Stock Opname Fisik Toko',
        };

        router.post('/stock-opname', payload, {
            onSuccess: () => {
                alert('Stock Opname berhasil disimpan!');
            },
        });
    };

    return (
        <AppLayout title="Stock Opname">
            <Head title="Audit Stock Opname Fisik - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5 text-blue-400" /> Audit Stock Opname Fisik Gudang (PostgreSQL Sync)
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Pencatatan hasil perhitugan stok fisik barang vs sistem, perhitungan selisih, dan adjustment otomatis.
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
                        onClick={() => setActiveTab('audit')}
                        className={`pb-3 transition cursor-pointer ${
                            activeTab === 'audit'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        📋 Audit Fisik Barang ({products.length} Produk)
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 transition cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'history'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" /> Histori Audit Opname ({opnamesHistory.total})
                    </button>
                </div>

                {/* TAB 1: AUDIT FORM */}
                {activeTab === 'audit' && (
                    <form onSubmit={handleSubmitOpname} className="space-y-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                        <tr>
                                            <th className="p-4">SKU BARANG</th>
                                            <th className="p-4">NAMA PRODUK</th>
                                            <th className="p-4 text-center">STOK SISTEM</th>
                                            <th className="p-4 text-center">STOK FISIK GUDANG</th>
                                            <th className="p-4 text-center">SELISIH (VARIANCE)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                        {products.map((p) => {
                                            const physicalVal = physicalInputs[p.id] ?? p.system_quantity;
                                            const diff = physicalVal - p.system_quantity;
                                            return (
                                                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                                                    <td className="p-4 font-bold text-white">{p.sku}</td>
                                                    <td className="p-4 font-sans font-bold text-white">{p.name}</td>
                                                    <td className="p-4 text-center text-slate-400">
                                                        {p.system_quantity} {p.unit}
                                                    </td>
                                                    <td className="p-4 text-center font-sans">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            value={physicalVal}
                                                            onChange={(e) => handlePhysicalChange(p.id, Number(e.target.value))}
                                                            className="w-24 p-2 bg-slate-950 border border-slate-800 rounded-xl text-center text-white font-mono font-bold"
                                                        />
                                                    </td>
                                                    <td className="p-4 text-center font-bold">
                                                        <span className={diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                            {diff > 0 ? `+${diff}` : diff} {p.unit}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>SIMPAN HASIL OPNAME & ADJUST STOK</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 2: OPNAME HISTORY */}
                {activeTab === 'history' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                    <tr>
                                        <th className="p-4">NO. OPNAME</th>
                                        <th className="p-4">TANGGAL AUDIT</th>
                                        <th className="p-4">AUDITOR</th>
                                        <th className="p-4 text-center">JUMLAH BARANG</th>
                                        <th className="p-4 text-center">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                    {opnamesHistory.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                                                Belum ada audit stock opname recorded.
                                            </td>
                                        </tr>
                                    ) : (
                                        opnamesHistory.data.map((op) => (
                                            <tr key={op.id} className="hover:bg-slate-800/40 transition">
                                                <td className="p-4 font-bold text-blue-400">{op.opname_number}</td>
                                                <td className="p-4 text-slate-400">
                                                    {new Date(op.opname_date).toLocaleString('id-ID')}
                                                </td>
                                                <td className="p-4 font-sans font-bold text-white">
                                                    {op.user?.name || 'Auditor'}
                                                </td>
                                                <td className="p-4 text-center text-slate-300">
                                                    {op.items ? op.items.length : 0} Item
                                                </td>
                                                <td className="p-4 text-center font-sans">
                                                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-[10px] uppercase">
                                                        {op.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
