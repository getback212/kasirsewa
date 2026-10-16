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

    const latestPayment = invoice?.payments && invoice.payments.length > 0 ? invoice.payments[invoice.payments.length - 1] : null;
    const proofUrl = latestPayment?.payload?.proof_url;
    const senderBank = latestPayment?.payload?.sender_bank;
    const senderName = latestPayment?.payload?.sender_name;
    const rejectionReason = latestPayment?.proof_rejection_reason;

    const paymentForm = useForm({
        invoice_id: invoice?.id || null,
        payment_method: 'manual_transfer',
        sender_bank: 'Bank BCA',
        sender_name: '',
        payment_proof: null as File | null,
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

        // Submit to payment-proof/upload endpoint
        paymentForm.post(`/payment-proof/upload`, {
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

                    {/* SUBMITTED PAYMENT PROOF DETAILS CARD FOR SUPER ADMIN & OWNER */}
                    {latestPayment && (
                        <div className="bg-slate-950 border-2 border-blue-500/40 p-6 rounded-3xl shadow-xl space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-blue-400" /> Bukti Konfirmasi Transfer Pembayaran Tenant
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    latestPayment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                }`}>
                                    STATUS: {latestPayment.status === 'completed' ? 'VERIFIED LUNAS' : 'MENUNGGU VERIFIKASI SUPER ADMIN'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Bank / Metode Pengirim</span>
                                    <p className="font-bold text-white mt-0.5">{senderBank || latestPayment.payment_method || 'Transfer Bank'}</p>
                                </div>
                                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Nama Pemilik Rekening</span>
                                    <p className="font-bold text-white mt-0.5">{senderName || '-'}</p>
                                </div>
                                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Waktu Submit Bukti</span>
                                    <p className="font-bold text-slate-300 font-mono mt-0.5">{new Date(latestPayment.created_at).toLocaleString('id-ID')}</p>
                                </div>
                            </div>

                            {/* DISPLAY PROOF IMAGE IF UPLOADED */}
                            {proofUrl ? (
                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <span className="text-xs font-bold text-slate-300 block">Lampiran Bukti Foto Transfer:</span>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="group relative block rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-400 transition bg-slate-900 p-2">
                                            <img src={proofUrl} alt="Bukti Transfer Tenant" className="max-h-56 object-contain" />
                                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs transition">
                                                🔍 Klik Untuk Memperbesar
                                            </div>
                                        </a>
                                        <a
                                            href={proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition"
                                        >
                                            👁️ Buka Foto Bukti Transfer Di Tab Baru ↗
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic pt-2">Tenant tidak mengunggah file foto (Konfirmasi transfer manual via bank pengirim & nama rekening).</p>
                            )}

                            {/* REJECTION REASON ALERT */}
                            {rejectionReason && (
                                <div className="space-y-4 pt-4 border-t border-slate-800">
                                    <div className="bg-rose-500/10 border-2 border-rose-500/40 p-6 rounded-3xl shadow-xl space-y-4">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-rose-400" />
                                            <h3 className="font-extrabold text-sm text-rose-400">Bukti Pembayaran Ditolak</h3>
                                        </div>
                                        <div className="bg-rose-500/5 border border-rose-500/30 p-4 rounded-2xl">
                                            <p className="text-xs text-rose-300 leading-relaxed">{rejectionReason}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPaymentModal(true)}
                                            className="w-full px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Upload Ulang Bukti Pembayaran
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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
                                    <label className="block text-slate-400 font-semibold mb-1">Metode Pembayaran Tujuan</label>
                                    <select
                                        value={paymentForm.data.payment_method}
                                        onChange={(e) => paymentForm.setData('payment_method', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    >
                                        <option value="manual_transfer">🏦 Transfer Rekening Bank (BCA / Mandiri / BRI / BNI / BSI / Jago)</option>
                                        <option value="ewallet">📱 E-Wallet (Gopay / OVO / DANA / ShopeePay / LinkAja)</option>
                                        <option value="qris">📲 Scan Barcode QRIS Statis / Dynamic</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Bank / E-Wallet Pengirim</label>
                                        <select
                                            value={paymentForm.data.sender_bank}
                                            onChange={(e) => paymentForm.setData('sender_bank', e.target.value)}
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xs"
                                        >
                                            <option value="Bank BCA">Bank BCA</option>
                                            <option value="Bank Mandiri">Bank Mandiri</option>
                                            <option value="Bank BRI">Bank BRI</option>
                                            <option value="Bank BNI">Bank BNI</option>
                                            <option value="Bank BSI">Bank BSI (Syariah)</option>
                                            <option value="Bank Jago">Bank Jago / Seabank</option>
                                            <option value="Gopay">Gopay / Gojek</option>
                                            <option value="OVO">OVO</option>
                                            <option value="DANA">DANA</option>
                                            <option value="ShopeePay">ShopeePay</option>
                                            <option value="LinkAja">LinkAja</option>
                                            <option value="Lainnya">Lainnya (Bank/E-Wallet Lain)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Nama Pemilik Rekening / Akun</label>
                                        <input
                                            type="text"
                                            required
                                            value={paymentForm.data.sender_name}
                                            onChange={(e) => paymentForm.setData('sender_name', e.target.value)}
                                            placeholder="Nama Pemilik Akun / Pengirim"
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Upload Foto / File Bukti Transfer</label>
                                    <input
                                        type="file"
                                        required
                                        accept="image/*,.pdf"
                                        onChange={(e) => paymentForm.setData('payment_proof', e.target.files ? e.target.files[0] : null)}
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
