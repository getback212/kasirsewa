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
                            Masuk ke Toko
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

            {/* 1. HERO SECTION */}
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
                        <span>Masuk ke Akun Toko</span>
                    </Link>
                </div>
            </section>

            {/* 2. STATS BAR */}
            <section className="bg-slate-900/60 border-y border-slate-800/80 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div className="space-y-1">
                        <div className="text-2xl sm:text-3xl font-black text-white font-mono">150+</div>
                        <div className="text-xs text-slate-400 font-semibold">Toko & Klien SaaS Terdaftar</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">10.000+</div>
                        <div className="text-xs text-slate-400 font-semibold">Transaksi Kasir / Hari</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">99.9%</div>
                        <div className="text-xs text-slate-400 font-semibold">Server Uptime SLA</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">Rp 0</div>
                        <div className="text-xs text-slate-400 font-semibold">Biaya Setup Awal</div>
                    </div>
                </div>
            </section>

            {/* 3. FEATURE MATRIX SHOWCASE */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
                <div className="text-center space-y-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">FITUR UNGGULAN APLIKASI</span>
                    <h2 className="text-2xl sm:text-4xl font-black text-white">Solusi Kasir & Manajemen Toko Serba Otomatis</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-blue-500/40 transition">
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400">
                            <Printer className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-base text-white">POS Kasir & Struk Thermal</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Pencatatan kasir instan dengan cetak struk thermal 58mm/80mm, pencarian barcode, dan pengiriman invoice via WhatsApp.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/40 transition">
                        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400">
                            <Store className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-base text-white">Manajemen Multi-Outlet Cabang</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Kelola banyak cabang outlet toko dalam 1 dashboard, transfer stok barang antar-cabang, dan kontrol stok opname.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-emerald-500/40 transition">
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400">
                            <QrCode className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-base text-white">Pembayaran Digital QRIS All-in-One</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Terima pembayaran digital GoPay, ShopeePay, OVO, DANA, dan Bank Transfer dengan konfirmasi otomatis Midtrans.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-purple-500/40 transition">
                        <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-base text-white">Laporan Keuangan & Laba Rugi</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Grafik penjualan harian, rekapitulasi laba kotor, laporan pengeluaran operasional, dan riwayat shift laci kasir.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-amber-500/40 transition">
                        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-base text-white">Isolasi Data Multi-Tenant Safe</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Arsitektur multi-tenant modern di mana data toko Anda diisolasi 100% aman dan terlindungi dari akses toko lain.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-rose-500/40 transition">
                        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400">
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-base text-white">Subskripsi & Auto Billing WA</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Pengingat perpanjangan sewa otomatis via WhatsApp dan invoice digital tanpa ribet transfer manual.
                        </p>
                    </div>
                </div>
            </section>

            {/* 4. PRICING PLANS SECTION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900 space-y-10">
                <div className="text-center space-y-4">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">SKEMA HARGA SEWA PLATFORM</span>
                    <h2 className="text-2xl sm:text-4xl font-black text-white">Paket Berlangganan SaaS Hemat & Transparan</h2>
                    <p className="text-xs sm:text-sm text-slate-400">Pilih paket yang paling sesuai dengan skala bisnis toko Anda.</p>

                    <div className="inline-flex items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1 mt-2">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Bayar Bulanan
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span>Bayar Tahunan</span>
                            <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-md">Hemat 20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* PLAN STARTER BASIC */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 flex flex-col justify-between hover:border-blue-500/40 transition shadow-xl">
                        <div className="space-y-4">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">STARTER BASIC</span>
                            <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-3xl font-black text-white">
                                    {billingCycle === 'yearly' ? 'Rp 79.000' : 'Rp 99.000'}
                                </span>
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
                                <span className="text-3xl font-black text-white">
                                    {billingCycle === 'yearly' ? 'Rp 159.000' : 'Rp 199.000'}
                                </span>
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
                                <span className="text-3xl font-black text-white">
                                    {billingCycle === 'yearly' ? 'Rp 319.000' : 'Rp 399.000'}
                                </span>
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

            {/* 5. FAQ ACCORDION SECTION */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-900 space-y-8">
                <div className="text-center space-y-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">TANYA JAWAB POPULER</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">Pertanyaan Sering Diajukan (FAQ)</h2>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-white flex justify-between items-center gap-4 cursor-pointer"
                            >
                                <span>{faq.q}</span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-400' : ''}`} />
                            </button>
                            {openFaq === idx && (
                                <div className="p-4 pt-0 text-xs text-slate-400 border-t border-slate-800/60 leading-relaxed">
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
                className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-full shadow-2xl flex items-center gap-2 transition transform hover:scale-105"
            >
                <MessageSquare className="w-4 h-4 fill-slate-950" />
                <span>Konsultasi CS via WA</span>
            </a>

            {/* 7. FOOTER */}
            <footer className="border-t border-slate-900 py-10 bg-slate-950 text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-slate-300">KasirSewa SaaS Multi-Tenant Platform</span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-400 font-bold">
                        <Link href="/login" className="hover:text-white transition">Login Toko</Link>
                        <Link href="/register" className="hover:text-blue-400 transition">Daftar Trial 14 Hari</Link>
                    </div>

                    <div className="font-mono text-[10px] text-slate-600">
                        © {new Date().getFullYear()} KasirSewa • Powered by Laravel 12 & React Inertia
                    </div>
                </div>
            </footer>
        </div>
    );
}
