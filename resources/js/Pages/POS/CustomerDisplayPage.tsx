import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { ShoppingBag, ShoppingCart, CheckCircle2, QrCode, Store, Sparkles, ShieldCheck, Maximize } from 'lucide-react';

interface CustomerDisplayProps {
    outlet?: {
        name: string;
        code: string;
        display_pair_token?: string;
        qris_payload?: string;
        qris_image_url?: string;
    };
}

interface CartItemData {
    product_id: number;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    subtotal: number;
}

interface BroadcastState {
    type: 'CART_UPDATE' | 'CLEAR_CART' | 'CHECKOUT_START' | 'CHECKOUT_SUCCESS';
    outlet_id?: number;
    outlet_name?: string;
    items?: CartItemData[];
    subtotal?: number;
    discountAmount?: number;
    taxAmount?: number;
    grandTotal?: number;
    selectedMethod?: string;
    paidAmount?: number;
    changeAmount?: number;
    qrisImgSrc?: string;
}

export default function CustomerDisplayPage({ outlet }: CustomerDisplayProps) {
    const [pairingCode, setPairingCode] = useState(() => {
        if (typeof window !== 'undefined') {
            const queryCode = new URLSearchParams(window.location.search).get('pair_code') || new URLSearchParams(window.location.search).get('code');
            return queryCode || localStorage.getItem('pos_paired_code') || outlet?.display_pair_token || '';
        }
        return outlet?.display_pair_token || '';
    });
    const [showPairModal, setShowPairModal] = useState(false);
    const [showQrisManual, setShowQrisManual] = useState(false);
    const [showViewAll, setShowViewAll] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const toggleFullScreen = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        };
        toggleFullScreen();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsFullScreen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullScreen]);

    const handleSavePairing = (code: string) => {
        setPairingCode(code);
        localStorage.setItem('pos_paired_code', code);
        setShowPairModal(false);
    };
    const [cartState, setCartState] = useState<BroadcastState>({
        type: 'CART_UPDATE',
        items: [],
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        grandTotal: 0,
    });

    useEffect(() => {
        const applyTheme = (t: string) => {
            const root = document.documentElement;
            if (t === 'light') {
                root.classList.add('light');
                root.classList.remove('dark');
            } else {
                root.classList.add('dark');
                root.classList.remove('light');
            }
        };

        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);

        const channel = new BroadcastChannel('pos_customer_display');

        const updateStateIfValid = (incoming: BroadcastState) => {
            setCartState((prev) => {
                // If previous state is CHECKOUT_SUCCESS and incoming is empty CART_UPDATE, hold the success display!
                if (prev.type === 'CHECKOUT_SUCCESS' && incoming.type === 'CART_UPDATE' && (!incoming.items || incoming.items.length === 0)) {
                    return prev;
                }
                return incoming;
            });
        };

        const handleMessage = (event: MessageEvent<any>) => {
            if (event.data) {
                if (event.data.type === 'THEME_CHANGE' && event.data.theme) {
                    applyTheme(event.data.theme);
                } else {
                    updateStateIfValid(event.data);
                }
            }
        };

        channel.addEventListener('message', handleMessage);

        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'theme' && e.newValue) {
                applyTheme(e.newValue);
            }
            if (e.key === 'pos_customer_display_state' && e.newValue) {
                try {
                    updateStateIfValid(JSON.parse(e.newValue));
                } catch (err) {
                    console.error('Failed to parse customer display state:', err);
                }
            }
        };
        window.addEventListener('storage', handleStorage);

        // Polling fallback for cross-device dual display (Laptop Kasir <-> Tablet Pembeli)
        const pollInterval = setInterval(() => {
            const queryCode = new URLSearchParams(window.location.search).get('pair_code') || new URLSearchParams(window.location.search).get('code');
            const activeCode = queryCode || localStorage.getItem('pos_paired_code') || pairingCode || '';
            const fetchUrl = activeCode ? `/pos/customer-display/state?code=${encodeURIComponent(activeCode)}` : '/pos/customer-display/state';
            fetch(fetchUrl)
                .then(res => res.json())
                .then(data => {
                    if (data && data.type) {
                        updateStateIfValid(data);
                    }
                })
                .catch(() => {});
        }, 1000);

        return () => {
            channel.removeEventListener('message', handleMessage);
            window.removeEventListener('storage', handleStorage);
            clearInterval(pollInterval);
            channel.close();
        };
    }, []);

    const items = cartState.items || [];
    const grandTotal = cartState.grandTotal || 0;
    const subtotal = cartState.subtotal || 0;
    const discountAmount = cartState.discountAmount || 0;
    const taxAmount = cartState.taxAmount || 0;
    const isCheckoutSuccess = cartState.type === 'CHECKOUT_SUCCESS';
    const isCheckoutPending = cartState.type === 'CHECKOUT_START';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white overflow-hidden">
            <Head title="🖥️ Layar Pelanggan (Customer Display Monitor) - RetailPRO POS" />

            {/* TOP BRAND HEADER */}
            <header className="bg-slate-900/90 border-b border-slate-800 p-4 flex justify-between items-center shadow-xl shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                        <ShoppingBag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-lg text-white tracking-tight leading-tight flex items-center gap-2">
                            <span>KasirSewa Enterprise POS</span>
                            <button
                                onClick={() => setShowPairModal(true)}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-xl text-[10px] font-mono font-bold cursor-pointer transition flex items-center gap-1"
                                title="Klik untuk ubah Kode Pairing Toko"
                            >
                                🔑 {pairingCode ? `PAIR: ${pairingCode}` : 'HUBUNGKAN KODE KASIR'}
                            </button>

                            
                        </h1>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                            <Store className="w-3.5 h-3.5 text-emerald-400" />
