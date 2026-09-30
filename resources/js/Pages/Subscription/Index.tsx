import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CreditCard, CheckCircle2, AlertCircle, Clock, ShieldCheck, Zap, ArrowRight, Building2 } from 'lucide-react';
import type { PageProps } from '@/Types';

interface PlanItem {
    id: number;
    name: string;
    description: string;
    monthly_price: number;
    yearly_price: number;
    max_users: number;
    max_stores: number;
    max_products: number;
    max_transactions: number;
    features: string[];
}

interface SubscriptionPageProps extends PageProps {
    tenant: any;
    subscription: any;
    plans: PlanItem[];
    invoices: any[];
}

export default function SubscriptionIndex({ tenant, subscription, plans, invoices }: SubscriptionPageProps) {
    const { flash } = usePage<SubscriptionPageProps>().props;
    const [selectedPlanId, setSelectedPlanId] = useState<number>(subscription?.plan_id || (plans[0]?.id || 0));
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const renewForm = useForm({
        plan_id: selectedPlanId,
        billing_cycle: billingCycle,
    });

    const handleRenewSubmit = (planId: number) => {
        setSelectedPlanId(planId);
        renewForm.setData({
            plan_id: planId,
            billing_cycle: billingCycle,
        });

        router.post('/subscription/renew', {
            plan_id: planId,
            billing_cycle: billingCycle,
        }, {
            preserveScroll: true,
        });
    };

    const currentPlan = subscription?.plan;

    return (
        <AppLayout title="Status Berlangganan SaaS">
            <Head title="Paket Berlangganan & Status Subscription - KasirSewa" />

            <div className="w-full space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-400" /> Status Berlangganan Toko SaaS
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Informasi masa aktif paket berlangganan, limit kuota penggunaan, dan perpanjangan langganan.
                        </p>
                    </div>

                    <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                        <span className="text-xs font-bold text-slate-200">Tenant: {tenant.name}</span>
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

                {/* PROMINENT TRIAL BANNER FOR OWNER */}
                {subscription?.status === 'trial' && (
                    <div className="bg-gradient-to-r from-amber-900/40 via-orange-950/50 to-amber-900/40 border-2 border-amber-500/50 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-full">🎁 MASA UJI COBA GRATIS 7 HARI</span>
                                <span className="text-xs font-mono font-bold text-amber-300">
                                    Berakhir pada {subscription.trial_ends_at ? new Date(subscription.trial_ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '7 Hari'}
                                </span>
                            </div>
                            <h2 className="text-lg font-extrabold text-white">Ingin Berlangganan Sekarang Tanpa Menunggu Trial Habis?</h2>
                            <p className="text-xs text-amber-200/80">
                                Anda dapat langsung memproses pembayaran paket berlangganan kapan saja via QRIS Instant atau Transfer Bank BCA/Mandiri.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRenewSubmit(currentPlan?.id || selectedPlanId)}
                            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-amber-500/20 shrink-0 transition active:scale-95 cursor-pointer flex items-center gap-2"
                        >
                            <CreditCard className="w-4 h-4" />
                            <span>💳 Bayar Berlangganan Sekarang</span>
                        </button>
                    </div>
                )}

                {/* CURRENT SUBSCRIPTION METRICS SUMMARY CARD */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/40 p-6 rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">PAKET SAAS AKTIF</span>
                        <span className="text-xl font-black text-white">{currentPlan?.name || 'Starter Basic'}</span>
                        <span className="text-xs text-emerald-400 font-mono block mt-1">Status: {subscription?.status || 'Active'}</span>
                    </div>

                    <div>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">TANGGAL KADALUARSA</span>
                        <span className="text-base font-black text-white font-mono">{subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('id-ID') : 'Aktif 30 Hari'}</span>
                        <span className="text-xs text-slate-500 font-mono block mt-1">Siklus: {subscription?.billing_cycle || 'monthly'}</span>
                    </div>

                    <div>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">KUOTA TOKO & STAFF</span>
                        <span className="text-base font-black text-white font-mono">{tenant.stores?.length || 1} / {currentPlan?.max_stores || 1} Outlets</span>
                        <span className="text-xs text-slate-400 font-mono block mt-1">{tenant.users?.length || 1} / {currentPlan?.max_users || 3} Staff Users</span>
                    </div>

                    <div className="flex flex-col justify-center">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">LIMIT PRODUK</span>
                        <span className="text-base font-black text-emerald-400 font-mono">Max {currentPlan?.max_products || 500} Produk</span>
                    </div>
                </div>

                {/* CYCLE TOGGLE */}
                <div className="flex justify-center my-6">
                    <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-2 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2.5 rounded-xl transition ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Bulanan (Monthly)
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2.5 rounded-xl transition ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Tahunan (Yearly - Hemat 2 Bulan)
                        </button>
                    </div>
                </div>

                {/* PLANS SELECTION CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((p) => {
                        const isCurrent = currentPlan?.id === p.id;
                        const price = billingCycle === 'yearly' ? Number(p.yearly_price) : Number(p.monthly_price);

                        return (
                            <div
                                key={p.id}
                                className={`bg-slate-900 border p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-6 transition ${
                                    isCurrent ? 'border-emerald-500 shadow-emerald-500/10' : 'border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-extrabold text-lg text-white">{p.name}</h3>
                                        {isCurrent && (
                                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-bold">
                                                PAKET AKTIF
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 min-h-[36px]">{p.description}</p>

                                    <div className="pt-2 border-t border-slate-800">
                                        <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                                            Rp {price.toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-xs text-slate-500 font-mono"> / {billingCycle === 'yearly' ? 'tahun' : 'bulan'}</span>
                                    </div>

                                    <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>Maksimal <strong>{p.max_stores}</strong> Outlet Toko</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>Maksimal <strong>{p.max_users}</strong> Pengguna Staff</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>Maksimal <strong>{p.max_products.toLocaleString('id-ID')}</strong> Produk</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>Maksimal <strong>{p.max_transactions.toLocaleString('id-ID')}</strong> Transaksi</span>
                                        </li>
                                    </ul>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleRenewSubmit(p.id)}
                                    disabled={renewForm.processing}
                                    className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                                        isCurrent ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                    }`}
                                >
                                    <span>{isCurrent ? 'Perpanjang Paket Ini' : 'Pilih / Upgrade Paket'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>

            </div>
        </AppLayout>
    );
}
