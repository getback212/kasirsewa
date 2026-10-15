import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Building2, Sparkles, AlertCircle, ArrowRight, Store, User, Mail, Lock, Phone, CreditCard, CheckCircle2 } from 'lucide-react';

interface Plan {
    id: number;
    name: string;
    description: string;
    monthly_price: number;
    yearly_price: number;
    max_users: number;
    max_stores: number;
    max_products: number;
}

interface RegisterProps {
    plans: Plan[];
    selected_plan_id?: number;
}

export default function Register({ plans = [], selected_plan_id }: RegisterProps) {
    const { data, setData, post, processing, errors } = useForm({
        store_name: '',
        owner_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        plan_id: selected_plan_id || plans[0]?.id || 1,
        billing_cycle: 'monthly',
    });

    const selectedPlan = plans.find(p => p.id === data.plan_id);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans selection:bg-blue-500 selection:text-white">
            <Head title="Daftar Toko Baru - Trial Gratis 7 Hari KasirSewa" />

            <div className="w-full max-w-xl space-y-6 my-8">
                
                {/* BRAND LOGO HEADER */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 border border-blue-400/40 rounded-3xl flex items-center justify-center mx-auto text-white shadow-2xl shadow-blue-500/30">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] font-bold text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Trial Gratis 7 Hari (Paket {selectedPlan?.name ?? 'Starter'}) • Tanpa Kartu Kredit
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white">Daftarkan Toko Anda di KasirSewa</h1>
                    <p className="text-xs text-slate-400 font-medium">Platform POS Kasir SaaS Multi-Tenant & Multi-Outlet Terpercaya</p>
                </div>

                {/* REGISTER FORM CARD */}
                <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
                    
                    {Object.keys(errors).length > 0 && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 space-y-1">
                            <div className="font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> Terjadi Kesalahan Input:
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-2">
                                {Object.values(errors).map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4 text-xs">
                        
                        {/* STORE NAME & OWNER NAME */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold text-slate-300 mb-1.5">Nama Toko / Usaha</label>
                                <div className="relative">
                                    <Store className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                    <input
                                        type="text"
                                        required
                                        value={data.store_name}
                                        onChange={(e) => setData('store_name', e.target.value)}
                                        placeholder="Contoh: Toko Sembako Berkah"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-blue-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-300 mb-1.5">Nama Pemilik / Owner</label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                    <input
                                        type="text"
                                        required
                                        value={data.owner_name}
                                        onChange={(e) => setData('owner_name', e.target.value)}
                                        placeholder="Nama Lengkap Anda"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-blue-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* EMAIL & PHONE */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold text-slate-300 mb-1.5">Alamat Email Owner</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                    <input
                                        type="email"
                                        required
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="owner@toko.com"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-blue-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-300 mb-1.5">No. WhatsApp / HP</label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                    <input
                                        type="text"
                                        required
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="081234567890"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-blue-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PASSWORDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold text-slate-300 mb-1.5">Kata Sandi (Password)</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                    <input
                                        type="password"
                                        required
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Minimal 6 karakter"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-blue-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-300 mb-1.5">Konfirmasi Sandi</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                    <input
                                        type="password"
                                        required
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Ulangi password"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-blue-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PLAN SELECTOR - Only show for Enterprise or if no plan selected */}
                        {(selected_plan_id === 3 || !selected_plan_id) && (
                            <div>
                                <label className="block font-bold text-slate-300 mb-1.5">Pilih Paket SaaS Berlangganan</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {plans.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setData('plan_id', p.id)}
                                            className={`p-3 border rounded-2xl text-left transition cursor-pointer ${
                                                data.plan_id === p.id
                                                    ? 'bg-blue-600/10 border-blue-500 text-blue-400 ring-2 ring-blue-500/30'
                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="font-bold text-white text-xs">{p.name}</div>
                                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                                                Rp {Number(p.monthly_price).toLocaleString('id-ID')}/bln
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">
                                                {p.max_stores} Store • {p.max_users} Staff
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 active:scale-95 mt-4"
                        >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{processing ? 'Mendaftarkan Toko...' : 'Mulai Masa Trial 7 Hari Gratis'}</span>
                        </button>

                        <div className="relative my-4 flex items-center justify-center">
                            <div className="border-t border-slate-800 w-full"></div>
                            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider absolute">atau</span>
                        </div>

                        <a
                            href={`/auth/google/redirect?plan_id=${data.plan_id}&billing_cycle=${data.billing_cycle}`}
                            className="w-full py-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-700/60 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
                                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                                <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                            </svg>
                            <span>Daftar Toko Instan via Google (Trial 7 Hari)</span>
                        </a>
                    </form>

                    <div className="text-center pt-2 border-t border-slate-800 text-slate-400 text-xs">
                        Sudah punya akun toko?{' '}
                        <Link href="/login" className="text-blue-400 font-bold hover:underline">
                            Masuk Ke Akun →
                        </Link>
                    </div>

                </div>

            </div>
        </div>
    );
}