</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300">Selamat Datang di Toko Kami</span>
                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-xl text-[10px] font-mono font-bold cursor-pointer transition flex items-center gap-1"
                        title="Fullscreen"
                    >
                        <Maximize className="w-3.5 h-3.5" />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 lg:p-6 gap-6">
                
                {/* LEFT: LIVE ITEMS SCANNED LIST (COL 7) */}
                <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl min-h-0">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
                        <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-emerald-400" />
                            <span>Rincian Barang Belanjaan</span>
                        </h2>
                        <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                            {items.reduce((acc, curr) => acc + curr.quantity, 0)} Item
                        </span>
                    </div>

                    {/* ITEMS TABLE */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                                <div className="p-6 bg-slate-950/80 rounded-full border border-slate-800/80 shadow-inner">
                                    <Sparkles className="w-12 h-12 text-emerald-400 animate-pulse" />
                                </div>
                                <div className="space-y-1 max-w-sm">
                                    <h3 className="font-black text-lg text-white">Silakan Pilih Barang</h3>
                                    <p className="text-xs text-slate-400">Kasir siap melayani transaksi Anda. Barang yang di-scan akan tampil secara otomatis di layar ini.</p>
                                </div>
                            </div>
                        ) : (
                            items.map((item, idx) => (
                                <div
                                    key={item.product_id || idx}
                                    className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex justify-between items-center gap-4 transition hover:border-emerald-500/40 shadow-sm"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-extrabold text-sm text-white truncate">{item.name}</h4>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
                                            <span>SKU: {item.sku}</span>
                                            <span>•</span>
                                            <span>Rp {item.price.toLocaleString('id-ID')} x <strong>{item.quantity}</strong></span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="font-black text-base text-emerald-400 font-mono block">
                                            Rp {item.subtotal.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: GIANT TOTAL TAGIHAN DISPLAY & PAYMENT MODAL PROMPT (COL 5) */}
                <div className="w-full lg:w-[450px] flex flex-col gap-5 shrink-0">
                    
                    {/* GIANT LED GRAND TOTAL DISPLAY CARD */}
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/40 p-6 rounded-3xl shadow-2xl flex flex-col justify-between space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">TOTAL TAGIHAN KASIR</span>
                            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400 font-mono tracking-tight block truncate drop-shadow-lg">
                                Rp {grandTotal.toLocaleString('id-ID')}
                            </span>
                        </div>

                        {/* SUB-TOTAL CALCULATOR BREAKDOWN */}
                        <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs font-mono">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal Belanja:</span>
                                <span className="font-bold text-slate-200">Rp {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-amber-400">
                                    <span>Diskon Transaksi:</span>
                                    <span className="font-bold">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            {taxAmount > 0 && (
                                <div className="flex justify-between text-blue-400">
                                    <span>Pajak PPN:</span>
                                    <span className="font-bold">+ Rp {taxAmount.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DYNAMIC CHECKOUT / QRIS QR CODE STATUS */}
                    {isCheckoutSuccess ? (
                        <div className="bg-emerald-600/20 border-2 border-emerald-500 p-6 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in zoom-in-95 duration-200 shadow-xl">
                            <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
                            <div>
                                <h3 className="font-black text-xl text-white">PEMBAYARAN LUNAS!</h3>
                                <p className="text-xs text-emerald-200 mt-1">Terima kasih telah berbelanja di store kami. Struk pembayaran sedang dicetak.</p>
                            </div>
                            {cartState.changeAmount !== undefined && cartState.changeAmount > 0 && (
                                <div className="mt-2 p-3 bg-slate-950/80 border border-emerald-500/30 rounded-2xl w-full">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">KEMBALIAN TUNAI</span>
                                    <span className="text-xl font-black text-amber-400 font-mono">
                                        Rp {cartState.changeAmount.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (cartState.selectedMethod === 'qris' || cartState.qrisImgSrc || showQrisManual || cartState.type === 'CHECKOUT_START') ? (
                        <div className="bg-slate-900 border-2 border-emerald-500/40 p-6 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-1.5 bg-white text-slate-950 px-3 py-1 rounded-lg font-black text-xs tracking-wider">
                                <QrCode className="w-4 h-4 text-rose-600" />
                                <span>QRIS STANDAR NASIONAL</span>
                            </div>
                            <div className="p-3.5 bg-white rounded-2xl shadow-2xl border-2 border-slate-200">
                                <img
                                    src={
                                        cartState.qrisImgSrc ||
                                        outlet?.qris_image_url ||
                                        (outlet?.qris_payload
                                            ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(outlet.qris_payload)}`
                                            : `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=00020101021226680016ID.CO.QRIS.WWW01189360091800000000000215ID10203040506070303UMI52045812530336054${grandTotal || 10000}5802ID5913${encodeURIComponent(cartState.outlet_name || outlet?.name || 'KasirSewa Store')}6013JAKARTA6304`)
                                    }
                                    alt="Kode QRIS Layar Pelanggan Toko Resmi"
                                    className="w-56 h-56 object-contain rounded-lg"
                                />
                            </div>
                            <div>
                                <h4 className="font-black text-base text-white tracking-wide">SCAN KODE QRIS DI ATAS</h4>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">Gunakan BCA Mobile, Livin Mandiri, BRImo, BSI, GoPay, OVO, ShopeePay, atau Dana.</p>
                                <button
                                    onClick={() => setShowQrisManual(false)}
                                    className="mt-3 text-[11px] text-amber-400 hover:underline font-bold"
                                >
                                    ✕ Sembunyikan QRIS
                                </button>

                            
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl shrink-0">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-xs text-white">KasirSewa Guarantee</h4>
                                    <p className="text-[11px] text-slate-400 leading-snug">Jaminan harga pas & akurat. Layanan struk fisik & digital otomatis.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowQrisManual(true)}
                                className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                                <QrCode className="w-4 h-4" />
                                <span>Tampilkan QRIS</span>
                            </button>

                            
                        </div>
                    )}

                </div>

            </div>

            {/* PAIRING CODE MODAL */}
            {showPairModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                                🔑 Hubungkan Kode Kasir (Pairing Code)
                            </h3>
                            <button onClick={() => setShowPairModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            
                        </div>

                        <p className="text-slate-400 leading-relaxed">
                            Masukkan Kode Outlet / Kode Kasir (Contoh: <strong className="text-amber-400">OUT-001</strong>) untuk menghubungkan layar HP/Tablet ini dengan laci kasir aktif Anda:
                        </p>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formEl = e.target as HTMLFormElement;
                            const inputEl = formEl.elements.namedItem('pairInput') as HTMLInputElement;
                            handleSavePairing(inputEl.value.trim());
                        }} className="space-y-4">
                            <input
                                name="pairInput"
                                type="text"
                                defaultValue={pairingCode}
                                placeholder="Contoh: OUT-001"
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-mono font-bold text-center text-amber-400 uppercase tracking-widest focus:border-amber-500 focus:outline-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPairModal(false)}
                                    className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                                >
                                    Batal
                                </button>

                            
                                <button
                                    type="submit"
                                    className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20"
                                >
                                    Simpan & Hubungkan
                                </button>

                            
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
