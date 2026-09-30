import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CreditCard, CheckCircle2, Building2, Plus, Trash2, Save, FileText, QrCode } from 'lucide-react';
import type { PageProps } from '@/Types';

interface BankAccount {
    id: number;
    bank_name: string;
    account_number: string;
    account_name: string;
    is_active?: boolean;
}

interface SettingsData {
    bank_accounts?: BankAccount[];
    bank_bca_number?: string;
    bank_bca_name?: string;
    bank_mandiri_number?: string;
    bank_mandiri_name?: string;
    qris_payload?: string;
    qris_image_url?: string;
    payment_instructions?: string;
}

interface PaymentSettingsPageProps extends PageProps {
    settings: SettingsData;
}

export default function PaymentSettingsIndex({ settings }: PaymentSettingsPageProps) {
    const { flash } = usePage<PaymentSettingsPageProps>().props;

    const initialBankAccounts: BankAccount[] = settings?.bank_accounts && settings.bank_accounts.length > 0
        ? settings.bank_accounts
        : [
            { id: 1, bank_name: 'Bank BCA', account_number: settings?.bank_bca_number || '123-456-7890', account_name: settings?.bank_bca_name || 'PT KasirSewa Indonesia', is_active: true },
            { id: 2, bank_name: 'Bank Mandiri', account_number: settings?.bank_mandiri_number || '987-000-111-22', account_name: settings?.bank_mandiri_name || 'PT KasirSewa Indonesia', is_active: true },
        ];

    const form = useForm({
        bank_accounts: initialBankAccounts,
        qris_payload: settings?.qris_payload || '',
        qris_image_url: settings?.qris_image_url || '',
        payment_instructions: settings?.payment_instructions || '',
    });

    const addBankAccount = () => {
        const newBank: BankAccount = {
            id: Date.now(),
            bank_name: 'Bank BRI',
            account_number: '',
            account_name: 'PT KasirSewa Indonesia',
            is_active: true,
        };
        form.setData('bank_accounts', [...form.data.bank_accounts, newBank]);
    };

    const removeBankAccount = (index: number) => {
        if (form.data.bank_accounts.length <= 1) {
            alert('Minimal harus ada 1 rekening bank aktif!');
            return;
        }
        const updated = form.data.bank_accounts.filter((_, i) => i !== index);
        form.setData('bank_accounts', updated);
    };

    const updateBankField = (index: number, field: keyof BankAccount, value: any) => {
        const updated = [...form.data.bank_accounts];
        updated[index] = { ...updated[index], [field]: value };
        form.setData('bank_accounts', updated);
    };

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
                            Kelola bebas daftar rekening bank (BCA, BRI, Mandiri, BNI, BSI, Jago, Dana, dll) dan QRIS yang tampil pada tagihan sewa tenant.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={addBankAccount}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> + Tambah Rekening Bank Baru
                    </button>
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
                    
                    {/* DYNAMIC BANK ACCOUNTS LIST */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-emerald-400" /> Daftar Rekening Bank Tujuan Transfer ({form.data.bank_accounts.length} Bank)
                            </h3>
                            <button
                                type="button"
                                onClick={addBankAccount}
                                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Tambah Bank
                            </button>
                        </div>

                        {form.data.bank_accounts.map((bank, index) => (
                            <div key={bank.id || index} className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800 relative transition hover:border-slate-700">
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                                        Rekening #{index + 1}
                                    </span>
                                    {form.data.bank_accounts.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeBankAccount(index)}
                                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Hapus Bank
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Nama Bank / Provider</label>
                                        <input
                                            type="text"
                                            required
                                            value={bank.bank_name}
                                            onChange={(e) => updateBankField(index, 'bank_name', e.target.value)}
                                            placeholder="Bank BCA / BRI / Mandiri / BSI"
                                            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Nomor Rekening</label>
                                        <input
                                            type="text"
                                            required
                                            value={bank.account_number}
                                            onChange={(e) => updateBankField(index, 'account_number', e.target.value)}
                                            placeholder="123-456-7890"
                                            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Atas Nama (a.n)</label>
                                        <input
                                            type="text"
                                            required
                                            value={bank.account_name}
                                            onChange={(e) => updateBankField(index, 'account_name', e.target.value)}
                                            placeholder="PT KasirSewa Indonesia"
                                            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* QRIS PAYMENT SETTINGS */}
                    <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <div className="font-extrabold text-sm text-purple-400 flex items-center gap-2">
                            <QrCode className="w-4 h-4" /> Pengaturan QRIS Pembayaran SaaS (All e-Wallet & m-Banking)
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">String Payload QRIS Statis / NMP</label>
                                <textarea
                                    rows={2}
                                    value={form.data.qris_payload}
                                    onChange={(e) => form.setData('qris_payload', e.target.value)}
                                    placeholder="00020101021226670016COM.NOBUBANK.WWW..."
                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-purple-300 font-mono text-xs"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Payload string QRIS untuk generate barcode otomatis di halaman invoice sewa tenant.</p>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">URL Gambar / Foto Barcode QRIS (Opsional)</label>
                                <input
                                    type="text"
                                    value={form.data.qris_image_url}
                                    onChange={(e) => form.setData('qris_image_url', e.target.value)}
                                    placeholder="https://domain.com/qris-merchant.png"
                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Link URL gambar atau QR code toko dari Gopay, ShopeePay, DANA, OVO, Nobu, BCA, dll.</p>
                            </div>
                        </div>
                    </div>

                    {/* INSTRUCTIONS */}
                    <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <div className="font-extrabold text-sm text-amber-400 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Catatan & Instruksi Pembayaran Tagihan
                        </div>
                        <textarea
                            rows={3}
                            value={form.data.payment_instructions}
                            onChange={(e) => form.setData('payment_instructions', e.target.value)}
                            placeholder="Catatan tambahan untuk tenant saat transfer pembayaran..."
                            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium"
                        />
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            <span>{form.processing ? 'Menyimpan...' : 'Simpan Semua Pengaturan Rekening'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
