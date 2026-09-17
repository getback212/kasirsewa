import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CreditCard, CheckCircle2, Building2, QrCode, FileText } from 'lucide-react';
import type { PageProps } from '@/Types';

interface SettingsData {
    bank_bca_number: string;
    bank_bca_name: string;
    bank_mandiri_number: string;
    bank_mandiri_name: string;
    qris_payload: string;
    payment_instructions: string;
}

interface PaymentSettingsPageProps extends PageProps {
    settings: SettingsData;
}

export default function PaymentSettingsIndex({ settings }: PaymentSettingsPageProps) {
    const { flash } = usePage<PaymentSettingsPageProps>().props;

    const form = useForm({
        bank_bca_number: settings?.bank_bca_number || '',
        bank_bca_name: settings?.bank_bca_name || '',
        bank_mandiri_number: settings?.bank_mandiri_number || '',
        bank_mandiri_name: settings?.bank_mandiri_name || '',
        qris_payload: settings?.qris_payload || '',
        payment_instructions: settings?.payment_instructions || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/payment-settings', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout title="Pengaturan Rekening SaaS">
            <Head title="Pengaturan Rekening Pembayaran SaaS - Super Admin" />

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-400" /> Pengaturan Rekening Pembayaran SaaS
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Atur nomor rekening tujuan transfer bank (BCA / Mandiri / QRIS) yang tampil pada invoice tagihan sewa tenant.
                        </p>
                    </div>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* SETTINGS FORM */}
                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 text-xs font-sans">
                    
                    {/* BANK BCA SETTINGS */}
                    <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <div className="font-extrabold text-sm text-blue-400 flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> 1. Rekening Bank BCA Resmi
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nomor Rekening BCA</label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.bank_bca_number}
                                    onChange={(e) => form.setData('bank_bca_number', e.target.value)}
                                    placeholder="123-456-7890"
                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nama Pemilik Rekening BCA (a.n.)</label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.bank_bca_name}
                                    onChange={(e) => form.setData('bank_bca_name', e.target.value)}
                                    placeholder="PT KasirSewa Indonesia"
                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* BANK MANDIRI SETTINGS */}
                    <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <div className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> 2. Rekening Bank Mandiri Resmi
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nomor Rekening Mandiri</label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.bank_mandiri_number}
                                    onChange={(e) => form.setData('bank_mandiri_number', e.target.value)}
                                    placeholder="987-000-111-22"
                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nama Pemilik Rekening Mandiri (a.n.)</label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.bank_mandiri_name}
                                    onChange={(e) => form.setData('bank_mandiri_name', e.target.value)}
                                    placeholder="PT KasirSewa Indonesia"
                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* QRIS SETTINGS */}
                    <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <div className="font-extrabold text-sm text-purple-400 flex items-center gap-2">
                            <QrCode className="w-4 h-4" /> 3. String Payload QRIS Resmi Platform
                        </div>

                        <div>
                            <label className="block text-slate-400 font-semibold mb-1">Kode QRIS String Payload (String Resmi dari Bank/Payment Gateway)</label>
                            <textarea
                                rows={3}
                                value={form.data.qris_payload}
                                onChange={(e) => form.setData('qris_payload', e.target.value)}
                                placeholder="Paste kode teks QRIS resmi SaaS..."
                                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-[11px]"
                            />
                        </div>
                    </div>

                    {/* PAYMENT INSTRUCTIONS */}
                    <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <div className="font-extrabold text-sm text-amber-400 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> 4. Instruksi Catatan Pembayaran Bagi Tenant
                        </div>

                        <div>
                            <textarea
                                rows={2}
                                value={form.data.payment_instructions}
                                onChange={(e) => form.setData('payment_instructions', e.target.value)}
                                placeholder="Tuliskan catatan instruksi pembayaran bagi penyewa toko..."
                                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                        >
                            <span>{form.processing ? '⏳ Menyimpan...' : 'Simpan Pengaturan Rekening SaaS'}</span>
                        </button>
                    </div>

                </form>

            </div>
        </AppLayout>
    );
}
