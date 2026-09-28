import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Sparkles, CheckCircle2, Phone, Mail, Send, Clock, ShieldCheck, Cpu } from 'lucide-react';
import type { PageProps } from '@/Types';

interface SettingsData {
    wa_gateway_url: string;
    wa_api_key: string;
    wa_cs_number: string;
    enable_wa_notifications: boolean;
    enable_email_notifications: boolean;
    scheduler_status: string;
}

interface NotificationSettingsPageProps extends PageProps {
    settings: SettingsData;
}

export default function NotificationSettingsIndex({ settings }: NotificationSettingsPageProps) {
    const { flash } = usePage<NotificationSettingsPageProps>().props;

    const form = useForm({
        wa_gateway_url: settings?.wa_gateway_url || 'https://api.fonnte.com/send',
        wa_api_key: settings?.wa_api_key || '',
        wa_cs_number: settings?.wa_cs_number || '6281234567890',
        enable_wa_notifications: settings?.enable_wa_notifications !== false,
        enable_email_notifications: settings?.enable_email_notifications !== false,
    });

    const testForm = useForm({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/notification-settings', {
            preserveScroll: true,
        });
    };

    const handleTestSend = (e: React.FormEvent) => {
        e.preventDefault();
        testForm.post('/admin/notification-settings/test', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout title="Notifikasi WA & Email SaaS">
            <Head title="Konfigurasi Automation Scheduler & Multi-Channel Billing Reminders - Super Admin" />

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-400" /> Automation Scheduler & Multi-Channel Billing Reminders
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Kelola pengiriman notifikasi pengingat billing otomatis (H-7, H-3, H-1, Grace Period, & Suspension) via Portal, WhatsApp Gateway, dan Email.
                        </p>
                    </div>

                    <form onSubmit={handleTestSend}>
                        <button
                            type="submit"
                            disabled={testForm.processing}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                            <span>{testForm.processing ? 'Mengirim...' : 'Tes Kirim Notifikasi'}</span>
                        </button>
                    </form>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* STATUS AUTOMATION SCHEDULER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" /> Status Engine Automation Scheduler
                        </h3>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-mono text-[10px] font-bold uppercase">
                            ● SCHEDULER ONLINE (24/7)
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Jadwal Eksekusi Harian</span>
                            <p className="font-extrabold text-white font-mono">00:00 WIB (Midnight)</p>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Tahap Pengingat Harian</span>
                            <p className="font-extrabold text-emerald-400 font-mono">H-7, H-3, H-1 Billing</p>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Eksekusi Status Otomatis</span>
                            <p className="font-extrabold text-amber-400 font-mono">Grace Period (7d) & Suspend</p>
                        </div>
                    </div>
                </div>

                {/* SETTINGS FORM */}
                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 text-xs font-sans">
                    
                    {/* WHATSAPP GATEWAY INTEGRATION */}
                    <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <div className="flex justify-between items-center">
                            <h3 className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
                                <Phone className="w-4 h-4" /> 1. WhatsApp Gateway Integration (HTTP POST API)
                            </h3>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={form.data.enable_wa_notifications}
                                    onChange={(e) => form.setData('enable_wa_notifications', e.target.checked)}
                                    className="w-4 h-4 rounded text-emerald-600 border-slate-700 bg-slate-900 focus:ring-emerald-500"
                                />
                                <span>Aktifkan WA Gateway</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">URL Endpoint WhatsApp Gateway API</label>
                                <input
                                    type="url"
                                    required
                                    value={form.data.wa_gateway_url}
                                    onChange={(e) => form.setData('wa_gateway_url', e.target.value)}
                                    placeholder="https://api.fonnte.com/send"
                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">API Key / Token WA Gateway</label>
                                <input
                                    type="password"
                                    value={form.data.wa_api_key}
                                    onChange={(e) => form.setData('wa_api_key', e.target.value)}
                                    placeholder="Masukkan Token / API Key WhatsApp..."
                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono text-xs"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 font-semibold mb-1">Nomor WhatsApp CS Support (Tombol Floating Landing Page)</label>
                            <input
                                type="text"
                                required
                                value={form.data.wa_cs_number}
                                onChange={(e) => form.setData('wa_cs_number', e.target.value)}
                                placeholder="6281234567890"
                                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono text-xs font-bold"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Nomor WA CS (format 62xxx) yang menerima pesan konsultasi calon klien dari tombol melayang di landing page.</p>
                        </div>

                        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                            💡 Kompatibel dengan provider WhatsApp API apa pun (Fonnte, Wablas, Ruangguru, KirimWA, atau Custom Node.js/Python Baileys Gateway).
                        </p>
                    </div>

                    {/* EMAIL NOTIFICATIONS */}
                    <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <div className="flex justify-between items-center">
                            <h3 className="font-extrabold text-sm text-blue-400 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> 2. Email Billing Reminders (SMTP Driver)
                            </h3>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={form.data.enable_email_notifications}
                                    onChange={(e) => form.setData('enable_email_notifications', e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 border-slate-700 bg-slate-900 focus:ring-blue-500"
                                />
                                <span>Aktifkan Notifikasi Email</span>
                            </label>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                            Notifikasi email dikirim secara otomatis ke alamat email pemilik toko (Owner Email) yang terdaftar.
                        </p>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>{form.processing ? 'Menyimpan...' : 'Simpan Pengaturan Notifikasi'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
