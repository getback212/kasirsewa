import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, KeyRound, Building2 } from 'lucide-react';

export default function SuperAdminLogin() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = React.useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/super-admin/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans selection:bg-purple-500 selection:text-white">
            <Head title="Super Admin SaaS Portal - KasirSewa" />

            <div className="w-full max-w-md space-y-6">
                {/* BRAND LOGO CARD */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/40 rounded-3xl flex items-center justify-center mx-auto text-white shadow-2xl shadow-purple-500/30">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-[11px] font-bold text-purple-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Executive Platform Owner Portal
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white">KasirSewa Super Admin</h1>
                    <p className="text-xs text-slate-400 font-medium">Portal Otentikasi Khusus Pengelola & Pemilik SaaS</p>
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
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Super Admin</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                <input
                                    type="email"
                                    required
                                    autoFocus
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none transition font-medium"
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
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none transition font-medium"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 active:scale-95 mt-2"
                        >
                            <span>{processing ? 'Memverifikasi Akses Server...' : 'Masuk Ke Dashboard Super Admin'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="pt-3 border-t border-slate-800 text-center">
                        <a href="/login" className="text-xs text-slate-400 hover:text-blue-400 font-bold transition">
                            ← Kembali ke Login Tenant / Kasir Toko
                        </a>
                    </div>
                </div>

                <p className="text-[10px] text-center text-slate-600 font-mono">
                    KasirSewa SaaS Dedicated Super Admin Portal • Strict Security Isolation
                </p>
            </div>
        </div>
    );
}
