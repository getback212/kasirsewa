import React, { useState } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Receipt, CheckCircle2, Eye, Trash2 } from 'lucide-react';
import type { PageProps } from '@/Types';

interface InvoiceItem {
    id: number;
    invoice_number: string;
    subtotal: number;
    total: number;
    status: 'draft' | 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
    created_at: string;
    due_at: string | null;
    paid_at: string | null;
    tenant?: { name: string };
    subscription?: { plan?: { name: string } };
    plan?: { name: string };
}

interface InvoicesPageProps extends PageProps {
    invoices?: {
        data: InvoiceItem[];
        links: any[];
        total: number;
    };
    isSuperAdmin?: boolean;
}

export default function InvoicesIndex({
    invoices = { data: [], links: [], total: 0 },
    isSuperAdmin = false
}: InvoicesPageProps) {
    const { flash } = usePage<InvoicesPageProps>().props;
    const invoiceList = invoices?.data || [];
    const [deletingInvoice, setDeletingInvoice] = useState<InvoiceItem | null>(null);

    const handleDeleteInvoice = () => {
        if (!deletingInvoice) return;
        router.delete(`/invoices/${deletingInvoice.id}`, {
            onSuccess: () => setDeletingInvoice(null),
        });
    };

    return (
        <AppLayout title="Riwayat Tagihan Invoice SaaS">
            <Head title="Riwayat Tagihan & Invoice SaaS - KasirSewa" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-blue-400" /> Riwayat Tagihan & Invoice Berlangganan SaaS
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Daftar tagihan pembayaran paket berlangganan SaaS toko Anda.
                        </p>
                    </div>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* INVOICES TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">NO. INVOICE</th>
                                    {isSuperAdmin && <th className="p-4">TENANT</th>}
                                    <th className="p-4">PAKET SAAS</th>
                                    <th className="p-4">TOTAL TAGIHAN</th>
                                    <th className="p-4">STATUS</th>
                                    <th className="p-4 text-right">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {invoiceList.length === 0 ? (
                                    <tr>
                                        <td colSpan={isSuperAdmin ? 6 : 5} className="p-8 text-center text-slate-500 font-sans">
                                            Belum ada tagihan invoice.
                                        </td>
                                    </tr>
                                ) : (
                                    invoiceList.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-800/40">
                                            <td className="p-4 font-bold text-white">
                                                #{inv.invoice_number}
                                            </td>
                                            {isSuperAdmin && (
                                                <td className="p-4 font-sans text-slate-300 font-semibold">
                                                    {inv.tenant?.name || 'Tenant N/A'}
                                                </td>
                                            )}
                                            <td className="p-4 font-sans text-slate-400">
                                                {inv.subscription?.plan?.name || inv.plan?.name || 'SaaS Plan'}
                                            </td>
                                            <td className="p-4 font-bold text-emerald-400">
                                                Rp {Number(inv.total).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                    inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-sans space-x-2">
                                                <Link
                                                    href={`/invoices/${inv.id}`}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-blue-400" /> Lihat Detail
                                                </Link>

                                                {isSuperAdmin && (
                                                    <button
                                                        onClick={() => setDeletingInvoice(inv)}
                                                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition active:scale-95"
                                                        title="Hapus Invoice Tagihan"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Hapus
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL KONFIRMASI HAPUS INVOICE */}
                {deletingInvoice && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                            <div className="flex items-center gap-3 text-rose-400">
                                <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-white">Hapus Tagihan Invoice?</h3>
                                    <p className="text-xs text-slate-400">Tindakan ini akan menghapus riwayat invoice #{deletingInvoice.invoice_number}.</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs">
                                <p className="text-slate-300"><strong>No. Invoice:</strong> #{deletingInvoice.invoice_number}</p>
                                <p className="text-slate-300"><strong>Tenant:</strong> {deletingInvoice.tenant?.name || 'Tenant N/A'}</p>
                                <p className="text-slate-300"><strong>Total Tagihan:</strong> Rp {Number(deletingInvoice.total).toLocaleString('id-ID')}</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setDeletingInvoice(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl">Batal</button>
                                <button type="button" onClick={handleDeleteInvoice} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Ya, Hapus Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
