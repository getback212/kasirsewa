import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, PieChart as PieChartIcon, Calendar, Percent, FileSpreadsheet, Receipt } from 'lucide-react';
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

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports', { start_date: startDate, end_date: endDate }, { preserveState: true });
    };

    return (
        <AppLayout title="Laporan Keuangan">
            <Head title="Laporan Keuangan & Analitik Bisnis - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-400 shrink-0" /> 
                            <span>Laporan Analitik Keuangan & Margin Laba Toko</span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Omzet penjualan, HPP/COGS, Laba Kotor, Profit Margin %, Top Products, dan breakdown metode pembayaran.
                        </p>
                    </div>

                    {/* DATE RANGE FILTER & EXPORT EXCEL */}
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
                            href={`/reports/export-excel?start_date=${startDate}&end_date=${endDate}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl cursor-pointer transition shadow-lg shadow-emerald-900/30 active:scale-95 text-center"
                        >
                            <FileSpreadsheet className="w-4 h-4 shrink-0" />
                            <span>Export (.CSV)</span>
                        </a>
                    </div>
                </div>

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
                            <span>LABA KOTOR (GROSS PROFIT)</span>
                            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl shrink-0">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono break-all">
                            Rp {analytics.grossProfit.toLocaleString('id-ID')}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono font-bold">Margin Laba: {analytics.profitMargin}%</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-2 shadow-xl">
                        <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                            <span>BIAYA OPERASIONAL</span>
                            <div className="p-2 bg-rose-600/20 text-rose-400 rounded-xl shrink-0">
                                <Receipt className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-lg sm:text-xl font-extrabold text-rose-400 font-mono break-all">
                            Rp {(analytics.totalExpenses || 0).toLocaleString('id-ID')}
                        </div>
                        <p className="text-[10px] text-slate-500">Beban Listrik, Gaji, Sewa & Operasional</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-2 shadow-xl">
                        <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                            <span>LABA BERSIH (NET PROFIT)</span>
                            <div className="p-2 bg-teal-600/20 text-teal-400 rounded-xl shrink-0">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-lg sm:text-xl font-extrabold text-teal-400 font-mono break-all">
                            Rp {(analytics.netProfit || 0).toLocaleString('id-ID')}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono font-bold">Net Margin: {analytics.netProfitMargin || 0}%</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-2 shadow-xl">
                        <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                            <span>MODAL HPP (COGS)</span>
                            <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl shrink-0">
                                <Percent className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-lg sm:text-xl font-extrabold text-slate-300 font-mono break-all">
                            Rp {analytics.cogs.toLocaleString('id-ID')}
                        </div>
                        <p className="text-[10px] text-slate-500">Harga Beli Modal Produk Terjual</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-2 shadow-xl">
                        <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                            <span>RATA-RATA TRANSAKSI</span>
                            <div className="p-2 bg-amber-600/20 text-amber-400 rounded-xl shrink-0">
                                <ShoppingBag className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono break-all">
                            Rp {analytics.averageOrderValue.toLocaleString('id-ID')}
                        </div>
                        <p className="text-[10px] text-slate-500">Average Order Value (AOV)</p>
                    </div>

                </div>

                {/* CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* REVENUE TREND AREA CHART (COL 8) */}
                    <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
                        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" /> Grafik Tren Omzet Penjualan Harian
                        </h3>

                        <div className="h-64 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.dailyTrend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', fontSize: '11px', color: '#fff' }}
                                        formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Omzet']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* PAYMENT METHOD BREAKDOWN PIE CHART (COL 4) */}
                    <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                                <PieChartIcon className="w-4 h-4 text-emerald-400" /> Breakdown Metode Pembayaran
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Distribusi transaksi Tunai, QRIS, EDC Debit, Kredit & Transfer</p>
                        </div>

                        <div className="h-48 w-full flex items-center justify-center">
                            {analytics.paymentBreakdown.length === 0 ? (
                                <p className="text-slate-500 text-xs">Belum ada data transaksi pembayaran.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics.paymentBreakdown}
                                            dataKey="total_amount"
                                            nameKey="label"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={65}
                                            innerRadius={35}
                                            paddingAngle={4}
                                        >
                                            {analytics.paymentBreakdown.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', fontSize: '11px', color: '#fff' }}
                                            formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Omzet']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* DETAILED DATA TABLE BREAKDOWN FOR PAYMENT METHODS */}
                        <div className="space-y-2 pt-2 border-t border-slate-800 max-h-44 overflow-y-auto">
                            {analytics.paymentBreakdown.map((pm: any, idx: number) => {
                                const color = COLORS[idx % COLORS.length];
                                return (
                                    <div key={pm.payment_method || idx} className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                            <div className="truncate">
                                                <span className="font-bold text-white block truncate">{pm.label || pm.payment_method}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">{pm.count} Transaksi ({pm.percentage || 0}%)</span>
                                            </div>
                                        </div>
                                        <span className="font-black text-emerald-400 font-mono shrink-0 text-right">
                                            Rp {Number(pm.total_amount).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* TOP PRODUCTS BAR CHART */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-amber-400" /> Top 5 Produk Terlaris (Best Sellers)
                    </h3>

                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.topProducts}>
                                <XAxis dataKey="product_name_snapshot" stroke="#64748b" fontSize={10} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', fontSize: '11px', color: '#fff' }}
                                    formatter={(val: any) => [`${val} Item`, 'Terjual']}
                                />
                                <Bar dataKey="total_qty" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
