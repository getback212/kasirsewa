import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Lock, Mail, AlertCircle, ArrowRight, Sparkles, Building2, KeyRound } from 'lucide-react';

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
                            <span>{processing ? 'Memverifikasi Server...' : 'Masuk Ke Akun Toko'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="relative my-4 flex items-center justify-center">
                            <div className="border-t border-slate-800 w-full"></div>
                            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider absolute">atau</span>
                        </div>

                        <a
                            href="/auth/google/redirect"
                            className="w-full py-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-700/60 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
                                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                                <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                            </svg>
                            <span>Masuk Lebih Cepat dengan Google</span>
                        </a>
                    </form>

                    <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                        Belum punya akun toko?{' '}
                        <a href="/register" className="text-blue-400 font-bold hover:underline">
                            Daftar Toko Baru (Trial 7 Hari Gratis) →
                        </a>
                    </div>

                </div>

                <p className="text-[10px] text-center text-slate-600 font-mono">
                    KasirSewa SaaS Platform • Powered by Laravel 12 & React Inertia
                </p>
            </div>
        </div>
    );
}
