import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CheckCircle2, AlertCircle, Eye, X, Send, Calendar, DollarSign, FileText } from 'lucide-react';
import type { PageProps } from '@/Types';

interface PaymentProof {
    id: number;
    invoice_id: number;
    payment_number: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    payment_proof: string | null;
    proof_verified_at: string | null;
    proof_rejection_reason: string | null;
    created_at: string;
    invoice?: {
        invoice_number: string;
        total: number;
        due_at: string;
        tenant?: {
            name: string;
            owner?: {
                name: string;
                email: string;
                phone: string;
            };
        };
    };
}

interface PaymentProofsPageProps extends PageProps {
    payments: PaymentProof[];
    filters?: { status?: string };
}

export default function PaymentProofsIndex({ payments = [], filters }: PaymentProofsPageProps) {
    const { flash } = usePage<PaymentProofsPageProps>().props;
    const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const rejectForm = useForm({
        rejection_reason: '',
    });

    const handleVerify = (payment: PaymentProof) => {
        if (!payment.payment_proof) {
            alert('Tidak ada bukti pembayaran untuk diverifikasi');
            return;
        }

        if (confirm(`Verifikasi bukti pembayaran ${payment.payment_number}?`)) {
            router.post(`/payment-proof/${payment.id}/verify`, {}, {
                onSuccess: () => {
                    setSelectedProof(null);
                    setPreviewImage(null);
                },
            });
        }
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProof) return;

        if (!rejectForm.data.rejection_reason.trim()) {
            alert('Masukkan alasan penolakan bukti pembayaran');
            return;
        }

        rejectForm.post(`/payment-proof/${selectedProof.id}/reject`, {
            onSuccess: () => {
                setShowRejectModal(false);
                setSelectedProof(null);
                setPreviewImage(null);
                rejectForm.reset();
            },
        });
    };

    const pendingProofs = payments.filter(p => p.status === 'pending' && p.payment_proof);
    const completedProofs = payments.filter(p => p.status === 'completed' && p.proof_verified_at);

    return (
        <AppLayout title="Verifikasi Bukti Pembayaran SaaS">
            <Head title="Verifikasi Bukti Pembayaran - Super Admin" />

            <div className="w-full space-y-6">
                {/* HEADER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-400" />
                        Verifikasi Bukti Pembayaran SaaS
                    </h1>
                    <p className="text-xs text-slate-400 mt-2">
                        Review dan verifikasi bukti transfer bank dari owner toko sebelum menandai invoice sebagai lunas.
                    </p>
                </div>

                {/* FLASH MESSAGES */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* PENDING PROOFS SECTION */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-bold text-white">
                            Menunggu Verifikasi ({pendingProofs.length})
                        </h2>
                    </div>

                    {pendingProofs.length === 0 ? (
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50" />
                            <p className="text-slate-400 text-sm">Semua bukti pembayaran sudah diverifikasi ✓</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {pendingProofs.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="bg-slate-900 border-2 border-amber-500/50 p-4 rounded-2xl hover:border-amber-500 transition"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                        {/* Invoice Info */}
                                        <div className="space-y-1">
                                            <div className="text-[11px] text-slate-400 font-bold uppercase">Invoice</div>
                                            <div className="text-sm font-mono text-white">{payment.invoice?.invoice_number}</div>
                                            <div className="text-xs text-slate-500">{payment.invoice?.tenant?.name}</div>
                                        </div>

                                        {/* Owner Info */}
                                        <div className="space-y-1">
                                            <div className="text-[11px] text-slate-400 font-bold uppercase">Owner</div>
                                            <div className="text-sm font-bold text-white">{payment.invoice?.tenant?.owner?.name}</div>
                                            <div className="text-xs text-slate-500">{payment.invoice?.tenant?.owner?.email}</div>
                                        </div>

                                        {/* Amount */}
                                        <div className="space-y-1">
                                            <div className="text-[11px] text-slate-400 font-bold uppercase">Jumlah</div>
                                            <div className="text-base font-black text-emerald-400">
                                                Rp {Number(payment.amount).toLocaleString('id-ID')}
                                            </div>
                                            <div className="text-xs text-slate-500">Tanggal: {new Date(payment.created_at).toLocaleDateString('id-ID')}</div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex flex-col gap-2 items-center">
                                            <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-xl text-[10px] font-bold text-amber-300 uppercase">
                                                ⏳ Menunggu
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedProof(payment);
                                                    if (payment.payment_proof) {
                                                        setPreviewImage(`/storage/${payment.payment_proof}`);
                                                    }
                                                }}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl transition"
                                            >
                                                <Eye className="w-3 h-3 inline mr-1" />
                                                Lihat Bukti
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* COMPLETED PROOFS SECTION */}
                {completedProofs.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-lg font-bold text-white">
                                Sudah Diverifikasi ({completedProofs.length})
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {completedProofs.map((payment) => (
                                <div key={payment.id} className="bg-slate-900/50 border border-emerald-500/30 p-3 rounded-xl">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-sm">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase">Invoice</div>
                                            <div className="text-xs font-mono text-white">{payment.invoice?.invoice_number}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase">Owner</div>
                                            <div className="text-xs font-bold text-white">{payment.invoice?.tenant?.owner?.name}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase">Jumlah</div>
                                            <div className="text-xs font-bold text-emerald-400">
                                                Rp {Number(payment.amount).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase">Diverifikasi</div>
                                            <div className="text-xs text-emerald-300">
                                                {payment.proof_verified_at ? new Date(payment.proof_verified_at).toLocaleDateString('id-ID') : '-'}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-[10px] font-bold text-emerald-300 uppercase">
                                                ✓ Lunas
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* PREVIEW MODAL */}
            {selectedProof && previewImage && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">{selectedProof.payment_number}</h3>
                            <button
                                onClick={() => {
                                    setSelectedProof(null);
                                    setPreviewImage(null);
                                    setShowRejectModal(false);
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Invoice Details */}
                            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl space-y-3">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Detail Invoice
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-400">Invoice:</span>
                                        <div className="font-mono text-white">{selectedProof.invoice?.invoice_number}</div>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Toko:</span>
                                        <div className="font-bold text-white">{selectedProof.invoice?.tenant?.name}</div>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Owner:</span>
                                        <div className="text-white">{selectedProof.invoice?.tenant?.owner?.name}</div>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Email:</span>
                                        <div className="text-xs text-slate-300">{selectedProof.invoice?.tenant?.owner?.email}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-slate-400">Jumlah:</span>
                                        <div className="text-xl font-black text-emerald-400">
                                            Rp {Number(selectedProof.amount).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Proof Image */}
                            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl space-y-3">
                                <h4 className="font-bold text-white">Bukti Transfer</h4>
                                <img
                                    src={previewImage}
                                    alt="Payment Proof"
                                    className="w-full max-h-96 object-contain rounded-lg border border-slate-700"
                                />
                            </div>

                            {/* Rejection Reason (if applicable) */}
                            {selectedProof.proof_rejection_reason && (
                                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl">
                                    <h4 className="font-bold text-rose-400 flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-4 h-4" /> Alasan Penolakan
                                    </h4>
                                    <p className="text-sm text-rose-300">{selectedProof.proof_rejection_reason}</p>
                                </div>
                            )}

                            {/* Rejection Form */}
                            {showRejectModal ? (
                                <form onSubmit={handleRejectSubmit} className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl space-y-3">
                                    <h4 className="font-bold text-rose-400">Tolak Bukti Pembayaran</h4>
                                    <textarea
                                        value={rejectForm.data.rejection_reason}
                                        onChange={(e) =>
                                            rejectForm.setData('rejection_reason', e.target.value)
                                        }
                                        placeholder="Masukkan alasan penolakan (misal: bukti tidak jelas, sudah dibayar sebelumnya, dll)"
                                        className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
                                        rows={3}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowRejectModal(false)}
                                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={rejectForm.processing}
                                            className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Tolak
                                        </button>
                                    </div>
                                </form>
                            ) : null}

                            {/* Action Buttons */}
                            {!showRejectModal && selectedProof.status === 'pending' && !selectedProof.proof_rejection_reason && (
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleVerify(selectedProof)}
                                        className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Verifikasi & Tandai Lunas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowRejectModal(true)}
                                        className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        <X className="w-5 h-5" />
                                        Tolak
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
