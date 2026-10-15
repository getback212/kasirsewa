import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Building2, Mail, Phone, MapPin, User, CheckCircle2 } from 'lucide-react';

interface Plan {
    id: number;
    name: string;
    monthly_price: number;
    yearly_price: number;
}

interface EnterpriseRegistrationProps {
    plan: Plan;
    storeRoute: string;
    dashboardRoute: string;
}

export default function EnterpriseRegistration({ plan, storeRoute, dashboardRoute }: EnterpriseRegistrationProps) {
    const { data, setData, post, processing, errors } = useForm({
        store_name: '',
        owner_name: '',
        owner_email: '',
        owner_phone: '',
        outlet_address: '',
        billing_cycle: 'monthly',
        subscription_status: 'active',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(storeRoute);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
            <Head title="Daftarkan Enterprise - KasirSewa Admin" />

            <div className="max-w-2xl mx-auto">
                {/* HEADER */}
                <div className="mb-8">
                    <Link
                        href={dashboardRoute}
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Dashboard
                    </Link>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center text-white">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-black text-white">Daftarkan Enterprise</h1>
                        </div>
                        <p className="text-slate-400 text-sm">Paket: <span className="font-bold text-purple-400">{plan?.name}</span></p>
                    </div>
                </div>

                {/* FORM CARD */}
                <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
                    
                    {Object.keys(errors).length > 0 && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 space-y-1">
                            <div className="font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> Terjadi Kesalahan:
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 pl-2">
                                {Object.values(errors).map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        
                        {/* TOKO INFO */}
                        <div className="space-y-3 pb-5 border-b border-slate-800">
                            <h3 className="font-bold text-sm text-slate-300">Informasi Toko</h3>
                            
                            <div>
                                <label className="block font-bold text-slate-400 mb-1.5 text-xs">Nama Toko / Perusahaan</label>
                                <div className="relative">
                                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                    <input
                                        type="text"
                                        required
                                        value={data.store_name}
                                        onChange={(e) => setData('store_name', e.target.value)}
                                        placeholder="Contoh: PT Retail Indonesia"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-purple-500 focus:outline-none transition text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-400 mb-1.5 text-xs">Alamat Outlet Pusat</label>
                                <div className="relative">
                                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                    <textarea
                                        required
                                        value={data.outlet_address}
                                        onChange={(e) => setData('outlet_address', e.target.value)}
                                        placeholder="Jl. Merdeka No. 123, Jakarta Pusat"
                                        rows={3}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-purple-500 focus:outline-none transition text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* OWNER INFO */}
                        <div className="space-y-3 pb-5 border-b border-slate-800">
                            <h3 className="font-bold text-sm text-slate-300">Informasi Pemilik</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-slate-400 mb-1.5 text-xs">Nama Pemilik</label>
                                    <div className="relative">
                                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                        <input
                                            type="text"
                                            required
                                            value={data.owner_name}
                                            onChange={(e) => setData('owner_name', e.target.value)}
                                            placeholder="Nama Lengkap"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-purple-500 focus:outline-none transition text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-400 mb-1.5 text-xs">Email Pemilik</label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                        <input
                                            type="email"
                                            required
                                            value={data.owner_email}
                                            onChange={(e) => setData('owner_email', e.target.value)}
                                            placeholder="owner@toko.com"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-purple-500 focus:outline-none transition text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-400 mb-1.5 text-xs">No. WhatsApp Pemilik</label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                    <input
                                        type="tel"
                                        required
                                        value={data.owner_phone}
                                        onChange={(e) => setData('owner_phone', e.target.value)}
                                        placeholder="628xxxxxxxxxx"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-purple-500 focus:outline-none transition text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SUBSCRIPTION */}
                        <div className="space-y-3 pb-5 border-b border-slate-800">
                            <h3 className="font-bold text-sm text-slate-300">Pengaturan Subscription</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-slate-400 mb-1.5 text-xs">Siklus Pembayaran</label>
                                    <select
                                        value={data.billing_cycle}
                                        onChange={(e) => setData('billing_cycle', e.target.value as 'monthly' | 'yearly')}
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-purple-500 focus:outline-none transition text-sm"
                                    >
                                        <option value="monthly">Bulanan (Rp {plan?.monthly_price?.toLocaleString('id-ID')})</option>
                                        <option value="yearly">Tahunan (Rp {plan?.yearly_price?.toLocaleString('id-ID')})</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-400 mb-1.5 text-xs">Status Subscription</label>
                                    <select
                                        value={data.subscription_status}
                                        onChange={(e) => setData('subscription_status', e.target.value as 'trial' | 'active')}
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-purple-500 focus:outline-none transition text-sm"
                                    >
                                        <option value="trial">Trial 7 Hari Gratis</option>
                                        <option value="active">Langsung Aktif</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SUBMIT */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-95"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {processing ? 'Memproses...' : 'Daftarkan Enterprise'}
                            </button>
                            <Link
                                href={dashboardRoute}
                                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl transition"
                            >
                                Batal
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
