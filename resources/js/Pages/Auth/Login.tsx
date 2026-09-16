import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Lock, Mail, ShoppingBag, AlertCircle, ArrowRight } from 'lucide-react';

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

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans selection:bg-emerald-500 selection:text-white">
            <Head title="Login Akun - RetailPRO POS" />

            <div className="w-full max-w-md space-y-6">
                
                {/* BRAND LOGO CARD */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400 shadow-xl">
                        <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white">RetailPRO POS System</h1>
                    <p className="text-xs text-slate-400 font-medium">Masuk ke Sistem Kasir & Manajemen Toko</p>
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
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition"
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
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 active:scale-95 mt-2"
                        >
                            <span>{processing ? 'Memverifikasi Server...' : 'Masuk Ke Akun'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                <p className="text-[10px] text-center text-slate-600 font-mono">
                    Protected by Server-Side Spatie RBAC & Encryption
                </p>
            </div>
        </div>
    );
}
