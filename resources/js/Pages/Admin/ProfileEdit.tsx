import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CheckCircle2, KeyRound, Save, UserCircle } from 'lucide-react';

type Profile = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    created_at?: string | null;
};

export default function ProfileEdit({ profile }: { profile: Profile }) {
    const { flash } = usePage<any>().props;
    const { data, setData, put, processing, errors } = useForm({
        name: profile.name || '',
        email: profile.email || '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        put('/admin/profile');
    };

    return (
        <AppLayout title="Edit Profil Super Admin">
            <Head title="Edit Profil Super Admin - KasirSewa" />
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                            {profile.avatar ? <img src={profile.avatar} alt="Avatar" className="w-full h-full rounded-2xl object-cover" /> : <UserCircle className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Edit Profil Super Admin</h1>
                            <p className="text-xs text-slate-400 mt-1">Perbarui nama, email, dan kata sandi akun administrator.</p>
                        </div>
                    </div>
                </div>

                {flash?.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> {flash.success}
                    </div>
                )}

                <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-2">Nama Lengkap</label>
                        <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
                        {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-2">Email</label>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
                        {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
                    </div>

                    <div className="border-t border-slate-800 pt-5">
                        <div className="flex items-center gap-2 mb-4"><KeyRound className="w-4 h-4 text-amber-400" /><h2 className="text-sm font-bold text-white">Ganti Kata Sandi <span className="text-xs text-slate-500 font-normal">(opsional)</span></h2></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Kata Sandi Baru</label>
                                <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
                                {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Konfirmasi Sandi Baru</label>
                                <input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs font-bold text-slate-300 mb-2">Kata Sandi Saat Ini <span className="text-slate-500 font-normal">(wajib jika mengganti sandi)</span></label>
                            <input type="password" value={data.current_password} onChange={(e) => setData('current_password', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
                            {errors.current_password && <p className="text-xs text-rose-400 mt-1">{errors.current_password}</p>}
                        </div>
                    </div>

                    <button type="submit" disabled={processing} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition">
                        <Save className="w-4 h-4" /> {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}
