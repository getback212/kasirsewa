import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ShoppingBag, CheckCircle2, ShieldCheck, Sparkles, Zap, Building2, Store, CreditCard, ArrowRight, Layers, Users, BarChart3 } from 'lucide-react';

export default function Welcome() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
            <Head title="KasirSewa - Platform POS Kasir SaaS Multi-Tenant & Billing Subskripsi" />

            {/* TOP NAVIGATION BAR */}
            <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 border border-blue-400/40 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-black text-lg text-white tracking-tight">KasirSewa<span className="text-blue-500">.SaaS</span></span>
                            <span className="text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full ml-2 font-bold hidden sm:inline-block">Multi-Tenant Engine</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition active:scale-95"
                        >
                            <span>Masuk / Coba Demo</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-bold text-blue-400 shadow-xl">
                    <Sparkles className="w-4 h-4 text-blue-400" /> Platform SaaS Kasir POS Multi-Tenant Multi-Outlet
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                    Kelola Ribuan Toko & Kasir Dalam Satu Platform <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">SaaS Multi-Tenant</span>
                </h1>

                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Sistem POS Kasir terlengkap berbasis berlangganan dengan isolasi tenant 100% aman, cetak struk thermal 58mm/80mm, dual screen pembeli, manajemen shift, dan billing invoice otomatis.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Link
                        href="/login"
                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-2 transition active:scale-95"
                    >
                        <span>Coba Demo Aplikasi Sekarang</span>
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* FEATURE CARDS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg text-white">Multi-Tenancy Single DB</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Setiap tenant terisolasi penuh dengan scope `tenant_id` transparan dan perlindungan middleware RBAC Spatie.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg text-white">Billing & Subskripsi Automated</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Paket Starter, Pro, Enterprise, invoice otomatis, status subskripsi, dan pengingat kadaluarsa harian.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
                        <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg text-white">POS Kasir Touch & Struk Thermal</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Antarmuka kasir super cepat, tahan keranjang F9, kalibrasi cetak 58mm/80mm, dan layar pembeli dual screen.
                        </p>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-600 font-mono">
                KasirSewa SaaS Multi-Tenant Platform • Powered by Laravel 12 & React Inertia
            </footer>
        </div>
    );
}
