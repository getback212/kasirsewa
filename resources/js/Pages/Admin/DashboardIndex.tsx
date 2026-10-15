import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Building2, CreditCard, Users, ShieldCheck, TrendingUp, AlertTriangle, Clock, CheckCircle2, DollarSign, Activity } from 'lucide-react';
import type { PageProps } from '@/Types';

interface AdminDashboardProps extends PageProps {
    metrics: {
        totalTenants: number;
        activeTenants: number;
        trialTenants: number;
        pastDueTenants: number;
        suspendedTenants: number;
        newTenantsThisMonth: number;
        totalRevenue: number;
        mrr: number;
        unpaidInvoicesCount: number;
        unpaidInvoicesAmount: number;
    };
    planDistribution: { name: string; count: number }[];
    monthlyRevenueTrend: { month: string; revenue: number }[];
    recentTenants: any[];
    recentInvoices: any[];
}

export default function AdminDashboardIndex({
    metrics,
    planDistribution = [],
    monthlyRevenueTrend = [],
    recentTenants = [],
    recentInvoices = []
}: AdminDashboardProps) {

    return (
        <AppLayout title="Super Admin SaaS Dashboard">
            <Head title="Super Admin SaaS Global Metrics & Revenue Dashboard - KasirSewa" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" /> Super Admin SaaS Analytics & MRR Dashboard
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Pemantauan metrik pendapatan SaaS (MRR), pertumbuhan tenant, tagihan invoice, dan churn rate.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/enterprise/create"
                            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
                        >
                            <Building2 className="w-4 h-4" />
                            Daftar Enterprise
                        </Link>
                        <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping inline-block" />
                            <span className="text-xs font-bold text-blue-400">System Mode: SUPER ADMIN</span>
                        </div>
                    </div>
                </div>

                {/* KPI METRICS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL TENANTS</span>
                            <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-white font-mono">{metrics.totalTenants}</div>
                        <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <span>+{metrics.newTenantsThisMonth} Tenant Baru Bulan Ini</span>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL REVENUE (TOTAL OMZET SAAS)</span>
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                            Rp {metrics.totalRevenue.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                            MRR Bulan Ini: Rp {metrics.mrr.toLocaleString('id-ID')}
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">TENANTS AKTIF</span>
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-white font-mono">{metrics.activeTenants}</div>
                        <div className="text-[11px] text-amber-400 font-semibold">
                            {metrics.trialTenants} Tenants Masa Trial
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">TAGIHAN INVOICE PENDING</span>
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{metrics.unpaidInvoicesCount}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                            Nominal: Rp {metrics.unpaidInvoicesAmount.toLocaleString('id-ID')}
                        </div>
                    </div>

                </div>

                {/* RECENT TENANTS & RECENT INVOICES TABLES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* RECENT REGISTERED TENANTS */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden text-xs">
                        <div className="p-4 border-b border-slate-800 font-bold text-white flex justify-between items-center">
                            <span>🏢 Registrasi Tenant Terbaru</span>
                            <Link href="/admin/tenants" className="text-[11px] text-blue-400 hover:underline">Lihat Semua →</Link>
                        </div>
                        <div className="divide-y divide-slate-800/60 font-mono">
                            {recentTenants.length === 0 ? (
                                <div className="p-6 text-center text-slate-500 font-sans">Belum ada tenant.</div>
                            ) : (
                                recentTenants.map((t) => (
                                    <div key={t.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-white font-sans">{t.name}</div>
                                            <div className="text-[10px] text-slate-500">{t.owner?.email || '-'}</div>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold font-sans">
                                                {t.subscription?.plan?.name || 'Starter'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RECENT INVOICES */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden text-xs">
                        <div className="p-4 border-b border-slate-800 font-bold text-white flex justify-between items-center">
                            <span>🧾 Invoice Tagihan Terkini</span>
                            <Link href="/invoices" className="text-[11px] text-blue-400 hover:underline">Lihat Semua →</Link>
                        </div>
                        <div className="divide-y divide-slate-800/60 font-mono">
                            {recentInvoices.length === 0 ? (
                                <div className="p-6 text-center text-slate-500 font-sans">Belum ada invoice.</div>
                            ) : (
                                recentInvoices.map((inv) => (
                                    <div key={inv.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-white">#{inv.invoice_number}</div>
                                            <div className="text-[10px] text-slate-500 font-sans">{inv.tenant?.name || '-'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-emerald-400">Rp {Number(inv.total).toLocaleString('id-ID')}</div>
                                            <span className={`text-[10px] uppercase font-bold ${inv.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {inv.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
