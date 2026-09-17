import React from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import type { PageProps } from '@/Types';

interface InvoiceShowProps extends PageProps {
    invoice?: any;
    isSuperAdmin?: boolean;
}

export default function InvoiceShow({ invoice = {}, isSuperAdmin = false }: InvoiceShowProps) {
    const { flash } = usePage<InvoiceShowProps>().props;

    const handleConfirmPayment = () => {
        if (!invoice?.id) return;
        if (confirm(`Apakah Anda yakin ingin mengonfirmasi pembayaran Invoice #${invoice.invoice_number} sebagai LUNAS?`)) {
            router.post(`/invoices/${invoice.id}/confirm-payment`, {}, {
                preserveScroll: true,
            });
        }
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
                        <div className="text-left md:text-right">
                            <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">METODE PEMBAYARAN</span>
                            <p className="font-extrabold text-sm text-emerald-400">Transfer Bank Manual (BCA / Mandiri)</p>
                            <p className="text-slate-400 mt-1 font-mono">No. Rek: 123-456-7890 (a.n. PT KasirSewa SaaS)</p>
                        </div>
                    </div>

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

                        {isSuperAdmin && invoice?.status !== 'paid' && (
                            <button
                                onClick={handleConfirmPayment}
                                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                            >
                                <CheckCircle2 className="w-5 h-5" /> Konfirmasi Pembayaran LUNAS
                            </button>
                        )}
                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
