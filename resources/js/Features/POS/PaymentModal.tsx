import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { CreditCard, QrCode, Banknote, Landmark, AlertCircle, X, Plus, Trash2, Tag, Sparkles, UserCheck } from 'lucide-react';

interface PaymentRow {
    method: string;
    amount: number;
    reference_number: string;
}

interface PaymentModalProps {
    grandTotal: number;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    items: any[];
    customerId?: number | null;
    discounts?: any[];
    customers?: any[];
    onClose: () => void;
    onSuccess: (saleData: any) => void;
}

export default function PaymentModal({
    grandTotal: initialGrandTotal,
    subtotal: initialSubtotal,
    taxAmount: initialTaxAmount,
    discountAmount: initialDiscountAmount,
    items,
    customerId,
    discounts = [],
    customers = [],
    onClose,
    onSuccess,
}: PaymentModalProps) {
    const { currentOutlet } = usePage<any>().props;

    const safeCustomers = Array.isArray(customers) ? customers : [];
    const safeDiscounts = Array.isArray(discounts) ? discounts : [];
    const safeItems = Array.isArray(items) ? items : [];

    const selectedCustomer = safeCustomers.find(c => c && c.id === customerId);

    // Multi-Payment Rows
    const [payments, setPayments] = useState<PaymentRow[]>([
        { method: 'cash', amount: initialGrandTotal, reference_number: '' }
    ]);

    // Extra Diskon & Loyalty Points State
    const [promoCode, setPromoCode] = useState<string>('');
    const [extraDiscount, setExtraDiscount] = useState<number>(0);
    const [pointsUsed, setPointsUsed] = useState<number>(0);
    const [pointsDiscount, setPointsDiscount] = useState<number>(0);

    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Calculate Final Total after extra discounts
    const totalDiscountAmount = initialDiscountAmount + extraDiscount + pointsDiscount;
    const finalGrandTotal = Math.max(0, initialSubtotal - totalDiscountAmount + initialTaxAmount);

    const totalPaidAmount = (payments || []).reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
    const hasKasbon = (payments || []).some(p => p && ['kasbon', 'credit_member', 'piutang'].includes(p.method));
    const changeAmount = hasKasbon ? 0 : Math.max(0, totalPaidAmount - finalGrandTotal);

    const qrisImgSrc = currentOutlet?.qris_image_url
        ? currentOutlet.qris_image_url
        : (currentOutlet?.qris_payload
            ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(currentOutlet.qris_payload)}`
            : `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=00020101021226680016ID.CO.QRIS.WWW01189360091800000000000215ID10203040506070303UMI52045812530336054${finalGrandTotal}5802ID5913RETAILPRO POS6013JAKARTA SELATAN6304`);

    // Handle Promo Code Apply
    const handleApplyPromo = () => {
        const found = safeDiscounts.find(d => d && d.code && d.code.toUpperCase() === promoCode.trim().toUpperCase() && d.is_active);
        if (!found) {
            alert('⚠️ Kode promo/voucher tidak ditemukan atau sudah tidak aktif!');
            return;
        }

        let discVal = 0;
        if (found.type === 'percentage') {
            discVal = (initialSubtotal * (Number(found.value) / 100));
            if (found.max_discount && discVal > Number(found.max_discount)) {
                discVal = Number(found.max_discount);
            }
        } else {
            discVal = Number(found.value);
        }

        setExtraDiscount(discVal);
        alert(`✅ Promo '${found.name}' berhasil dipasang! Hemat Rp ${discVal.toLocaleString('id-ID')}`);
    };

    // Handle Points Redeem (1 Point = Rp 100)
    const handleTogglePoints = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedCustomer || !selectedCustomer.points) return;
        if (e.target.checked) {
            const pts = selectedCustomer.points;
            const ptsValue = pts * 100;
            setPointsUsed(pts);
            setPointsDiscount(ptsValue);
        } else {
            setPointsUsed(0);
            setPointsDiscount(0);
        }
    };

    // Add Payment Row for Split Bill Multi-Payment
    const addPaymentRow = () => {
        const remaining = Math.max(0, finalGrandTotal - totalPaidAmount);
        setPayments([...payments, { method: 'qris', amount: remaining, reference_number: '' }]);
    };

    const removePaymentRow = (index: number) => {
        if (payments.length <= 1) return;
        setPayments(payments.filter((_, i) => i !== index));
    };

    const updatePaymentRow = (index: number, field: keyof PaymentRow, value: any) => {
        const updated = [...payments];
        updated[index] = { ...updated[index], [field]: value };
        setPayments(updated);
    };

    // Broadcast Payment State to Customer Display Dual Screen
    React.useEffect(() => {
        const channel = new BroadcastChannel('pos_customer_display');
        const formattedItems = safeItems.map((i) => ({
            product_id: i?.product_id || i?.product?.id,
            name: i?.name || i?.product?.name || 'Produk',
            sku: i?.sku || i?.product?.sku || '-',
            price: Number(i?.price ?? i?.unit_price ?? 0),
            quantity: Number(i?.quantity || 1),
            subtotal: Number(i?.subtotal ?? ((i?.price ?? 0) * (i?.quantity || 1))),
        }));

        const stateData = {
            type: 'CHECKOUT_START',
            items: formattedItems,
            subtotal: initialSubtotal,
            discountAmount: totalDiscountAmount,
            taxAmount: initialTaxAmount,
            grandTotal: finalGrandTotal,
            selectedMethod: payments[0]?.method || 'cash',
            qrisImgSrc,
        };
        channel.postMessage(stateData);
        localStorage.setItem('pos_customer_display_state', JSON.stringify(stateData));
        axios.post('/pos/customer-display/state', { ...stateData, outlet_id: currentOutlet?.id }).catch(() => {});
        return () => channel.close();
    }, [payments, finalGrandTotal, items, initialSubtotal, totalDiscountAmount, initialTaxAmount, qrisImgSrc]);

    const handleProcessPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrorMessage(null);

        if (!hasKasbon && totalPaidAmount < finalGrandTotal) {
            setErrorMessage('Jumlah total pembayaran kurang dari Grand Total!');
            setProcessing(false);
            return;
        }

        if (hasKasbon && !customerId) {
            setErrorMessage('Pembayaran Kasbon / Piutang wajib memilih Pelanggan Member!');
            setProcessing(false);
            return;
        }

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

        const payload = {
            customer_id: customerId || null,
            items: safeItems.map((i) => ({
                product_id: i?.product_id || i?.product?.id,
                quantity: Number(i?.quantity || 1),
                price: Number(i?.price ?? i?.unit_price ?? 0),
                discount_amount: Number(i?.discount_amount || 0),
            })),
            payments: (payments || []).map(p => ({
                method: p?.method || 'cash',
                amount: Number(p?.amount || 0),
                reference_number: p?.reference_number || null,
            })),
            subtotal: initialSubtotal,
            discount_amount: totalDiscountAmount,
            discount_code: promoCode || null,
            points_used: pointsUsed,
            points_discount_amount: pointsDiscount,
            tax_amount: initialTaxAmount,
            grand_total: finalGrandTotal,
            paid_amount: totalPaidAmount,
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
                    subtotal: initialSubtotal,
                    discountAmount: totalDiscountAmount,
                    taxAmount: initialTaxAmount,
                    grandTotal: finalGrandTotal,
                    changeAmount,
                    selectedMethod: payments[0]?.method || 'cash',
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
            if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
                const offlineSale = {
                    id: 'OFFLINE-' + Date.now(),
                    invoice_number: 'INV/OFFLINE/' + Date.now(),
                    sale_date: new Date().toISOString(),
                    grand_total: finalGrandTotal,
                    paid_amount: totalPaidAmount,
                    change_amount: changeAmount,
                    items: items,
                    payments: payments,
                    is_offline: true,
                    payload: payload,
                };

                const existingQueue = JSON.parse(localStorage.getItem('pos_offline_sales_queue') || '[]');
                existingQueue.push(offlineSale);
                localStorage.setItem('pos_offline_sales_queue', JSON.stringify(existingQueue));

                alert('⚠️ Transaksi disimpan di mode Offline!');
                onSuccess(offlineSale);
                return;
            }

            setErrorMessage('Terjadi kesalahan koneksi server: ' + (err?.message || 'Network error'));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl space-y-4 sm:space-y-5 shadow-2xl text-xs my-auto max-h-[90vh] overflow-y-auto font-sans">
                
                {/* HEADER */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                        <span className="truncate">Checkout Pembayaran POS (Multi-Payment & Promo)</span>
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

                {/* TOTAL BILL & DISCOUNT SUMMARY */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Subtotal Belanja:</span>
                        <span className="font-mono text-white font-bold">Rp {initialSubtotal.toLocaleString('id-ID')}</span>
                    </div>

                    {totalDiscountAmount > 0 && (
                        <div className="flex justify-between items-center text-emerald-400 font-bold">
                            <span>Total Potongan Diskon / Promo / Poin:</span>
                            <span className="font-mono">- Rp {totalDiscountAmount.toLocaleString('id-ID')}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                        <span className="text-xs font-bold text-slate-300">GRAND TOTAL BAYAR:</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono">
                            Rp {finalGrandTotal.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                {/* MEMBER POINTS & PROMO VOUCHER SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* PROMO CODE INPUT */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                        <label className="block text-[11px] font-bold text-amber-400 flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" /> Kode Voucher / Promo
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                placeholder="e.g. HEMAT10"
                                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 font-mono text-xs font-bold uppercase"
                            />
                            <button
                                type="button"
                                onClick={handleApplyPromo}
                                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl"
                            >
                                Pasang
                            </button>
                        </div>
                    </div>

                    {/* LOYALTY POINTS REDEEM */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                        <label className="block text-[11px] font-bold text-blue-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> Poin Pelanggan Member
                        </label>
                        {selectedCustomer ? (
                            <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-slate-300">
                                <input
                                    type="checkbox"
                                    onChange={handleTogglePoints}
                                    disabled={!selectedCustomer.points || selectedCustomer.points <= 0}
                                    className="rounded border-slate-700 bg-slate-900 text-blue-600"
                                />
                                <span>Tukar {selectedCustomer.points || 0} Poin (Hemat Rp {((selectedCustomer.points || 0) * 100).toLocaleString('id-ID')})</span>
                            </label>
                        ) : (
                            <span className="text-[10px] text-slate-500 block pt-1">Pilih Member Pelanggan untuk tukar poin reward.</span>
                        )}
                    </div>
                </div>

                {/* MULTI-PAYMENT SPLIT BILL SECTION */}
                <form onSubmit={handleProcessPayment} className="space-y-4">
                    <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="font-bold text-xs text-white">Metode Pembayaran (Split Bill / Multi-Payment)</span>
                            <button
                                type="button"
                                onClick={addPaymentRow}
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> + Tambah Metode Pembayaran
                            </button>
                        </div>

                        {payments.map((p, idx) => (
                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                                <div>
                                    <select
                                        value={p.method}
                                        onChange={(e) => updatePaymentRow(idx, 'method', e.target.value)}
                                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-xs"
                                    >
                                        <option value="cash">💵 Tunai (Cash)</option>
                                        <option value="qris">📱 QRIS Instant</option>
                                        <option value="debit">💳 EDC Debit</option>
                                        <option value="credit">💳 Kartu Kredit</option>
                                        <option value="bank_transfer">🏦 Bank Transfer</option>
                                        <option value="kasbon">📋 Kasbon / Piutang Member</option>
                                    </select>
                                </div>

                                <div>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={p.amount}
                                        onChange={(e) => updatePaymentRow(idx, 'amount', Number(e.target.value))}
                                        placeholder="Nominal Bayar"
                                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono font-bold text-xs"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={p.reference_number}
                                        onChange={(e) => updatePaymentRow(idx, 'reference_number', e.target.value)}
                                        placeholder="No Ref / Struk"
                                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-[11px]"
                                    />
                                    {payments.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removePaymentRow(idx)}
                                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* QUICK CASH NOMINAL BUTTONS (FOR CASH METHOD) */}
                    {payments[0]?.method === 'cash' && (
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                            <span className="text-[11px] font-bold text-amber-400 block">⚡ Pilihan Nominal Uang Cash Cepat:</span>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                <button
                                    type="button"
                                    onClick={() => updatePaymentRow(0, 'amount', finalGrandTotal)}
                                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-xl font-mono text-xs font-black transition cursor-pointer active:scale-95"
                                >
                                    Uang Pas (Rp {finalGrandTotal.toLocaleString('id-ID')})
                                </button>
                                {[10000, 20000, 50000, 100000].map((nominal) => {
                                    return (
                                        <button
                                            key={nominal}
                                            type="button"
                                            onClick={() => updatePaymentRow(0, 'amount', nominal)}
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-mono text-xs font-bold transition cursor-pointer active:scale-95"
                                        >
                                            Rp {nominal.toLocaleString('id-ID')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* KEMBALIAN REAL-TIME */}
                    {totalPaidAmount >= finalGrandTotal && !hasKasbon && (
                        <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-2xl flex justify-between items-center text-emerald-400 font-sans">
                            <span className="text-xs font-black uppercase tracking-wider">💰 Uang Kembalian Pelanggan:</span>
                            <span className="text-xl font-black font-mono">
                                Rp {changeAmount.toLocaleString('id-ID')}
                            </span>
                        </div>
                    )}

                    {/* ACTION BUTTONS */}
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
