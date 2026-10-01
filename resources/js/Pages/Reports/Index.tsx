import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, PieChart as PieChartIcon, Calendar, Percent, FileSpreadsheet, Receipt, ReceiptText, Wallet, PackageCheck, Clock, FileLineChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import type { PageProps } from '@/Types';

interface AnalyticsData {
    totalRevenue: number;
    cogs: number;
    grossProfit: number;
    profitMargin: number;
    totalExpenses?: number;
    netProfit?: number;
    netProfitMargin?: number;
    transactionCount: number;
    averageOrderValue: number;
    paymentBreakdown: any[];
    topProducts: any[];
    dailyTrend: any[];
    transactions?: any[];
    productSales?: any[];
    shifts?: any[];
    expensesCategory?: any[];
    startDate: string;
    endDate: string;
}

interface ReportsPageProps extends PageProps {
    analytics: AnalyticsData;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function ReportsIndex({ analytics }: ReportsPageProps) {
    const [startDate, setStartDate] = useState(analytics.startDate);
    const [endDate, setEndDate] = useState(analytics.endDate);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'revenue' | 'sales' | 'shifts' | 'profit_loss'>('overview');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports', { start_date: startDate, end_date: endDate }, { preserveState: true });
    };

    return (
        <AppLayout title="Laporan Keuangan">
            <Head title="Laporan Keuangan & Analitik Bisnis - KasirSewa POS" />

            <div className="w-full space-y-4 sm:space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-400 shrink-0" /> 
                            <span>Laporan Keuangan & Operasional Toko</span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Laporan transaksi, arus pendapatan, analisis penjualan produk, shift kasir, dan ikhtisar laba rugi.
                        </p>
                    </div>

                    {/* DATE RANGE FILTER & EXPORTS */}
                    <div className="flex flex-col sm:flex-row w-full lg:w-auto items-stretch sm:items-center gap-3">
                        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs font-mono">
                            <div className="flex items-center gap-2 px-1">
                                <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent text-white focus:outline-none w-full sm:w-auto"
                                />
                                <span className="text-slate-500">s/d</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent text-white focus:outline-none w-full sm:w-auto"
                                />
                            </div>
                            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer transition active:scale-95 text-center">
                                Filter
                            </button>
                        </form>

                        <a
                            href={`/reports/export/excel?start_date=${startDate}&end_date=${endDate}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl cursor-pointer transition shadow-lg shadow-emerald-900/30 active:scale-95 text-center"
                        >
                            <FileSpreadsheet className="w-4 h-4 shrink-0" />
                            <span>Export Excel (.xlsx)</span>
                        </a>

                        <a
                            href={`/reports/export/pdf?start_date=${startDate}&end_date=${endDate}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl cursor-pointer transition shadow-lg shadow-rose-900/30 active:scale-95 text-center"
                        >
                            <Receipt className="w-4 h-4 shrink-0" />
                            <span>Cetak PDF (.pdf)</span>
                        </a>
                    </div>
                </div>

                {/* 5 CATEGORY TAB SWITCHER */}
                <div className="flex flex-wrap gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" /> Ikhtisar Umum
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'transactions' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <ReceiptText className="w-4 h-4" /> 🧾 Laporan Transaksi
                    </button>
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'revenue' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Wallet className="w-4 h-4" /> 💰 Laporan Pendapatan
                    </button>
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'sales' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <PackageCheck className="w-4 h-4" /> 🛍️ Laporan Penjualan Produk
                    </button>
                    <button
                        onClick={() => setActiveTab('shifts')}
                        className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'shifts' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Clock className="w-4 h-4" /> ⏰ Laporan Shift Kasir
                    </button>
                    <button
                        onClick={() => setActiveTab('profit_loss')}
                        className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'profit_loss' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <FileLineChart className="w-4 h-4" /> 📈 Laporan Laba Rugi
                    </button>
                </div>

                {/* TAB CONTENT: 1. OVERVIEW & KPI CARDS */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* SUMMARY KPI CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-2 shadow-xl">
                                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                                    <span>TOTAL OMZET PENJUALAN</span>
                                    <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl shrink-0">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-lg sm:text-xl font-extrabold text-white font-mono break-all">
                                    Rp {analytics.totalRevenue.toLocaleString('id-ID')}
                                </div>
                                <p className="text-[10px] text-slate-500">{analytics.transactionCount} Total Transaksi Selesai</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-2 shadow-xl">
                                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                                    <span>MODAL HPP (COGS)</span>
                                    <div className="p-2 bg-amber-600/20 text-amber-400 rounded-xl shrink-0">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono break-all">
                                    Rp {analytics.cogs.toLocaleString('id-ID')}
                                </div>
                                <p className="text-[10px] text-slate-500">Harga Pokok Penjualan</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-2 shadow-xl">
                                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                                    <span>LABA KOTOR (GROSS PROFIT)</span>
                                    <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl shrink-0">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono break-all">
                                    Rp {analytics.grossProfit.toLocaleString('id-ID')}
                                </div>
                                <p className="text-[10px] text-emerald-400 font-mono font-bold">Margin Kotor: {analytics.profitMargin}%</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-2 shadow-xl">
                                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                                    <span>BIAYA OPERASIONAL</span>
                                    <div className="p-2 bg-rose-600/20 text-rose-400 rounded-xl shrink-0">
                                        <Percent className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-lg sm:text-xl font-extrabold text-rose-400 font-mono break-all">
                                    Rp {(analytics.totalExpenses || 0).toLocaleString('id-ID')}
                                </div>
                                <p className="text-[10px] text-slate-500">Pengeluaran & Beban Toko</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-2 shadow-xl">
                                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                                    <span>LABA BERSIH (NET PROFIT)</span>
                                    <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl shrink-0">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className={`text-lg sm:text-xl font-extrabold font-mono break-all ${(analytics.netProfit || 0) >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                                    Rp {(analytics.netProfit || 0).toLocaleString('id-ID')}
                                </div>
                                <p className="text-[10px] text-indigo-400 font-mono font-bold">Margin Bersih: {analytics.netProfitMargin || 0}%</p>
                            </div>
                        </div>

                        {/* CHARTS ROW */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Tren Omzet Penjualan Harian
                                </h3>
                                <div className="h-64 sm:h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analytics.dailyTrend}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(val) => `Rp ${val / 1000}k`} />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                                            <Area type="monotone" dataKey="revenue" name="Omzet Penjualan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <PieChartIcon className="w-4 h-4 text-purple-400" /> Metode Pembayaran
                                </h3>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={analytics.paymentBreakdown} dataKey="total_amount" nameKey="label" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                                                {analytics.paymentBreakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="space-y-1.5 text-xs">
                                    {analytics.paymentBreakdown.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                                <span className="text-slate-300 font-semibold">{item.label}</span>
                                            </div>
                                            <span className="font-mono text-white font-bold">Rp {Number(item.total_amount).toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: 2. LAPORAN TRANSAKSI */}
                {activeTab === 'transactions' && (
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-xs">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                                <ReceiptText className="w-4 h-4 text-emerald-400" /> 🧾 Laporan Riwayat Transaksi Penjualan
                            </h3>
                            <span className="text-slate-400 font-mono">Total {(analytics.transactions || []).length} Faktur</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                                    <tr>
                                        <th className="p-3">No. Faktur</th>
                                        <th className="p-3">Tanggal & Waktu</th>
                                        <th className="p-3">Kasir</th>
                                        <th className="p-3">Pelanggan</th>
                                        <th className="p-3">Metode Bayar</th>
                                        <th className="p-3 text-right">Grand Total</th>
                                        <th className="p-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-sans">
                                    {(analytics.transactions || []).map((t: any) => (
                                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-3 font-mono font-bold text-emerald-400">#{t.invoice_number}</td>
                                            <td className="p-3 font-mono text-slate-300">{new Date(t.sale_date).toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-white font-semibold">{t.cashier?.name || '-'}</td>
                                            <td className="p-3 text-slate-300">{t.customer?.name || 'Pelanggan Umum'}</td>
                                            <td className="p-3 uppercase font-mono text-slate-400">
                                                {(t.payments || []).map((p: any) => p.payment_method).join(', ') || 'CASH'}
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-white">Rp {Number(t.grand_total).toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-center">
                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono font-bold text-[10px]">
                                                    SELESAI
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: 3. LAPORAN PENDAPATAN */}
                {activeTab === 'revenue' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-xs">
                                <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                                    <Wallet className="w-4 h-4 text-blue-400" /> Rincian Penerimaan Kas Per Metode Pembayaran
                                </h3>
                                <div className="space-y-3">
                                    {analytics.paymentBreakdown.map((item, idx) => (
                                        <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-white block text-sm">{item.label}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">{item.count} Transaksi</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-mono text-emerald-400 font-bold text-base block">Rp {Number(item.total_amount).toLocaleString('id-ID')}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{item.percentage}% dari total omzet</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-xs">
                                <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Rekonsiliasi Arus Kas Penerimaan
                                </h3>
                                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Total Arus Kas Masuk (Gross Cash Inflow):</span>
                                        <span className="font-mono font-bold text-white">Rp {analytics.totalRevenue.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Rata-Rata Penerimaan Per Transaksi (AOV):</span>
                                        <span className="font-mono font-bold text-emerald-400">Rp {analytics.averageOrderValue.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: 4. LAPORAN PENJUALAN PRODUK */}
                {activeTab === 'sales' && (
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-xs">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                                <PackageCheck className="w-4 h-4 text-amber-400" /> 🛍️ Laporan Performa Penjualan & Profitabilitas Produk
                            </h3>
                            <span className="text-slate-400 font-mono">{(analytics.productSales || []).length} Item Produk Terjual</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                                    <tr>
                                        <th className="p-3">Nama Produk</th>
                                        <th className="p-3 text-center">Qty Terjual</th>
                                        <th className="p-3 text-right">Total HPP (Modal)</th>
                                        <th className="p-3 text-right">Total Omzet</th>
                                        <th className="p-3 text-right">Laba Kotor Produk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-sans">
                                    {(analytics.productSales || []).map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                                            <td className="p-3 font-bold text-white">{item.product_name_snapshot}</td>
                                            <td className="p-3 text-center font-mono font-bold text-emerald-400">{Number(item.qty_sold)} Item</td>
                                            <td className="p-3 text-right font-mono text-amber-400">Rp {Number(item.total_cogs || 0).toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-right font-mono font-bold text-white">Rp {Number(item.total_sales || 0).toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-right font-mono font-bold text-emerald-400">Rp {Number(item.item_profit || 0).toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: 5. LAPORAN SHIFT KASIR */}
                {activeTab === 'shifts' && (
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-xs">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-400" /> ⏰ Laporan Pertanggungjawaban Shift Kasir
                            </h3>
                            <span className="text-slate-400 font-mono">{(analytics.shifts || []).length} Sesi Shift</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                                    <tr>
                                        <th className="p-3">Nama Kasir</th>
                                        <th className="p-3">Waktu Buka Shift</th>
                                        <th className="p-3 font-mono text-right">Modal Awal Laci</th>
                                        <th className="p-3 font-mono text-right">Cash In</th>
                                        <th className="p-3 font-mono text-right">Cash Out</th>
                                        <th className="p-3 font-mono text-right">Expected Cash</th>
                                        <th className="p-3 font-mono text-right">Selisih Kas</th>
                                        <th className="p-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-sans">
                                    {(analytics.shifts || []).map((s: any) => (
                                        <tr key={s.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-3 font-bold text-white">{s.cashier?.name || 'Kasir Store'}</td>
                                            <td className="p-3 font-mono text-slate-300">{new Date(s.opened_at).toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-right font-mono">Rp {Number(s.starting_cash || 0).toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-right font-mono text-emerald-400">+Rp {Number(s.cash_in_amount || 0).toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-right font-mono text-rose-400">-Rp {Number(s.cash_out_amount || 0).toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-right font-mono font-bold text-white">Rp {Number(s.expected_cash || s.starting_cash || 0).toLocaleString('id-ID')}</td>
                                            <td className={`p-3 text-right font-mono font-bold ${Number(s.difference_amount || 0) === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                Rp {Number(s.difference_amount || 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${s.closed_at ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                                    {s.closed_at ? 'CLOSED' : 'OPEN'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: 6. LAPORAN LABA RUGI */}
                {activeTab === 'profit_loss' && (
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl text-xs">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                                <FileLineChart className="w-5 h-5 text-emerald-400" /> 📈 Laporan Laba Rugi (Income Statement)
                            </h3>
                            <span className="text-slate-400 font-mono">Periode: {analytics.startDate} s/d {analytics.endDate}</span>
                        </div>

                        <div className="space-y-4 max-w-3xl mx-auto bg-slate-950 p-6 rounded-3xl border border-slate-800 font-mono">
                            {/* PENJUALAN BERSIH */}
                            <div className="space-y-2">
                                <div className="flex justify-between font-bold text-sm text-white">
                                    <span>PENDAPATAN PENJUALAN BERSIH (REVENUE)</span>
                                    <span className="text-emerald-400">Rp {analytics.totalRevenue.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="border-b border-slate-800"></div>

                            {/* HARGA POKOK PENJUALAN */}
                            <div className="space-y-2">
                                <div className="flex justify-between font-semibold text-slate-300">
                                    <span>Harga Pokok Penjualan (HPP / COGS)</span>
                                    <span className="text-rose-400">- Rp {analytics.cogs.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="border-b-2 border-slate-800"></div>

                            {/* LABA KOTOR */}
                            <div className="flex justify-between font-extrabold text-base text-emerald-400">
                                <span>LABA KOTOR (GROSS PROFIT)</span>
                                <span>Rp {analytics.grossProfit.toLocaleString('id-ID')}</span>
                            </div>

                            <div className="border-b border-slate-800"></div>

                            {/* BEBAN OPERASIONAL */}
                            <div className="space-y-2">
                                <div className="font-bold text-slate-300 uppercase">BEBAN OPERASIONAL (OPERATIONAL EXPENSES):</div>
                                {(analytics.expensesCategory || []).map((exp: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-slate-400 pl-4">
                                        <span>• {exp.category} ({exp.count} Transaksi)</span>
                                        <span className="text-rose-400">- Rp {Number(exp.total_amount).toLocaleString('id-ID')}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-bold text-rose-400 pt-1 pl-2">
                                    <span>TOTAL BEBAN OPERASIONAL</span>
                                    <span>- Rp {(analytics.totalExpenses || 0).toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="border-b-2 border-slate-700"></div>

                            {/* LABA / RUGI BERSIH */}
                            <div className={`p-4 rounded-2xl flex justify-between items-center text-lg font-black ${
                                (analytics.netProfit || 0) >= 0 ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/40' : 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                            }`}>
                                <span>{(analytics.netProfit || 0) >= 0 ? 'LABA BERSIH HARIAN (NET PROFIT)' : 'RUGI BERSIH HARIAN (NET LOSS)'}</span>
                                <span>Rp {(analytics.netProfit || 0).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
