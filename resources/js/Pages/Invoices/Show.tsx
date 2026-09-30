import React, { useState } from 'react';
import { Head, usePage, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CheckCircle2, ArrowLeft, Upload, CreditCard, AlertCircle, Building2, ShieldCheck, QrCode } from 'lucide-react';
import type { PageProps } from '@/Types';

interface InvoiceShowProps extends PageProps {
    invoice?: any;
    isSuperAdmin?: boolean;
    paymentSettings?: any;
}

export default function InvoiceShow({ invoice = {}, isSuperAdmin = false, paymentSettings = {} }: InvoiceShowProps) {
    const { flash } = usePage<InvoiceShowProps>().props;
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const paymentForm = useForm({
        payment_method: 'manual_transfer',
        sender_bank: 'Bank BCA',
        sender_name: '',
        proof_file: null as File | null,
    });

    const handleConfirmPaymentSuperAdmin = () => {
        if (!invoice?.id) return;
        if (confirm(`Apakah Anda yakin ingin mengonfirmasi pembayaran Invoice #${invoice.invoice_number} sebagai LUNAS?`)) {
            router.post(`/invoices/${invoice.id}/confirm-payment`, {}, {
                preserveScroll: true,
            });
        }
    };

    const handleTenantSubmitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice?.id) return;

        paymentForm.post(`/invoices/${invoice.id}/submit-payment`, {
            onSuccess: () => {
                setShowPaymentModal(false);
                paymentForm.reset();
            },
        });
    };

    return (
        <AppLayout title={`Invoice #${invoice?.invoice_number || ''}`}>
            <Head title={`Invoice Tagihan #${invoice?.invoice_number || ''} - KasirSewa`} />

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                
                {/* BACK BUTTON */}
                <Link
                    href="/invoices"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition"
                >
                    <ArrowLeft className="w-4 h-4 text-emerald-400" /> Kembali ke Daftar Invoice
                </Link>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* INVOICE CARD SHEET */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-8 font-sans">
                    
                    {/* INVOICE HEADER */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 gap-4">
                        <div>
                            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest block mb-1">INVOICE OFFICIAL TAGIHAN SAAS</span>
                            <h1 className="text-2xl font-black text-white font-mono">#{invoice?.invoice_number || '-'}</h1>
                        </div>
                        <div className="text-right">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase inline-block ${
                                invoice?.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                                STATUS: {invoice?.status || 'PENDING'}
                            </span>
                        </div>
                    </div>

                    {/* TENANT & PAYMENT INFO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs bg-slate-950 p-6 rounded-2xl border border-slate-800">
                        <div>
                            <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">DITAGIHKAN KEPADA TENANT</span>
                            <h3 className="font-extrabold text-sm text-white">{invoice?.tenant?.name || 'Tenant N/A'}</h3>
                            <p className="text-slate-400 mt-1 font-mono">Owner: {invoice?.tenant?.owner?.name || '-'} ({invoice?.tenant?.owner?.email || '-'})</p>
                        </div>
                        <div className="text-left md:text-right space-y-1">
                            <span className="text-slate-500 font-bold uppercase tracking-wider block">REKENING PEMBAYARAN SEWA SAAS</span>
                            {paymentSettings?.bank_accounts && paymentSettings.bank_accounts.length > 0 ? (
                                paymentSettings.bank_accounts.map((b: any, idx: number) => (
                                    <p key={idx} className="text-slate-200 font-mono text-[11px]">
                                        <strong className="text-emerald-400">{b.bank_name}:</strong> {b.account_number} <span className="text-slate-400">(a.n {b.account_name})</span>
                                    </p>
                                ))
                            ) : (
                                <>
                                    <p className="text-slate-300 font-mono">BCA: {paymentSettings?.bank_bca_number || '123-456-7890'} (a.n {paymentSettings?.bank_bca_name || 'PT KasirSewa Indonesia'})</p>
                                    <p className="text-slate-300 font-mono">Mandiri: {paymentSettings?.bank_mandiri_number || '987-000-111-22'} (a.n {paymentSettings?.bank_mandiri_name || 'PT KasirSewa Indonesia'})</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* QRIS PAYMENT BOX */}
                    {(paymentSettings?.qris_payload || paymentSettings?.qris_image_url) && invoice?.status !== 'paid' && (
                        <div className="bg-slate-950 border-2 border-purple-500/40 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2 text-center md:text-left">
                                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1">
                                    <QrCode className="w-3.5 h-3.5" /> 📱 BAYAR INSTAN VIA QRIS
                                </span>
                                <h3 className="text-lg font-bold text-white">Scan Barcode QRIS Untuk Pembayaran Instan</h3>
                                <p className="text-xs text-slate-400 max-w-md">
                                    Gunakan aplikasi e-Wallet (Gopay, ShopeePay, DANA, OVO, LinkAja) atau m-Banking (BCA, Mandiri, BRI, BNI, BSI) untuk melakukan scan QRIS secara langsung.
                                </p>
                            </div>

                            <div className="bg-white p-4 rounded-2xl shadow-2xl flex flex-col items-center justify-center shrink-0">
                                {paymentSettings?.qris_image_url ? (
                                    <img src={paymentSettings.qris_image_url} alt="QRIS Code Merchant SaaS" className="w-44 h-44 object-contain" />
                                ) : (
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(paymentSettings.qris_payload)}`} 
                                        alt="QRIS Barcode" 
                                        className="w-44 h-44 object-contain" 
                                    />
                                )}
                                <span className="text-[10px] font-bold text-slate-950 font-mono mt-2 uppercase tracking-widest">QRIS STANDAR NMP</span>
                            </div>
                        </div>
                    )}

                    {/* ITEMS TABLE */}
                    <div className="border border-slate-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">DESKRIPSI ITEM TAGIHAN</th>
                                    <th className="p-4 text-right">TOTAL NOMINAL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {invoice?.items?.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="p-4 font-sans font-semibold text-white">{item.description}</td>
                                        <td className="p-4 text-right font-bold text-emerald-400">Rp {Number(item.amount).toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* TOTAL & CONFIRMATION ACTIONS */}
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-800 gap-4">
                        <div>
                            <span className="text-xs text-slate-400">Total Tagihan Bersih:</span>
                            <h2 className="text-3xl font-black text-emerald-400 font-mono">Rp {Number(invoice?.total || 0).toLocaleString('id-ID')}</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* TENANT ACTION: UPLOAD PROOF OF PAYMENT */}
                            {!isSuperAdmin && invoice?.status !== 'paid' && (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                                >
                                    <CreditCard className="w-5 h-5" /> Konfirmasi / Upload Bukti Transfer
                                </button>
                            )}

                            {/* SUPER ADMIN ACTION: VERIFY AS PAID */}
                            {isSuperAdmin && invoice?.status !== 'paid' && (
                                <button
                                    onClick={handleConfirmPaymentSuperAdmin}
                                    className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                                >
                                    <CheckCircle2 className="w-5 h-5" /> Konfirmasi Pembayaran LUNAS
                                </button>
                            )}
                        </div>
                    </div>

                </div>

                {/* MODAL TENANT PAYMENT FORM & PROOF UPLOAD */}
                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-blue-400" /> Form Konfirmasi Pembayaran Sewa
                                </h3>
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <form onSubmit={handleTenantSubmitPayment} className="space-y-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Metode Pembayaran</label>
                                    <select
                                        value={paymentForm.data.payment_method}
                                        onChange={(e) => paymentForm.setData('payment_method', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    >
                                        <option value="manual_transfer">Transfer Bank Manual (BCA / Mandiri)</option>
                                        <option value="qris">Scan QRIS Resmi</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Bank Pengirim</label>
                                        <input
                                            type="text"
                                            required
                                            value={paymentForm.data.sender_bank}
                                            onChange={(e) => paymentForm.setData('sender_bank', e.target.value)}
                                            placeholder="e.g. BCA / Mandiri / BRI"
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Nama Pemilik Rekening</label>
                                        <input
                                            type="text"
                                            required
                                            value={paymentForm.data.sender_name}
                                            onChange={(e) => paymentForm.setData('sender_name', e.target.value)}
                                            placeholder="Nama Pengirim Transfer"
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Upload Foto / File Bukti Transfer (Opsional)</label>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => paymentForm.setData('proof_file', e.target.files ? e.target.files[0] : null)}
                                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs cursor-pointer"
                                    />
                                </div>

                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-400">
                                    ℹ️ Setelah dikonfirmasi, tim Super Admin akan memverifikasi transfer dan subskripsi toko Anda akan langsung aktif/diperpanjang otomatis.
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl">Batal</button>
                                    <button type="submit" disabled={paymentForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg">
                                        {paymentForm.processing ? '⏳ Mengirim...' : 'Kirim Konfirmasi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
