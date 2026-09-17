import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ShoppingBag, CheckCircle2, ShieldCheck, Sparkles, Zap, Building2, Store, CreditCard, ArrowRight, Layers, Users, BarChart3, Check, Star } from 'lucide-react';

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

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href="/login"
                            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl transition"
                        >
                            ⚡ Coba Demo / Login
                        </Link>
                        <Link
                            href="/register"
                            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition active:scale-95"
                        >
                            <span>Daftar Toko (Trial 14 Hari)</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-bold text-blue-400 shadow-xl">
                    <Sparkles className="w-4 h-4 text-blue-400" /> Platform SaaS POS Kasir Multi-Tenant Terpercaya
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                    Kelola Toko & Kasir Dalam Satu Platform <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">SaaS Multi-Tenant</span>
                </h1>

                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Sistem POS Kasir terlengkap berbasis berlangganan dengan isolasi data 100% aman, cetak struk thermal 58mm/80mm, dual screen pembeli, manajemen shift, dan billing invoice otomatis.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Link
                        href="/register"
                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-2 transition active:scale-95"
                    >
                        <span>🚀 Daftar Toko Baru (Trial 14 Hari Gratis)</span>
                    </Link>
                    <Link
                        href="/login"
                        className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2"
                    >
                        <span>⚡ Coba Demo Aplikasi Instan</span>
                    </Link>
                </div>
            </section>

            {/* PRICING PLANS SECTION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900 space-y-10">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl sm:text-4xl font-black text-white">Paket Berlangganan SaaS Hemat & Transparan</h2>
                    <p className="text-xs sm:text-sm text-slate-400">Pilih paket yang paling sesuai dengan skala bisnis toko Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* PLAN STARTER BASIC */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 flex flex-col justify-between hover:border-blue-500/40 transition shadow-xl">
                        <div className="space-y-4">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">STARTER BASIC</span>
                            <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-3xl font-black text-white">Rp 99.000</span>
                                <span className="text-xs text-slate-400">/ bulan</span>
                            </div>
                            <p className="text-xs text-slate-400">Cocok untuk UMKM & Toko Tunggal</p>
                            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1 Outlet Store</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 3 User Staff Kasir</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 500 Produk Master</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Struk Thermal 58mm/80mm</li>
                            </ul>
                        </div>

                        <Link
                            href="/register"
                            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl text-center transition block mt-6"
                        >
                            Daftar Starter (Trial 14 Hari)
                        </Link>
                    </div>

                    {/* PLAN BUSINESS PRO (POPULAR) */}
                    <div className="bg-slate-900 border-2 border-blue-500 p-8 rounded-3xl space-y-6 flex flex-col justify-between relative shadow-2xl shadow-blue-500/10">
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-full shadow-lg">
                            PALING POPULER 🔥
                        </div>
                        <div className="space-y-4 pt-2">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">BUSINESS PRO</span>
                            <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-3xl font-black text-white">Rp 199.000</span>
                                <span className="text-xs text-slate-400">/ bulan</span>
                            </div>
                            <p className="text-xs text-slate-400">Lengkap untuk toko retail multi cabang</p>
                            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 3 Outlet Stores Cabang</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 10 User Staff Kasir</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 2.500 Produk Master</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Transfer Stok Cabang</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Dual Screen Layar Pembeli</li>
                            </ul>
                        </div>

                        <Link
                            href="/register"
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl text-center shadow-lg shadow-blue-600/30 transition block mt-6"
                        >
                            Daftar Pro (Trial 14 Hari)
                        </Link>
                    </div>

                    {/* PLAN ENTERPRISE */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 flex flex-col justify-between hover:border-purple-500/40 transition shadow-xl">
                        <div className="space-y-4">
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">ENTERPRISE UNLIMITED</span>
                            <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-3xl font-black text-white">Rp 399.000</span>
                                <span className="text-xs text-slate-400">/ bulan</span>
                            </div>
                            <p className="text-xs text-slate-400">Tanpa batas untuk jaringan cabang besar</p>
                            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited Outlets & Staff</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited Produk & Transaksi</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Backup Database Otomatis</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Prioritas Support 24/7</li>
                            </ul>
                        </div>

                        <Link
                            href="/register"
                            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl text-center transition block mt-6"
                        >
                            Daftar Enterprise (Trial 14 Hari)
                        </Link>
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
