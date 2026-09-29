import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { CreditCard, QrCode, Banknote, Landmark, AlertCircle, X } from 'lucide-react';

interface PaymentModalProps {
    grandTotal: number;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    items: any[];
    customerId?: number | null;
    onClose: () => void;
    onSuccess: (saleData: any) => void;
}

export default function PaymentModal({
    grandTotal,
    subtotal,
    taxAmount,
    discountAmount,
    items,
    customerId,
    onClose,
    onSuccess,
}: PaymentModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<'cash' | 'qris' | 'debit' | 'credit' | 'bank_transfer'>('cash');
    const [cashReceived, setCashReceived] = useState<string>(String(grandTotal));
    const [referenceNumber, setReferenceNumber] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { currentOutlet } = usePage<any>().props;

    const qrisImgSrc = currentOutlet?.qris_image_url
        ? currentOutlet.qris_image_url
        : (currentOutlet?.qris_payload
            ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(currentOutlet.qris_payload)}`
            : `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=00020101021226680016ID.CO.QRIS.WWW01189360091800000000000215ID10203040506070303UMI52045812530336054${grandTotal}5802ID5913RETAILPRO POS6013JAKARTA SELATAN6304`);

    const paidAmountNum = selectedMethod === 'cash' ? Number(cashReceived || 0) : grandTotal;
    const changeAmount = Math.max(0, paidAmountNum - grandTotal);

    // Broadcast Payment State to Customer Display Dual Screen
    React.useEffect(() => {
        const channel = new BroadcastChannel('pos_customer_display');
        const formattedItems = items.map((i) => ({
            product_id: i.product_id || i.product?.id,
            name: i.name || i.product?.name || 'Produk',
            sku: i.sku || i.product?.sku || '-',
            price: Number(i.price ?? i.unit_price ?? 0),
            quantity: Number(i.quantity),
            subtotal: Number(i.subtotal ?? ((i.price ?? 0) * i.quantity)),
        }));

        const stateData = {
            type: 'CHECKOUT_START',
            items: formattedItems,
            subtotal,
            discountAmount,
            taxAmount,
            grandTotal,
            selectedMethod,
            qrisImgSrc,
        };
        channel.postMessage(stateData);
        localStorage.setItem('pos_customer_display_state', JSON.stringify(stateData));
        axios.post('/pos/customer-display/state', { ...stateData, outlet_id: currentOutlet?.id }).catch(() => {});
        return () => channel.close();
    }, [selectedMethod, grandTotal, items, subtotal, discountAmount, taxAmount, qrisImgSrc]);

    // Smart Preset Nominal Uang Pas & Pembulatan Terdekat (Cocok untuk angka besar)
    const roundUpTo = (val: number, step: number) => Math.ceil(val / step) * step;
    
    // Tentukan step pembulatan dinamis berdasarkan besaran nominal Grand Total
    let steps = [10000, 20000, 50000, 100000];
    if (grandTotal >= 1000000) {
        steps = [50000, 100000, 500000, 1000000];
    } else if (grandTotal >= 100000) {
        steps = [10000, 20000, 50000, 100000];
    }

    const rawPresets = [
        grandTotal,
        ...steps.map(s => roundUpTo(grandTotal, s))
    ];

    const quickCashPresets = rawPresets
        .filter((val, index, self) => val >= grandTotal && self.indexOf(val) === index)
        .slice(0, 5);

    const handleProcessPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrorMessage(null);

        if (selectedMethod === 'cash' && paidAmountNum < grandTotal) {
            setErrorMessage('Nominal uang tunai yang diterima kurang dari Grand Total!');
            setProcessing(false);
            return;
        }

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

        const payload = {
            customer_id: customerId || null,
            items: items.map((i) => ({
                product_id: i.product_id || i.product?.id,
                quantity: Number(i.quantity),
                price: Number(i.price ?? i.unit_price ?? 0),
                discount_amount: Number(i.discount_amount || 0),
            })),
            payments: [
                {
                    method: selectedMethod,
                    amount: paidAmountNum,
                    reference_number: selectedMethod !== 'cash' ? referenceNumber : null,
                },
            ],
            subtotal,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            grand_total: grandTotal,
            paid_amount: paidAmountNum,
        };

        try {
            const res = await fetch('/pos/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                const channel = new BroadcastChannel('pos_customer_display');
                const formattedItems = items.map((i) => ({
                    product_id: i.product_id || i.product?.id,
                    name: i.name || i.product?.name || 'Produk',
                    sku: i.sku || i.product?.sku || '-',
                    price: Number(i.price ?? i.unit_price ?? 0),
                    quantity: Number(i.quantity),
                    subtotal: Number(i.subtotal ?? ((i.price ?? 0) * i.quantity)),
                }));

                const successState = {
                    type: 'CHECKOUT_SUCCESS',
                    items: formattedItems,
                    subtotal,
                    discountAmount,
                    taxAmount,
                    grandTotal,
                    changeAmount,
                    selectedMethod,
                };
                channel.postMessage(successState);
                localStorage.setItem('pos_customer_display_state', JSON.stringify(successState));
                axios.post('/pos/customer-display/state', { ...successState, outlet_id: currentOutlet?.id }).catch(() => {});
                channel.close();

                onSuccess(data.sale);
            } else {
                setErrorMessage(data.message || 'Gagal memproses transaksi checkout.');
            }
        } catch (err: any) {
            setErrorMessage('Terjadi kesalahan koneksi server: ' + (err?.message || 'Network error'));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl space-y-4 sm:space-y-5 shadow-2xl text-xs my-auto max-h-[90vh] overflow-y-auto">
                
                {/* HEADER */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                        <span className="truncate">Pembayaran Transaksi POS Kasir</span>
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ERROR NOTIFICATION */}
                {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 flex items-center gap-2 font-semibold text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="break-words">{errorMessage}</span>
                    </div>
                )}

                {/* TOTAL BILL SUMMARY CARD - RESPONSIVE FOR LARGE FIGURES */}
                <div className="bg-slate-950 p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4 overflow-hidden">
                    <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 font-semibold block tracking-wider uppercase">TOTAL TAGIHAN BELANJA</span>
                        <span className="text-lg sm:text-xl md:text-2xl font-black text-emerald-400 font-mono tracking-tight block truncate">
                            Rp {grandTotal.toLocaleString('id-ID')}
                        </span>
                    </div>
                    {selectedMethod === 'cash' && paidAmountNum >= grandTotal && (
                        <div className="sm:text-right min-w-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                            <span className="text-[10px] text-slate-500 font-semibold block tracking-wider uppercase">KEMBALIAN TUNAI</span>
                            <span className="text-base sm:text-lg font-bold text-amber-400 font-mono tracking-tight block truncate">
                                Rp {changeAmount.toLocaleString('id-ID')}
                            </span>
                        </div>
                    )}
                </div>

                {/* PAYMENT METHOD TABS */}
                <div className="space-y-2">
                    <label className="block text-slate-400 font-semibold">Pilih Metode Pembayaran</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedMethod('cash')}
                            className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center gap-1 font-bold transition cursor-pointer active:scale-95 ${
                                selectedMethod === 'cash'
                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-lg'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-[10px]">Tunai</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedMethod('qris')}
                            className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center gap-1 font-bold transition cursor-pointer active:scale-95 ${
                                selectedMethod === 'qris'
                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-lg'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-[10px]">QRIS</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedMethod('debit')}
                            className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center gap-1 font-bold transition cursor-pointer active:scale-95 ${
                                selectedMethod === 'debit'
                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-lg'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-[10px]">EDC Debit</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedMethod('credit')}
                            className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center gap-1 font-bold transition cursor-pointer active:scale-95 ${
                                selectedMethod === 'credit'
                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-lg'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-[10px]">Kredit</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedMethod('bank_transfer')}
                            className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center gap-1 font-bold transition cursor-pointer active:scale-95 ${
                                selectedMethod === 'bank_transfer'
                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-lg'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            <Landmark className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-[10px]">Transfer</span>
                        </button>
                    </div>
                </div>

                {/* FORM INPUT DYNAMIC PER METHOD */}
                <form onSubmit={handleProcessPayment} className="space-y-4">
                    {selectedMethod === 'cash' ? (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nominal Uang Tunai Diterima (Rp)</label>
                                <input
                                    type="number"
                                    required
                                    min={grandTotal}
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    placeholder="Masukkan nominal uang tunai..."
                                    className="w-full p-3 sm:p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white font-mono font-bold text-sm sm:text-base focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            {/* SMART QUICK CASH PRESETS BUTTONS */}
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                                {quickCashPresets.map((amt, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setCashReceived(String(amt))}
                                        className={`px-2.5 py-1.5 font-mono font-bold rounded-xl text-[11px] sm:text-xs transition cursor-pointer active:scale-95 border ${
                                            amt === grandTotal
                                                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600/30'
                                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'
                                        }`}
                                    >
                                        {amt === grandTotal ? 'Uang Pas: ' : ''}Rp {amt.toLocaleString('id-ID')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : selectedMethod === 'qris' ? (
                        <div className="space-y-3 flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                            <div className="flex items-center gap-1.5 bg-white text-slate-950 px-3 py-1 rounded-lg font-black text-xs tracking-wider">
                                <QrCode className="w-4 h-4 text-rose-600" />
                                <span>QRIS STANDAR NASIONAL</span>
                            </div>
                            <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-slate-200">
                                <img
                                    src={qrisImgSrc}
                                    alt="Kode QRIS Pembayaran Toko Resmi"
                                    className="w-44 h-44 object-contain rounded-lg"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">NOMINAL TRANSAKSI QRIS</span>
                                <span className="text-xl font-black text-emerald-400 font-mono">
                                    Rp {grandTotal.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="w-full text-left pt-2">
                                <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Nomor Referensi QRIS / RRN (Opsional)</label>
                                <input
                                    type="text"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    placeholder="Contoh: RRN-9081239812"
                                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nomor Referensi Transaksi / Struk (Opsional)</label>
                                <input
                                    type="text"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    placeholder="Contoh: REF-10928371928"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                        >
                            {processing ? (
                                <span>Memproses...</span>
                            ) : (
                                <>
                                    <span>Konfirmasi & Selesaikan Transaksi</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
