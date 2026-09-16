import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Clock, Key, AlertCircle, CheckCircle2, Lock, Unlock, XCircle } from 'lucide-react';
import type { PageProps } from '@/Types';

interface ShiftItem {
    id: number;
    opening_cash: number;
    closing_cash?: number;
    expected_cash?: number | null;
    actual_cash?: number;
    difference?: number | null;
    status: 'open' | 'closed';
    opened_at: string;
    closed_at?: string;
    user?: { name: string };
    cash_movements?: any[];
}

interface ShiftsPageProps extends PageProps {
    currentShift: ShiftItem | null;
    shiftsHistory: {
        data: ShiftItem[];
        links: any[];
        total: number;
    };
    isManagement?: boolean;
}

export default function ShiftsIndex({ currentShift, shiftsHistory, isManagement = false }: ShiftsPageProps) {
    const { flash } = usePage<ShiftsPageProps>().props;

    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showCashMovementModal, setShowCashMovementModal] = useState(false);

    const openForm = useForm({ opening_cash: '100000' });
    const closeForm = useForm({ shift_id: currentShift?.id || '', actual_cash: '' });
    const cashForm = useForm({
        shift_id: currentShift?.id || '',
        type: 'cash_out',
        amount: '',
        reason: 'Uang Kembalian Tambahan / Operasional Laci',
        note: '',
    });

    const handleOpenShift = (e: React.FormEvent) => {
        e.preventDefault();
        openForm.post('/shifts/open', {
            onSuccess: () => setShowOpenModal(false),
        });
    };

    const handleCloseShift = (e: React.FormEvent) => {
        e.preventDefault();
        closeForm.setData('shift_id', currentShift?.id || '');
        closeForm.post('/shifts/close', {
            onSuccess: () => setShowCloseModal(false),
        });
    };

    const handleForceClose = (shiftId: number, cashierName: string) => {
        if (confirm(`⚠️ PERINGATAN MANAGER / OWNER:\n\nApakah Anda yakin ingin MENUTUP PAKSA (Force Close) shift kasir atas nama ${cashierName}?\n\nLangkah ini akan menyelesaikan sesi shift yang menggantung sehingga kasir baru dapat membuka shift.`)) {
            router.post(`/shifts/${shiftId}/force-close`);
        }
    };

    const handleCashMovement = (e: React.FormEvent) => {
        e.preventDefault();
        cashForm.setData('shift_id', currentShift?.id || '');
        cashForm.post('/shifts/cash-movement', {
            onSuccess: () => setShowCashMovementModal(false),
        });
    };

    return (
        <AppLayout title="Shift Kasir">
            <Head title="Pengawasan Shift & Rekap Kas Laci - RetailPRO POS" />

            <div className="max-w-6xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-400" /> Shift Management & Laci Kasir
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Buka/tutup shift kasir, pencatatan uang modal awal, cash in/out, dan rekapitulasi laci kasir.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {currentShift ? (
                            <>
                                <button
                                    onClick={() => setShowCashMovementModal(true)}
                                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                                >
                                    <Key className="w-4 h-4 text-amber-400" /> Cash In/Out
                                </button>

                                <button
                                    onClick={() => setShowCloseModal(true)}
                                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                                >
                                    <Lock className="w-4 h-4" /> Tutup Shift
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setShowOpenModal(true)}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                            >
                                <Unlock className="w-4 h-4" /> + Buka Shift Baru
                            </button>
                        )}
                    </div>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-semibold">
                        {flash.error}
                    </div>
                )}

                {/* CURRENT ACTIVE SHIFT CARD */}
                {currentShift ? (
                    <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-3xl shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" /> SESI SHIFT KASIR AKTIF
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                                Opened: {new Date(currentShift.opened_at).toLocaleString('id-ID')}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-500 font-sans">MODAL CAS LACI</span>
                                <div className="text-sm font-bold text-white">
                                    Rp {Number(currentShift.opening_cash).toLocaleString('id-ID')}
                                </div>
                            </div>

                            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-500 font-sans">STATUS SHIFT</span>
                                <div className="text-sm font-bold text-emerald-400 capitalize">
                                    {currentShift.status}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl text-center space-y-3">
                        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                        <h3 className="text-base font-bold text-white">Shift Kasir Belum Dibuka</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Buka shift kasir terlebih dahulu sebelum melayani transaksi pembayaran di POS.
                        </p>
                    </div>
                )}

                {/* SHIFT HISTORY TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden space-y-2">
                    <div className="p-4 border-b border-slate-800 font-bold text-xs text-white flex justify-between items-center">
                        <span>📋 Histori Shift Kasir & Audit Rekapitulasi ({shiftsHistory.total})</span>
                        {!isManagement && (
                            <span className="text-[10px] text-slate-500 font-mono">Mode Blind Reconciliation Kasir</span>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">WAKTU BUKA</th>
                                    <th className="p-4">KASIR</th>
                                    <th className="p-4">MODAL AWAL</th>
                                    {isManagement && <th className="p-4 text-center">EXPECTED CASH</th>}
                                    <th className="p-4 text-center">ACTUAL CASH FISIK</th>
                                    {isManagement && <th className="p-4 text-center">SELISIH</th>}
                                    <th className="p-4 text-center">STATUS</th>
                                    {isManagement && <th className="p-4 text-right">AKSI MANAGER</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {shiftsHistory.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={isManagement ? 8 : 5} className="p-8 text-center text-slate-500 font-sans">
                                            Belum ada histori shift kasir recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    shiftsHistory.data.map((shift) => (
                                        <tr key={shift.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-4 text-slate-400">
                                                {new Date(shift.opened_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-4 font-sans font-bold text-white">
                                                {shift.user?.name || 'Kasir'}
                                            </td>
                                            <td className="p-4 text-slate-300">
                                                Rp {Number(shift.opening_cash).toLocaleString('id-ID')}
                                            </td>
                                            {isManagement && (
                                                <td className="p-4 text-center text-slate-300">
                                                    {shift.expected_cash !== null && shift.expected_cash !== undefined 
                                                        ? `Rp ${Number(shift.expected_cash).toLocaleString('id-ID')}` 
                                                        : '-'}
                                                </td>
                                            )}
                                            <td className="p-4 text-center font-bold text-emerald-400">
                                                {shift.actual_cash ? `Rp ${Number(shift.actual_cash).toLocaleString('id-ID')}` : '-'}
                                            </td>
                                            {isManagement && (
                                                <td className="p-4 text-center font-bold">
                                                    {shift.difference !== undefined && shift.difference !== null ? (
                                                        <span className={Number(shift.difference) === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                            Rp {Number(shift.difference).toLocaleString('id-ID')}
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            )}
                                            <td className="p-4 text-center font-sans">
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                                                    shift.status === 'open'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                        : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {shift.status}
                                                </span>
                                            </td>
                                            {isManagement && (
                                                <td className="p-4 text-right font-sans">
                                                    {shift.status === 'open' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleForceClose(shift.id, shift.user?.name || 'Kasir')}
                                                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-400 border border-rose-500/30 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                                                            title="Tutup Paksa Shift Menggantung (Manager Only)"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" /> Force Close
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-600 font-mono">Selesai</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL OPEN SHIFT */}
                {showOpenModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <form onSubmit={handleOpenShift} className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Unlock className="w-4 h-4 text-emerald-400" /> Buka Shift Kasir Baru
                                </h3>
                                <button type="button" onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nominal Modal Kas Laci Awal (Rp)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={openForm.data.opening_cash}
                                    onChange={(e) => openForm.setData('opening_cash', e.target.value)}
                                    placeholder="100000"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold text-sm"
                                />
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setShowOpenModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                                <button type="submit" disabled={openForm.processing} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                                    {openForm.processing ? '⏳ Membuka...' : 'Buka Shift'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODAL CLOSE SHIFT */}
                {showCloseModal && currentShift && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <form onSubmit={handleCloseShift} className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-rose-400" /> Tutup & Rekap Shift Kasir
                                </h3>
                                <button type="button" onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nominal Fisik Uang Tunai Di Laci (Actual Cash)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={closeForm.data.actual_cash}
                                    onChange={(e) => closeForm.setData('actual_cash', e.target.value)}
                                    placeholder="Hitung jumlah uang fisik di laci..."
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold text-sm"
                                />
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setShowCloseModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                                <button type="submit" disabled={closeForm.processing} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                                    {closeForm.processing ? '⏳ Menutup...' : 'Tutup Shift Sekarang'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODAL CASH IN/OUT MOVEMENT */}
                {showCashMovementModal && currentShift && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <form onSubmit={handleCashMovement} className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Key className="w-4 h-4 text-amber-400" /> Pencatatan Cash In / Cash Out Laci
                                </h3>
                                <button type="button" onClick={() => setShowCashMovementModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Tipe Transaksi Laci</label>
                                <select
                                    value={cashForm.data.type}
                                    onChange={(e) => cashForm.setData('type', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                                >
                                    <option value="cash_in">Uang Masuk Laci (Cash In)</option>
                                    <option value="cash_out">Uang Keluar Laci (Cash Out)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nominal (Rp)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={cashForm.data.amount}
                                    onChange={(e) => cashForm.setData('amount', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Alasan / Kepentingan</label>
                                <input
                                    type="text"
                                    required
                                    value={cashForm.data.reason}
                                    onChange={(e) => cashForm.setData('reason', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                                />
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setShowCashMovementModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                                <button type="submit" disabled={cashForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                                    {cashForm.processing ? '⏳ Menyimpan...' : 'Simpan Transaksi Laci'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
