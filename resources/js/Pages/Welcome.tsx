import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    ShoppingBag, CheckCircle2, ShieldCheck, Sparkles, Zap, Building2, Store, 
    CreditCard, ArrowRight, Layers, Users, BarChart3, Check, Star, MessageSquare, 
    HelpCircle, ChevronDown, PhoneCall, Lock, RefreshCw, Printer, QrCode
} from 'lucide-react';

interface PlanProps {
    id: number;
    name: string;
    slug: string;
    monthly_price: number;
    yearly_price: number;
    max_stores: number;
    max_users: number;
    max_products: number;
    features?: string[];
}

export default function Welcome({ plans = [], waCsNumber = '6281234567890' }: { plans?: PlanProps[]; waCsNumber?: string }) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const faqs = [
        {
            q: 'Apakah saya perlu membeli alat atau mesin kasir khusus?',
            a: 'Tidak perlu! Aplikasi KasirSewa dapat dijalankan dari perangkat apa pun yang Anda miliki: HP Android, Tablet, Laptop, maupun Komputer PC Windows/Mac.'
        },
        {
            q: 'Bagaimana jika koneksi internet di toko terputus saat transaksi?',
            a: 'Sistem KasirSewa dilengkapi Offline Buffering. Transaksi kasir tetap dapat berjalan lancar saat offline dan otomatis melakukan sinkronisasi data ke cloud server saat internet terhubung kembali.'
        },
        {
            q: 'Apakah data transaksi dan keuangan toko saya aman dan privat?',
            a: 'Sangat aman! Setiap tenant/toko memiliki isolasi data database 100% terpisah (Tenant-Level Data Isolation) dengan enkripsi SSL 256-bit dan cadangan backup otomatis setiap hari.'
        },
        {
            q: 'Apakah saya bisa mengelola lebih dari 1 cabang outlet?',
            a: 'Bisa! Paket Pro dan Enterprise memungkinkan Anda menambah cabang outlet, melakukan transfer stok antar-cabang, dan melihat gabungan laporan omset seluruh cabang dalam 1 dashboard.'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
            <Head title="KasirSewa - Platform POS Kasir SaaS Multi-Tenant & Billing Subskripsi" />

            {/* TOP NAVIGATION BAR */}
            <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 border border-blue-400/40 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Building2 className="w-4 sm:w-5 h-4 sm:h-5" />
                        </div>
                        <div>
                            <span className="font-black text-sm sm:text-lg text-white tracking-tight">KasirSewa<span className="text-blue-500">.SaaS</span></span>
                            <span className="text-[8px] sm:text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full ml-1 sm:ml-2 font-bold hidden sm:inline-block">Multi-Tenant</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <Link
                            href="/login"
                            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs sm:text-xs rounded-lg sm:rounded-xl transition"
                        >
                            Masuk
                        </Link>
                        <Link
                            href="/register"
                            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-lg sm:rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1 sm:gap-2 transition active:scale-95"
                        >
                            <span className="hidden sm:inline">Daftar Toko</span>
                            <span className="sm:hidden">Daftar</span>
                            <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* 1. HERO SECTION */}
            <section className="relative pt-12 sm:pt-16 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] sm:text-xs font-bold text-emerald-400 shadow-xl flex-wrap">
                    🎁 Coba Gratis 7 Hari — Tanpa Kartu Kredit
                </div>

                <div className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-[11px] sm:text-xs font-bold text-blue-400 shadow-xl">
                    <Sparkles className="w-3 sm:w-4 h-3 sm:h-4 text-blue-400" /> Platform SaaS POS Kasir Multi-Tenant Terpercaya
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                    Kelola Toko & Kasir Dalam Satu Platform <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">SaaS Multi-Tenant</span>
                </h1>

                <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Sistem POS Kasir terlengkap berbasis berlangganan dengan isolasi data 100% aman, cetak struk thermal 58mm/80mm, dual screen pembeli, manajemen shift, dan billing invoice otomatis.
                </p>

                <div className="pt-2 sm:pt-4 flex flex-col gap-3 sm:gap-4">
                    <Link
                        href="/register"
                        className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-lg sm:rounded-2xl shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-2 transition active:scale-95"
                    >
                        <span>🚀 Daftar Toko Baru (Trial 7 Hari)</span>
                    </Link>
                    <Link
                        href="/login"
                        className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-2xl transition flex items-center justify-center gap-2"
                    >
                        <span>Masuk ke Akun Toko</span>
                    </Link>
                </div>
            </section>

            {/* 2. STATS BAR */}
            <section className="bg-slate-900/60 border-y border-slate-800/80 py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 gap-4 sm:gap-6 text-center">
                    <div className="space-y-1">
                        <div className="text-xl sm:text-3xl font-black text-white font-mono">150+</div>
                        <div className="text-[11px] sm:text-xs text-slate-400 font-semibold">Toko & Klien SaaS</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xl sm:text-3xl font-black text-emerald-400 font-mono">10K+</div>
                        <div className="text-[11px] sm:text-xs text-slate-400 font-semibold">Transaksi / Hari</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xl sm:text-3xl font-black text-blue-400 font-mono">99.9%</div>
                        <div className="text-[11px] sm:text-xs text-slate-400 font-semibold">Server Uptime SLA</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xl sm:text-3xl font-black text-purple-400 font-mono">Rp 0</div>
                        <div className="text-[11px] sm:text-xs text-slate-400 font-semibold">Setup Awal</div>
                    </div>
                </div>
            </section>

            {/* 3. FEATURE MATRIX SHOWCASE */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8 sm:space-y-12">
                <div className="text-center space-y-2">
                    <span className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest block">FITUR UNGGULAN</span>
                    <h2 className="text-xl sm:text-4xl font-black text-white">Solusi Kasir & Manajemen Toko Serba Otomatis</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 hover:border-blue-500/40 transition">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-500/10 border border-blue-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-400">
                            <Printer className="w-5 sm:w-6 h-5 sm:h-6" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-white">POS Kasir & Struk Thermal</h3>
                        <p className="text-xs sm:text-xs text-slate-400 leading-relaxed">
                            Pencatatan kasir instan dengan cetak struk thermal 58mm/80mm, pencarian barcode, dan pengiriman invoice via WhatsApp.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 hover:border-indigo-500/40 transition">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-400">
                            <Store className="w-5 sm:w-6 h-5 sm:h-6" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-white">Manajemen Multi-Outlet Cabang</h3>
                        <p className="text-xs sm:text-xs text-slate-400 leading-relaxed">
                            Kelola banyak cabang outlet toko dalam 1 dashboard, transfer stok barang antar-cabang, dan kontrol stok opname.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 hover:border-emerald-500/40 transition">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-400">
                            <QrCode className="w-5 sm:w-6 h-5 sm:h-6" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-white">Pembayaran Digital QRIS All-in-One</h3>
                        <p className="text-xs sm:text-xs text-slate-400 leading-relaxed">
                            Terima pembayaran digital GoPay, ShopeePay, OVO, DANA, dan Bank Transfer dengan konfirmasi otomatis Midtrans.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 hover:border-purple-500/40 transition">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-500/10 border border-purple-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-purple-400">
                            <BarChart3 className="w-5 sm:w-6 h-5 sm:h-6" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-white">Laporan Keuangan & Laba Rugi</h3>
                        <p className="text-xs sm:text-xs text-slate-400 leading-relaxed">
                            Grafik penjualan harian, rekapitulasi laba kotor, laporan pengeluaran operasional, dan riwayat shift laci kasir.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 hover:border-amber-500/40 transition">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-400">
                            <Lock className="w-5 sm:w-6 h-5 sm:h-6" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-white">Isolasi Data Multi-Tenant Safe</h3>
                        <p className="text-xs sm:text-xs text-slate-400 leading-relaxed">
                            Arsitektur multi-tenant modern di mana data toko Anda diisolasi 100% aman dan terlindungi dari akses toko lain.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 hover:border-rose-500/40 transition">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-rose-500/10 border border-rose-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-rose-400">
                            <RefreshCw className="w-5 sm:w-6 h-5 sm:h-6" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-white">Subskripsi & Auto Billing WA</h3>
                        <p className="text-xs sm:text-xs text-slate-400 leading-relaxed">
                            Pengingat perpanjangan sewa otomatis via WhatsApp dan invoice digital tanpa ribet transfer manual.
                        </p>
                    </div>
                </div>
            </section>

            {/* 4. PRICING PLANS SECTION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-slate-900 space-y-8 sm:space-y-10">
                <div className="text-center space-y-3 sm:space-y-4">
                    <span className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest block">SKEMA HARGA SEWA PLATFORM</span>
                    <h2 className="text-xl sm:text-4xl font-black text-white">Paket Berlangganan SaaS Hemat & Transparan</h2>
                    <p className="text-[11px] sm:text-sm text-slate-400">Pilih paket yang paling sesuai dengan skala bisnis toko Anda.</p>

                    <div className="inline-flex items-center bg-slate-900 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-800 gap-1 mt-2">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Bayar Bulanan
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center gap-1 ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span>Bayar Tahunan</span>
                            <span className="px-1 sm:px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[8px] sm:text-[10px] font-black rounded-md">Hemat 20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                    {/* PLAN STARTER BASIC */}
                    <div className="bg-slate-900 border border-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-6 flex flex-col justify-between hover:border-blue-500/40 transition shadow-xl">
                        <div className="space-y-3 sm:space-y-4">
                            <span className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest block">STARTER BASIC</span>
                            <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-2xl sm:text-3xl font-black text-white">
                                    {billingCycle === 'yearly' ? 'Rp 79K' : 'Rp 99K'}
                                </span>
                                <span className="text-xs text-slate-400">/ bulan</span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-400">Cocok untuk UMKM & Toko Tunggal</p>
                            <ul className="space-y-2 sm:space-y-2.5 text-[11px] sm:text-xs text-slate-300 border-t border-slate-800 pt-3 sm:pt-4">
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> 1 Outlet Store</li>
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> 3 User Staff Kasir</li>
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> 500 Produk Master</li>
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> Struk Thermal 58mm/80mm</li>
                            </ul>
                        </div>

                        <Link
                            href="/register?plan=starter-basic"
                            className="w-full py-2.5 sm:py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-xs rounded-lg sm:rounded-2xl text-center transition block mt-3 sm:mt-6"
                        >
                            Mulai Trial Gratis
                        </Link>
                    </div>

                    {/* PLAN BUSINESS PRO (POPULAR) */}
                    <div className="bg-slate-900 border-2 border-blue-500 p-5 sm:p-8 rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-6 flex flex-col justify-between relative shadow-2xl shadow-blue-500/10 sm:scale-100 lg:scale-105">
                        <div className="absolute -top-2.5 sm:-top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] sm:text-[10px] font-black uppercase px-3 sm:px-4 py-0.5 sm:py-1 rounded-full shadow-lg">
                            PALING POPULER 🔥
                        </div>
                        <div className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
                            <span className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest block">BUSINESS PRO</span>
                            <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-2xl sm:text-3xl font-black text-white">
                                    {billingCycle === 'yearly' ? 'Rp 159K' : 'Rp 199K'}
                                </span>
                                <span className="text-xs text-slate-400">/ bulan</span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-400">Lengkap untuk toko retail multi cabang</p>
                            <ul className="space-y-2 sm:space-y-2.5 text-[11px] sm:text-xs text-slate-300 border-t border-slate-800 pt-3 sm:pt-4">
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> 3 Outlet Stores Cabang</li>
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> 10 User Staff Kasir</li>
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> 2.500 Produk Master</li>
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> Transfer Stok Cabang</li>
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> Dual Screen Layar Pembeli</li>
                            </ul>
                        </div>

                        <Link
                            href="/register?plan=business-pro"
                            className="w-full py-2.5 sm:py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-xs rounded-lg sm:rounded-2xl text-center shadow-lg shadow-blue-600/30 transition block mt-3 sm:mt-6"
                        >
                            Mulai Trial Gratis
                        </Link>
                    </div>

                    {/* PLAN ENTERPRISE */}
                    <div className="bg-slate-900 border border-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-6 flex flex-col justify-between hover:border-purple-500/40 transition shadow-xl">
                        <div className="space-y-3 sm:space-y-4">
                            <span className="text-[10px] sm:text-xs font-bold text-purple-400 uppercase tracking-widest block">ENTERPRISE UNLIMITED</span>
                            <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-2xl sm:text-3xl font-black text-white">
                                    {billingCycle === 'yearly' ? 'Rp 319K' : 'Rp 399K'}
                                </span>
                                <span className="text-xs text-slate-400">/ bulan</span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-400">Tanpa batas untuk jaringan cabang besar</p>
                            <ul className="space-y-2 sm:space-y-2.5 text-[11px] sm:text-xs text-slate-300 border-t border-slate-800 pt-3 sm:pt-4">
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> Unlimited Outlets & Staff</li>
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> Unlimited Produk & Transaksi</li>
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> Backup Database Otomatis</li>
                                <li className="flex items-center gap-2"><Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" /> Prioritas Support 24/7</li>
                            </ul>
                        </div>

                        <a
                            href={`https://wa.me/${waCsNumber}?text=Halo%20Tim%20KasirSewa,%20saya%20tertarik%20dengan%20paket%20Enterprise%20Unlimited.%20Saya%20ingin%20konsultasi%20lebih%20lanjut.`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 sm:py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-xs rounded-lg sm:rounded-2xl text-center transition block mt-3 sm:mt-6"
                        >
                            Hubungi Sales via WA
                        </a>
                    </div>
                </div>
            </section>

            {/* 5. FAQ ACCORDION SECTION */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-slate-900 space-y-6 sm:space-y-8">
                <div className="text-center space-y-2 sm:space-y-3">
                    <span className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest block">TANYA JAWAB POPULER</span>
                    <h2 className="text-xl sm:text-3xl font-black text-white">Pertanyaan Sering Diajukan (FAQ)</h2>
                </div>

                <div className="space-y-2 sm:space-y-3">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                className="w-full p-3 sm:p-4 text-left font-bold text-[11px] sm:text-sm text-white flex justify-between items-center gap-3 sm:gap-4 cursor-pointer hover:bg-slate-800/50 transition"
                            >
                                <span>{faq.q}</span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${openFaq === idx ? 'rotate-180 text-blue-400' : ''}`} />
                            </button>
                            {openFaq === idx && (
                                <div className="p-3 sm:p-4 pt-0 text-[11px] sm:text-xs text-slate-400 border-t border-slate-800/60 leading-relaxed">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. FLOATING WHATSAPP CS BUTTON */}
            <a
                href={`https://wa.me/${waCsNumber}?text=Halo%20Tim%20KasirSewa,%20saya%20ingin%20tanya%20mengenai%20platform%20SaaS%20POS%20Kasir`}
                target="_blank"
                rel="noreferrer"
                className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 px-3 sm:px-4 py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] sm:text-xs rounded-full shadow-2xl flex items-center gap-1.5 sm:gap-2 transition transform hover:scale-105 active:scale-95"
            >
                <MessageSquare className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-slate-950" />
                <span className="hidden sm:inline">Konsultasi CS via WA</span>
                <span className="sm:hidden">Chat WA</span>
            </a>

            {/* 7. FOOTER */}
            <footer className="border-t border-slate-900 py-8 sm:py-10 bg-slate-950 text-[10px] sm:text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 text-center md:text-left">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-blue-400" />
                        <span className="font-bold text-slate-300">KasirSewa SaaS Multi-Tenant Platform</span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 text-slate-400 font-bold flex-wrap justify-center">
                        <Link href="/login" className="hover:text-white transition">Login Toko</Link>
                        <span className="text-slate-600">•</span>
                        <Link href="/register" className="hover:text-blue-400 transition">Daftar Trial 7 Hari</Link>
                    </div>

                    <div className="font-mono text-[9px] sm:text-[10px] text-slate-600">
                        © {new Date().getFullYear()} KasirSewa • Laravel 12 & React Inertia
                    </div>
                </div>
            </footer>
        </div>
    );
}
