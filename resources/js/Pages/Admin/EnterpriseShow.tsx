import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Copy, Eye, EyeOff, CheckCircle2, Calendar } from 'lucide-react';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    domain: string;
    status: string;
    created_at: string;
    owner: {
        id: number;
        name: string;
        email: string;
    };
    company: {
        id: number;
        name: string;
        registration_number: string;
    };
    subscription: {
        id: number;
        status: string;
        billing_cycle: string;
        starts_at: string;
        expires_at: string;
        trial_ends_at: string | null;
        plan: {
            id: number;
            name: string;
            monthly_price: number;
        };
    };
}

interface EnterpriseShowProps {
    tenant: Tenant;
    dashboardRoute: string;
    reset_link?: string;
    owner_email?: string;
}

export default function EnterpriseShow({ tenant, dashboardRoute, reset_link, owner_email }: EnterpriseShowProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const tempPassword = new URLSearchParams(window.location.search).get('temp_password') || '[PASSWORD]';
    const loginUrl = `https://${tenant.domain}/super-admin/login`;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const trialEndsAt = tenant.subscription.trial_ends_at 
        ? new Date(tenant.subscription.trial_ends_at).toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
            <Head title="Detail Enterprise - KasirSewa Admin" />

            <div className="max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="mb-8">
                    <Link
                        href={dashboardRoute}
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Dashboard
                    </Link>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white">Enterprise Berhasil Didaftarkan</h1>
                                <p className="text-sm text-emerald-400 font-bold">✓ Semua data telah tersimpan</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* MAIN CONTENT */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* TOKO INFO */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                            <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-400" />
                                Informasi Toko
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                    <span className="text-slate-400">Nama Toko:</span>
                                    <span className="font-bold text-white">{tenant.name}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                    <span className="text-slate-400">Domain:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-blue-400">{tenant.domain}</code>
                                        <button
                                            onClick={() => copyToClipboard(tenant.domain, 'domain')}
                                            className="p-1.5 hover:bg-slate-800 rounded-lg transition"
                                            title="Salin domain"
                                        >
                                            <Copy className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                    <span className="text-slate-400">Slug:</span>
                                    <code className="font-mono text-slate-300">{tenant.slug}</code>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                    <span className="text-slate-400">No. Registrasi:</span>
                                    <span className="font-bold text-white">{tenant.company.registration_number}</span>
                                </div>
                            </div>
                        </div>

                        {/* OWNER INFO */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                            <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                <Mail className="w-5 h-5 text-purple-400" />
                                Informasi Pemilik
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                    <span className="text-slate-400">Nama:</span>
                                    <span className="font-bold text-white">{tenant.owner.name}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                    <span className="text-slate-400">Email:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-blue-400">{tenant.owner.email}</span>
                                        <button
                                            onClick={() => copyToClipboard(tenant.owner.email, 'email')}
                                            className="p-1.5 hover:bg-slate-800 rounded-lg transition"
                                            title="Salin email"
                                        >
                                            <Copy className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SUBSCRIPTION INFO */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                            <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-amber-400" />
                                Informasi Subscription
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                    <span className="text-slate-400">Paket:</span>
                                    <span className="font-bold text-purple-400">{tenant.subscription.plan.name}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                    <span className="text-slate-400">Status:</span>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        tenant.subscription.status === 'trial' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                    }`}>
                                        {tenant.subscription.status === 'trial' ? '🎁 TRIAL' : '✓ ACTIVE'}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                    <span className="text-slate-400">Siklus:</span>
                                    <span className="font-bold text-white capitalize">{tenant.subscription.billing_cycle}</span>
                                </div>
                                {trialEndsAt && (
                                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                        <span className="text-slate-400">Trial Berakhir:</span>
                                        <span className="font-bold text-amber-400">{trialEndsAt}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR - LOGIN CREDENTIALS */}
                    <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-emerald-500/30 p-6 rounded-3xl shadow-2xl sticky top-6 space-y-4">
                            <div className="text-center space-y-1 pb-4 border-b border-slate-700">
                                <h3 className="font-black text-lg text-white">Login Credentials</h3>
                                <p className="text-xs text-slate-400">Bagikan ke pemilik toko</p>
                            </div>

                            <div className="space-y-3">
                                {/* LOGIN URL */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 block">Login URL</label>
                                    <div className="flex gap-1.5">
                                        <input
                                            type="text"
                                            readOnly
                                            value={loginUrl}
                                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-blue-400"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(loginUrl, 'url')}
                                            className={`px-3 py-2 rounded-lg transition font-bold text-xs ${
                                                copied === 'url'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                            }`}
                                        >
                                            {copied === 'url' ? '✓' : 'Salin'}
                                        </button>
                                    </div>
                                </div>

                                {/* EMAIL */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 block">Email</label>
                                    <div className="flex gap-1.5">
                                        <input
                                            type="text"
                                            readOnly
                                            value={tenant.owner.email}
                                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-300"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(tenant.owner.email, 'email')}
                                            className={`px-3 py-2 rounded-lg transition font-bold text-xs ${
                                                copied === 'email'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                            }`}
                                        >
                                            {copied === 'email' ? '✓' : 'Salin'}
                                        </button>
                                    </div>
                                </div>

                                {/* TEMP PASSWORD */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 block">Password Sementara</label>
                                    <div className="flex gap-1.5">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            readOnly
                                            value={tempPassword}
                                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-rose-400"
                                        />
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(tempPassword, 'password')}
                                            className={`px-3 py-2 rounded-lg transition font-bold text-xs ${
                                                copied === 'password'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                            }`}
                                        >
                                            {copied === 'password' ? '✓' : 'Salin'}
                                        </button>
                                    </div>
                                </div>

                                {/* PASSWORD RESET LINK */}
                                {reset_link && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 block">Link Reset Password (Lebih Aman)</label>
                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                readOnly
                                                value={reset_link}
                                                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-blue-400 truncate"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(reset_link, 'reset_link')}
                                                className={`px-3 py-2 rounded-lg transition font-bold text-xs whitespace-nowrap ${
                                                    copied === 'reset_link'
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                                }`}
                                            >
                                                {copied === 'reset_link' ? '✓' : 'Salin'}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-500 italic">Kirim link ini ke owner untuk set password sendiri</p>
                                    </div>
                                )}
                            </div>

                            {/* INFO */}
                            <div className="mt-6 pt-4 border-t border-slate-700 space-y-2 text-[11px] text-slate-400">
                                <p className="flex items-start gap-2">
                                    <span className="font-bold text-xs text-amber-400 mt-0.5">⚠</span>
                                    <span>Password sementara wajib diubah saat login pertama kali</span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="font-bold text-xs text-blue-400 mt-0.5">ℹ</span>
                                    <span>Tekan tombol "Salin" atau copy manual credentials di atas</span>
                                </p>
                            </div>

                            {/* ACTION */}
                            <div className="mt-6 pt-4 border-t border-slate-700 space-y-2">
                                <a
                                    href={`https://wa.me/6285179790890?text=Hi%20Admin%20KasirSewa%2C%20saya%20sudah%20daftarkan%20enterprise%20%3A%20${tenant.name}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl transition text-center"
                                >
                                    Notifikasi via WA
                                </a>
                                <Link
                                    href={dashboardRoute}
                                    className="block w-full py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs rounded-xl transition text-center"
                                >
                                    Kembali ke Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
