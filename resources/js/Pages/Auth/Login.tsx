import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Lock, Mail, ShieldCheck, AlertCircle, ArrowRight, Sparkles, Building2, UserCheck, KeyRound } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    const fillAccount = (email: string, pass: string) => {
        setData({
            ...data,
            email: email,
            password: pass,
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans selection:bg-blue-500 selection:text-white">
            <Head title="Login Akun - KasirSewa SaaS Platform" />

            <div className="w-full max-w-md space-y-6">
                
                {/* BRAND LOGO CARD */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 border border-blue-400/40 rounded-3xl flex items-center justify-center mx-auto text-white shadow-2xl shadow-blue-500/30">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-[11px] font-bold text-blue-400">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" /> KasirSewa Multi-Tenant SaaS
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white">KasirSewa SaaS Portal</h1>
                    <p className="text-xs text-slate-400 font-medium">Masuk ke Sistem POS Kasir Multi-Tenant & Billing</p>
                </div>

                {/* LOGIN FORM CARD */}
                <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
                    {errors.email && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errors.email}</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">Alamat Email</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                <input
                                    type="email"
                                    required
                                    autoFocus
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@email.com"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">Kata Sandi (Password)</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                <input
                                    type="password"
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition font-medium"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 active:scale-95 mt-2"
                        >
                            <span>{processing ? 'Memverifikasi Server...' : 'Masuk Ke Akun SaaS'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    {/* QUICK DEMO ACCOUNT SELECTOR */}
                    <div className="pt-4 border-t border-slate-800 space-y-2.5">
                        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                            <span>Pilih Akun Demo (Klik untuk Auto-Fill):</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <button
                                type="button"
                                onClick={() => fillAccount('admin@example.com', 'KasirSewaSaaS2026!')}
                                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition cursor-pointer group"
                            >
                                <div className="font-bold text-blue-400 group-hover:text-blue-300">⚡ Super Admin</div>
                                <div className="text-[10px] text-slate-500">Kelola Tenant & Billing</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => fillAccount('owner@example.test', 'password')}
                                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition cursor-pointer group"
                            >
                                <div className="font-bold text-emerald-400 group-hover:text-emerald-300">🏪 Owner BerkahPRO</div>
                                <div className="text-[10px] text-slate-500">Tenant 1 (Full Access)</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => fillAccount('sinarjaya@example.test', 'password')}
                                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition cursor-pointer group"
                            >
                                <div className="font-bold text-purple-400 group-hover:text-purple-300">🏬 Owner SinarJaya</div>
                                <div className="text-[10px] text-slate-500">Tenant 2 (Isolated)</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => fillAccount('cashier@example.test', 'password')}
                                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition cursor-pointer group"
                            >
                                <div className="font-bold text-amber-400 group-hover:text-amber-300">🛒 Staff Kasir</div>
                                <div className="text-[10px] text-slate-500">POS Operations</div>
                            </button>
                        </div>
                    </div>

                </div>

                <p className="text-[10px] text-center text-slate-600 font-mono">
                    KasirSewa SaaS Platform • Powered by Laravel 12 & React Inertia
                </p>
            </div>
        </div>
    );
}
