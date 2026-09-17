import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, ArrowRight, Printer, CheckCircle2 } from 'lucide-react';
import type { PageProps } from '@/Types';

interface LowStockItem {
    id: number;
    sku: string;
    name: string;
    stock: number;
    minimum_stock: number;
    unit: string;
}

interface RecentSaleItem {
    id: number;
    invoice_number: string;
    sale_date: string;
    cashier_name: string;
    customer_name: string;
    grand_total: number;
    payment_method: string;
    status: string;
}

interface DashboardData {
    todaySalesTotal: number;
    todayTransactionCount: number;
    averageTransaction: number;
    todayGrossProfit: number;
    todayCogs: number;
    lowStockCount: number;
    lowStockProducts: LowStockItem[];
    recentSales: RecentSaleItem[];
    hourlySales: any[];
    isManagement: boolean;
}

interface DashboardPageProps extends PageProps {
    dashboard: DashboardData;
}

export default function DashboardIndex({ dashboard }: DashboardPageProps) {
    const { auth, currentOutlet } = usePage<DashboardPageProps>().props;

    return (
        <AppLayout>
            <Head title="Dashboard Executive - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* WELCOME BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            👋 Selamat Datang, {auth.user?.name}!
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Ringkasan eksekutif transaksi penjualan hari ini di <span className="text-emerald-400 font-semibold">{currentOutlet?.name || 'Store Utama'}</span>.
                        </p>
                    </div>

                    <Link
                        href="/pos"
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2 transition"
                    >
                        <span>🛒 Buka POS Kasir Touch</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* LOW STOCK ALERT BANNER */}
                {dashboard.lowStockCount > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-3xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-xs text-rose-400">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <div>
                                <span className="font-bold block">Peringatan Stok Menipis!</span>
                                <span className="text-[11px] text-slate-400">
                                    Terdapat <strong className="text-rose-400">{dashboard.lowStockCount} produk</strong> dengan jumlah stok mencapai batas minimal gudang.
                                </span>
                            </div>
                        </div>

                        {dashboard.isManagement && (
                            <Link
                                href="/purchases"
                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition shrink-0"
                            >
                                Restok Supplier Now
                            </Link>
                        )}
                    </div>
                )}

                {/* EXECUTIVE STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2 shadow-xl">
                        <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                            <span>OMZET HARI INI</span>
                            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-extrabold text-white font-mono">
                            Rp {dashboard.todaySalesTotal.toLocaleString('id-ID')}
                        </div>
                        <p className="text-[10px] text-slate-500">{dashboard.todayTransactionCount} Transaksi Selesai Hari Ini</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2 shadow-xl">
                        <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                            <span>TOTAL TRANSAKSI</span>
                            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                                <ShoppingBag className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-extrabold text-blue-400 font-mono">
                            {dashboard.todayTransactionCount}
                        </div>
                        <p className="text-[10px] text-slate-500">Rata-rata: Rp {dashboard.averageTransaction.toLocaleString('id-ID')}</p>
                    </div>

                    {dashboard.isManagement ? (
                        <>
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2 shadow-xl">
                                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                                    <span>ESTIMASI LABA KOTOR</span>
                                    <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-extrabold text-purple-400 font-mono">
                                    Rp {dashboard.todayGrossProfit.toLocaleString('id-ID')}
                                </div>
                                <p className="text-[10px] text-slate-500">Omzet minus Modal HPP</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2 shadow-xl">
                                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                                    <span>STOK MENIPIS</span>
                                    <div className="p-2 bg-amber-600/20 text-amber-400 rounded-xl">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-extrabold text-amber-400 font-mono">
                                    {dashboard.lowStockCount} Produk
                                </div>
                                <p className="text-[10px] text-slate-500">Memerlukan Restok Segera</p>
                            </div>
                        </>
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2 shadow-xl col-span-2">
                            <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                                <span>STATUS PERFORMA KASIR</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="text-base font-bold text-emerald-400">
                                Sesi Kasir Aktif & Siap Melayani Transaksi
                            </div>
                            <p className="text-[10px] text-slate-500">Tekan F2 di kasir untuk scan barcode produk.</p>
                        </div>
                    )}

                </div>

                {/* RECENT TRANSACTIONS TABLE FEED */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden space-y-2">
                    <div className="p-5 border-b border-slate-800 font-bold text-xs text-white flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-blue-400" />
                            <span>Feed Transaksi Penjualan Terbaru</span>
                        </span>
                        <Link href="/pos" className="text-blue-400 hover:underline text-[11px] font-semibold">
                            Buka POS Kasir →
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">INVOICE</th>
                                    <th className="p-4">WAKTU</th>
                                    <th className="p-4">PELANGGAN</th>
                                    <th className="p-4">PEMBAYARAN</th>
                                    <th className="p-4">TOTAL TRANSAKSI</th>
                                    <th className="p-4">KASIR</th>
                                    <th className="p-4 text-right">STRUK</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {dashboard.recentSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                                            Belum ada transaksi penjualan recorded hari ini.
                                        </td>
                                    </tr>
                                ) : (
                                    dashboard.recentSales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-4 font-bold text-white">{sale.invoice_number}</td>
                                            <td className="p-4 text-slate-400">{sale.sale_date}</td>
                                            <td className="p-4 font-sans font-bold text-white">{sale.customer_name}</td>
                                            <td className="p-4 font-sans">
                                                <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-bold">
                                                    {sale.payment_method}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-emerald-400">
                                                Rp {sale.grand_total.toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-4 font-sans text-slate-400">{sale.cashier_name}</td>
                                            <td className="p-4 text-right font-sans">
                                                <Link
                                                    href={`/pos/receipt/${sale.id}`}
                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg inline-flex items-center"
                                                    title="Cetak Struk Thermal"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
