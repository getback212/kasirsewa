import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Smartphone, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';

interface VerifyOtpProps {
    user: {
        name: string;
        email: string;
        phone: string | null;
        phone_verified_at: string | null;
        is_verified: boolean;
    };
}

export default function VerifyOtp({ user }: VerifyOtpProps) {
    const { flash, errors } = usePage().props as any;

    const phoneForm = useForm({
        phone: user.phone || '',
    });

    const otpForm = useForm({
        otp: '',
    });

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        phoneForm.post('/verify-otp/send');
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        otpForm.post('/verify-otp/verify');
    };

    return (
        <AppLayout title="Verifikasi WhatsApp">
            <Head title="Verifikasi Nomor WhatsApp KasirSewa" />

            <div className="max-w-2xl mx-auto space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Verifikasi Nomor WhatsApp Akun Toko</h1>
                            <p className="text-xs text-slate-400">Verifikasi 6-Digit OTP WhatsApp untuk menerima notifikasi otomatis transaksi & tagihan kasir.</p>
                        </div>
                    </div>
                </div>

                {/* STATUS BADGE */}
                {user.is_verified ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-3xl text-center space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                        <h2 className="text-lg font-black text-white">Nomor WhatsApp 100% Terverifikasi!</h2>
                        <p className="text-xs text-slate-300">
                            Nomor WhatsApp <strong>+{user.phone}</strong> telah diverifikasi pada {user.phone_verified_at}.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* STEP 1: INPUT NOMOR WA & KIRIM OTP */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">1</span>
                                <h3 className="font-bold text-white text-sm">Nomor WhatsApp Aktif</h3>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Nomor WhatsApp (Contoh: 08123456789)</label>
                                    <input
                                        type="text"
                                        required
                                        value={phoneForm.data.phone}
                                        onChange={(e) => phoneForm.setData('phone', e.target.value)}
                                        placeholder="081234567890"
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none font-mono"
                                    />
                                    {phoneForm.errors.phone && <p className="text-xs text-rose-400 mt-1">{phoneForm.errors.phone}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={phoneForm.processing}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${phoneForm.processing ? 'animate-spin' : ''}`} />
                                    <span>{phoneForm.processing ? 'Mengirim Kode...' : 'Kirim Kode OTP WhatsApp'}</span>
                                </button>
                            </form>
                        </div>

                        {/* STEP 2: MASUKKAN KODE OTP 6-DIGIT */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">2</span>
                                <h3 className="font-bold text-white text-sm">Masukkan OTP 6-Digit</h3>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Kode OTP (6 Angka)</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        required
                                        value={otpForm.data.otp}
                                        onChange={(e) => otpForm.setData('otp', e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="123456"
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-lg font-mono font-black text-center text-amber-400 tracking-widest focus:border-emerald-500 focus:outline-none"
                                    />
                                    {otpForm.errors.otp && <p className="text-xs text-rose-400 mt-1">{otpForm.errors.otp}</p>}
                                    {errors.otp && <p className="text-xs text-rose-400 mt-1">{errors.otp}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={otpForm.processing}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>{otpForm.processing ? 'Memverifikasi...' : 'Verifikasi OTP Sekarang'}</span>
                                </button>
                            </form>
                        </div>

                    </div>
                )}

            </div>
        </AppLayout>
    );
}
