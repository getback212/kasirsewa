import { useState, useEffect } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Search, 
    ShoppingCart, 
    Trash2, 
    Plus, 
    Minus, 
    PauseCircle, 
    CreditCard, 
    Clock, 
    User as UserIcon,
    X,
    Percent,
    Boxes,
    AlertTriangle,
    Unlock,
    CheckCircle,
    Printer,
    Monitor,
    History
} from 'lucide-react';
import { useBarcodeScanner } from '@/Hooks/useBarcodeScanner';
import { useKeyboardShortcuts } from '@/Hooks/useKeyboardShortcuts';
import PaymentModal from '@/Features/POS/PaymentModal';
import type { PageProps } from '@/Types';

interface CategoryItem {
    id: number;
    name: string;
    slug: string;
}

interface ProductItem {
    id: number;
    sku: string;
    barcode?: string;
    name: string;
    selling_price: number;
    cost_price: number;
    stock?: number;
    image_url?: string;
    category?: CategoryItem;
    unit?: { name: string };
    stocks?: { quantity: number }[];
}

interface CustomerItem {
    id: number;
    code: string;
    name: string;
    phone?: string;
}

interface CartItem {
    product: ProductItem;
    quantity: number;
    price: number;
    discount_amount: number;
    subtotal: number;
}

interface HeldCartRecord {
    id: number;
    reference_note: string;
    customer?: { name: string };
    created_at: string;
    items: any[];
}

interface ShiftRecord {
    id: number;
    opening_cash: number;
    status: string;
    opened_at: string;
}

interface POSPageProps extends PageProps {
    products?: ProductItem[];
    categories?: CategoryItem[];
    customers?: CustomerItem[];
    heldCarts?: HeldCartRecord[];
    heldTransactions?: HeldCartRecord[];
    recentSales?: any[];
    currentShift?: ShiftRecord | null;
}

export default function POSPage({ 
    products = [], 
    categories = [], 
    customers = [], 
    heldCarts = [],
    heldTransactions = [],
    recentSales = [],
    currentShift = null
}: POSPageProps) {
    const pageProps = usePage<POSPageProps & { currentOutlet?: any; auth: any }>().props;
    const auth = pageProps.auth;
    const activeOutlet = pageProps.currentOutlet || auth?.currentOutlet;

    const safeHeldCarts = heldCarts.length > 0 ? heldCarts : heldTransactions;

    // Default Tax Rate from Active Outlet
    const initialTaxRate = activeOutlet?.enable_ppn !== false 
        ? (activeOutlet?.tax_percentage !== undefined && activeOutlet?.tax_percentage !== null ? Number(activeOutlet.tax_percentage) / 100 : 0.11)
        : 0;

    const roles: string[] = Array.isArray(auth?.roles) 
        ? auth.roles 
        : (auth?.user?.roles ? auth.user.roles.map((r: any) => typeof r === 'string' ? r : r.name) : []);
    const isManagement = roles.includes('SUPER_ADMIN') || roles.includes('OWNER');
    const isShiftOpen = currentShift !== null || isManagement;

    const [cart, setCart] = useState<CartItem[]>([]);
    const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog'); // Mobile View Switcher
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
    const [transactionDiscount, setTransactionDiscount] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(initialTaxRate); // Dynamic PPN Tax Rate

    // Sync tax rate whenever activeOutlet changes
    useEffect(() => {
        setTaxRate(initialTaxRate);
    }, [initialTaxRate]);
    const [showHeldModal, setShowHeldModal] = useState<boolean>(false);
    const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
    const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
    const [completedSale, setCompletedSale] = useState<any | null>(null);
    const [holdingCart, setHoldingCart] = useState<boolean>(false);

    // Offline Resilience & Auto-Sync Engine
    const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);

    const syncOfflineQueue = async () => {
        const queue = JSON.parse(localStorage.getItem('pos_offline_sales_queue') || '[]');
        if (queue.length === 0) return;

        let successCount = 0;
        const remainingQueue: any[] = [];

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

        for (const offlineSale of queue) {
            try {
                const res = await fetch('/pos/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify(offlineSale.payload),
                });
                if (res.ok) {
                    successCount++;
                } else {
                    remainingQueue.push(offlineSale);
                }
            } catch (err) {
                remainingQueue.push(offlineSale);
            }
        }

        localStorage.setItem('pos_offline_sales_queue', JSON.stringify(remainingQueue));
        setPendingOfflineCount(remainingQueue.length);

        if (successCount > 0) {
            alert(`✅ SINKRONISASI OTOMATIS BERHASIL!\n\n${successCount} transaksi offline berhasil dikirim dan dicatat ke cloud server.`);
        }
    };

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncOfflineQueue();
        };
        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const initialQueue = JSON.parse(localStorage.getItem('pos_offline_sales_queue') || '[]');
        setPendingOfflineCount(initialQueue.length);
        if (navigator.onLine && initialQueue.length > 0) {
            syncOfflineQueue();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Hardware Barcode Scanner Listener
    useBarcodeScanner({
        onScan: (barcode) => {
            const foundProduct = products.find((p) => p.barcode === barcode || p.sku === barcode);
            if (foundProduct) {
                addToCart(foundProduct);
            }
        },
    });

    // POS Keyboard Shortcuts (F2: Search, F3: History, F8: Payment, F9: Hold, Esc: Clear)
    useKeyboardShortcuts({
        onF2: () => {
            const searchEl = document.getElementById('pos-search-input');
            if (searchEl) searchEl.focus();
        },
        onF3: () => {
            setShowHistoryModal((prev) => !prev);
        },
        onF8: () => {
            if (cart.length > 0 && isShiftOpen) setShowPaymentModal(true);
        },
        onF9: () => {
            if (cart.length > 0 && isShiftOpen) handleHoldCart();
        },
        onEsc: () => {
            if (showPaymentModal) setShowPaymentModal(false);
            else if (showHeldModal) setShowHeldModal(false);
            else if (showHistoryModal) setShowHistoryModal(false);
        },
    });

    const addToCart = (product: ProductItem) => {
        const availableStock = product.stock !== undefined ? product.stock : (product.stocks && product.stocks.length > 0 ? product.stocks[0].quantity : 0);
        
        // Block adding if stock is zero or less
        if (availableStock <= 0) {
            alert(`Stok untuk produk "${product.name}" KOSONG (0)! Tidak dapat dimasukkan ke keranjang.`);
            return;
        }

        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
            if (existingIndex > -1) {
                const item = prevCart[existingIndex];
                if (item.quantity + 1 > availableStock) {
                    alert(`Stok produk "${product.name}" tidak mencukupi (Sisa Stok: ${availableStock}).`);
                    return prevCart;
                }
                const updated = [...prevCart];
                const newQty = item.quantity + 1;
                const newSubtotal = (item.price - item.discount_amount) * newQty;
                updated[existingIndex] = { ...item, quantity: newQty, subtotal: newSubtotal };
                return updated;
            } else {
                return [
                    ...prevCart,
                    {
                        product,
                        quantity: 1,
                        price: product.selling_price,
                        discount_amount: 0,
                        subtotal: product.selling_price,
                    },
                ];
            }
        });
    };

    const updateQuantity = (productId: number, newQty: number) => {
        if (newQty <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart((prevCart) =>
            prevCart.map((item) => {
                if (item.product.id === productId) {
                    const availableStock = item.product.stock !== undefined ? item.product.stock : (item.product.stocks && item.product.stocks.length > 0 ? item.product.stocks[0].quantity : 0);
                    if (newQty > availableStock) {
                        alert(`Jumlah melebihi stok yang tersedia (Sisa Stok: ${availableStock}).`);
                        return item;
                    }
                    return {
                        ...item,
                        quantity: newQty,
                        subtotal: (item.price - item.discount_amount) * newQty,
                    };
                }
                return item;
            })
        );
    };

    const removeFromCart = (productId: number) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = Math.max(0, (subtotal - transactionDiscount) * taxRate);
    const grandTotal = Math.max(0, subtotal - transactionDiscount + taxAmount);
    const totalCartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // BroadcastChannel & LocalStorage Real-Time Dual Screen Sync
    useEffect(() => {
        const channel = new BroadcastChannel('pos_customer_display');
        const stateData = {
            type: 'CART_UPDATE',
            outlet_id: activeOutlet?.id || 1,
            items: cart.map(i => ({
                product_id: i.product.id,
                name: i.product.name,
                sku: i.product.sku,
                price: i.price,
                quantity: i.quantity,
                subtotal: i.subtotal,
            })),
            subtotal,
            discountAmount: transactionDiscount,
            taxAmount,
            grandTotal,
        };
        channel.postMessage(stateData);
        localStorage.setItem('pos_customer_display_state', JSON.stringify(stateData));
        axios.post('/pos/customer-display/state', stateData).catch(() => {});

        return () => channel.close();
    }, [cart, subtotal, transactionDiscount, taxAmount, grandTotal]);

    const openCustomerDisplay = () => {
        window.open('/pos/customer-display', 'CustomerDisplayWindow', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
    };

    const filteredProducts = (products || []).filter((p) => {
        const matchesCategory = selectedCategory === 'all' || p.category?.id === selectedCategory;
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.barcode && p.barcode.includes(searchQuery));
        return matchesCategory && matchesSearch;
    });

    const handleHoldCart = () => {
        if (cart.length === 0 || !isShiftOpen) return;
        setHoldingCart(true);
        const payload = {
            customer_id: selectedCustomer?.id || null,
            reference_note: `Pending Cart ${new Date().toLocaleTimeString('id-ID')}`,
            items: cart.map((i) => ({
                product_id: i.product.id,
                quantity: i.quantity,
                price: i.price,
                discount_amount: i.discount_amount || 0,
            })),
        };

        router.post('/pos/hold-cart', payload, {
            preserveScroll: true,
            onSuccess: () => {
                setCart([]);
                setSelectedCustomer(null);
                setTransactionDiscount(0);
                setHoldingCart(false);
            },
            onError: (errs) => {
                console.error("Hold Cart Errors:", errs);
                setHoldingCart(false);
            },
        });
    };

    const handleResumeHeldCart = (held: HeldCartRecord) => {
        const restoredItems: CartItem[] = (held.items || []).map((item: any) => {
            const liveProd = products.find((p) => p.id === item.product_id) || item.product;
            return {
                product: liveProd,
                quantity: item.quantity,
                price: Number(item.price),
                discount_amount: Number(item.discount_amount || 0),
                subtotal: (Number(item.price) - Number(item.discount_amount || 0)) * item.quantity,
            };
        });
        setCart(restoredItems);

        if (held.customer) {
            setSelectedCustomer(held.customer);
        }

        router.delete(`/pos/hold-cart/${held.id}`, {
            preserveScroll: true,
            onSuccess: () => setShowHeldModal(false),
        });
    };

    return (
        <AppLayout title="POS Kasir">
            <Head title="🛒 Halaman POS Kasir Touch - RetailPRO POS" />

            <div className="min-h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-950 pb-20 md:pb-0">
                
                {/* WARNING BANNER WHEN CASHIER SHIFT IS NOT OPENED */}
                {!isShiftOpen && (
                    <div className="bg-amber-500/15 border-b border-amber-500/30 p-3 px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 z-30">
                        <div className="flex items-center gap-2.5 text-xs text-amber-300 font-semibold">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span><strong>PERINGATAN OPERASIONAL:</strong> Shift kasir Anda belum dibuka. Buka shift kasir terlebih dahulu sebelum melayani transaksi pembayaran.</span>
                        </div>
                        <Link
                            href="/shifts"
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-md shrink-0"
                        >
                            <Unlock className="w-3.5 h-3.5" /> + Buka Shift Kasir Now
                        </Link>
                    </div>
                )}

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    
                    {/* MOBILE VIEW SWITCHER HEADER (SHOWN ONLY ON HP SMARTPHONES) */}
                    <div className="md:hidden flex border-b border-slate-800 bg-slate-900 sticky top-0 z-30 font-bold text-xs shadow-md">
                        <button
                            onClick={() => setMobileTab('catalog')}
                            className={`flex-1 py-3 text-center flex items-center justify-center gap-2 border-b-2 transition ${
                                mobileTab === 'catalog'
                                    ? 'text-emerald-400 border-emerald-400 bg-slate-800/60 font-extrabold'
                                    : 'text-slate-400 border-transparent hover:text-slate-200'
                            }`}
                        >
                            <Boxes className="w-4 h-4" />
                            <span>Katalog Produk</span>
                        </button>
                        <button
                            onClick={() => setMobileTab('cart')}
                            className={`flex-1 py-3 text-center flex items-center justify-center gap-2 border-b-2 transition relative ${
                                mobileTab === 'cart'
                                    ? 'text-emerald-400 border-emerald-400 bg-slate-800/60 font-extrabold'
                                    : 'text-slate-400 border-transparent hover:text-slate-200'
                            }`}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Keranjang</span>
                            {cart.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 rounded-full font-mono text-[10px] font-extrabold shadow">
                                    {totalCartItemCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* LEFT: PRODUCT CATALOG GRID & SEARCH (COL 8) */}
                    <div className={`flex-1 flex flex-col p-4 space-y-4 overflow-y-auto md:overflow-hidden border-r border-slate-800/80 ${
                        mobileTab === 'catalog' ? 'block' : 'hidden md:flex'
                    }`}>
                        
                        {/* TOP SEARCH & ACTION TOOLBAR */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                <input
                                    id="pos-search-input"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Scan Barcode / Cari Produk [F2]..."
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none shadow-inner"
                                />
                            </div>

                            {/* NETWORK STATUS / OFFLINE AUTO-SYNC BADGE */}
                            {!isOnline ? (
                                <div
                                    className="px-3 py-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 animate-pulse"
                                    title="Koneksi Terputus: Kasir berjalan di Mode Offline & menyimpan transaksi di memori lokal peramban"
                                >
                                    <span>⚠️</span>
                                    <span>OFFLINE MODE</span>
                                    {pendingOfflineCount > 0 && (
                                        <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black rounded-full text-[10px]">
                                            {pendingOfflineCount}
                                        </span>
                                    )}
                                </div>
                            ) : pendingOfflineCount > 0 ? (
                                <button
                                    onClick={syncOfflineQueue}
                                    className="px-3 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-lg shadow-blue-600/30"
                                    title="Klik untuk mengirim ulang transaksi offline ke server"
                                >
                                    <span>🔄</span>
                                    <span>Sync {pendingOfflineCount} Offline</span>
                                </button>
                            ) : null}

                            {/* SALES HISTORY BUTTON */}
                            <button
                                onClick={() => setShowHistoryModal(true)}
                                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer relative shrink-0"
                                title="Lihat Riwayat Hasil Penjualan Kasir [F3]"
                            >
                                <History className="w-4 h-4 text-blue-400" />
                                <span className="hidden sm:inline">History (F3)</span>
                            </button>

                            {/* HELD CARTS BUTTON */}
                            <button
                                onClick={() => setShowHeldModal(true)}
                                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer relative shrink-0"
                            >
                                <Clock className="w-4 h-4 text-amber-400" />
                                <span className="hidden sm:inline">Tahan Cart ({safeHeldCarts.length})</span>
                                <span className="sm:hidden">({safeHeldCarts.length})</span>
                            </button>

                            {/* DUAL DISPLAY CUSTOMER MONITOR BUTTON & PAIRING CODE BADGE */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    onClick={openCustomerDisplay}
                                    className="px-4 py-3 bg-emerald-600/10 hover:bg-emerald-600/20 active:scale-95 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
                                    title="Buka Layar Monitor Pelanggan 2 (Dual Screen Display)"
                                >
                                    <Monitor className="w-4 h-4 text-emerald-400" />
                                    <span className="hidden md:inline">Layar Pelanggan</span>
                                </button>
                                {activeOutlet?.id && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const codeToken = `DISP-${activeOutlet.id}`;
                                            const url = `https://superbackend.my.id/pos/customer-display?code=${codeToken}`;
                                            if (navigator.clipboard && window.isSecureContext) {
                                                navigator.clipboard.writeText(url);
                                            } else {
                                                const textArea = document.createElement("textarea");
                                                textArea.value = url;
                                                document.body.appendChild(textArea);
                                                textArea.select();
                                                document.execCommand('copy');
                                                document.body.removeChild(textArea);
                                            }
                                            alert(`📋 LINK LAYAR PEMBELI BERHASIL DISALIN!\n\nKode Pairing: ${codeToken}\nTautan: ${url}\n\nSilakan buka / tempel (paste) link ini di peramban HP, Tablet, atau Smart TV kedua Anda.`);
                                        }}
                                        className="px-3.5 py-3 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-400 border border-amber-500/30 rounded-2xl text-xs font-mono font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                                        title="Klik untuk menyalin Link Layar Pembeli (Pairing Code)"
                                    >
                                        <span>🔑</span>
                                        <span>DISP-{activeOutlet.id}</span>
                                        <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 font-sans font-semibold">Salin Link</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* CATEGORIES HORIZONTAL SCROLL BAR */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-medium">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition cursor-pointer font-bold active:scale-95 ${
                                    selectedCategory === 'all'
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                                }`}
                            >
                                Semua Produk
                            </button>
                            {(categories || []).map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition cursor-pointer active:scale-95 ${
                                        selectedCategory === cat.id
                                            ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/30'
                                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* PRODUCTS TOUCH GRID */}
                        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pr-1 pb-16 md:pb-0">
                            {filteredProducts.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center text-slate-600 py-16 space-y-2">
                                    <ShoppingCart className="w-10 h-10 opacity-30" />
                                    <p className="text-xs font-medium">Tidak ada produk ditemukan</p>
                                </div>
                            ) : (
                                filteredProducts.map((p) => {
                                    const stockQty = p.stock !== undefined ? p.stock : (p.stocks && p.stocks.length > 0 ? p.stocks[0].quantity : 0);
                                    const isOutOfStock = stockQty <= 0;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => addToCart(p)}
                                            disabled={isOutOfStock}
                                            className={`border p-3.5 rounded-2xl flex flex-col justify-between text-left transition active:scale-95 group relative ${
                                                isOutOfStock
                                                    ? 'bg-slate-900/50 border-slate-800/40 opacity-50 cursor-not-allowed grayscale'
                                                    : 'bg-slate-900 border-slate-800/80 hover:border-emerald-500/50 hover:shadow-xl cursor-pointer'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex justify-between items-start text-[10px] text-slate-500 font-mono mb-1">
                                                    <span>{p.sku}</span>
                                                    <span className={`font-bold px-1.5 py-0.5 rounded ${
                                                        isOutOfStock 
                                                            ? 'bg-rose-500/20 text-rose-400 font-black' 
                                                            : (stockQty <= 5 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400')
                                                    }`}>
                                                        {isOutOfStock ? 'KOSONG' : `Stok: ${stockQty}`}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-bold text-slate-200 line-clamp-2 group-hover:text-emerald-400 transition">
                                                    {p.name}
                                                </h4>
                                            </div>

                                            <div className="mt-3 pt-2 border-t border-slate-800/60 flex justify-between items-center w-full">
                                                <span className="text-xs font-extrabold text-emerald-400 font-mono">
                                                    Rp {Number(p.selling_price).toLocaleString('id-ID')}
                                                </span>
                                                <span className={`p-1.5 rounded-xl transition ${
                                                    isOutOfStock 
                                                        ? 'bg-slate-800 text-slate-600' 
                                                        : 'bg-slate-800 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white'
                                                }`}>
                                                    <Plus className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                    </div>

                    {/* RIGHT: SHOPPING CART & CHECKOUT SIDEBAR (COL 4) */}
                    <div className={`w-full md:w-96 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex-col h-full shadow-2xl ${
                        mobileTab === 'cart' ? 'flex' : 'hidden md:flex'
                    }`}>
                        
                        {/* CART HEADER & CUSTOMER SELECTOR */}
                        <div className="p-4 border-b border-slate-800 space-y-3">
                            {/* SUPER GIANT ENTERPRISE LED TOTAL TAGIHAN BANNER */}
                            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 rounded-3xl border-2 border-emerald-500/50 flex flex-col justify-between shadow-2xl overflow-hidden relative group">
                                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-2">
                                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                                        TOTAL TAGIHAN KASIR
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                                        {totalCartItemCount} Item
                                    </span>
                                </div>
                                <div className="text-right w-full overflow-hidden">
                                    <span className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-400 font-mono tracking-tighter block truncate drop-shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                                        Rp {grandTotal.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-xs text-white flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-emerald-400" />
                                    <span>Keranjang Penjualan ({cart.length})</span>
                                </h3>
                                {cart.length > 0 && (
                                    <button
                                        onClick={() => setCart([])}
                                        className="text-[10px] text-rose-400 hover:underline font-semibold"
                                    >
                                        Kosongkan
                                    </button>
                                )}
                            </div>

                            {/* SELECT CUSTOMER */}
                            <div className="relative">
                                <UserIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                                <select
                                    value={selectedCustomer?.id || ''}
                                    onChange={(e) => {
                                        const cid = Number(e.target.value);
                                        setSelectedCustomer(customers.find((c) => c.id === cid) || null);
                                    }}
                                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-medium focus:outline-none"
                                >
                                    <option value="">Pelanggan Umum (Guest)</option>
                                    {(customers || []).map((c) => (
                                        <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* CART ITEMS LIST */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/50">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-12 space-y-2">
                                    <ShoppingCart className="w-12 h-12 opacity-20" />
                                    <p className="text-xs font-semibold">Keranjang masih kosong</p>
                                    <p className="text-[10px] text-slate-600 max-w-[180px]">Pilih barang di katalog atau scan barcode untuk menambah transaksi</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.product.id} className="pt-2.5 first:pt-0 space-y-1.5">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <h5 className="text-xs font-bold text-white line-clamp-1">{item.product.name}</h5>
                                                <span className="text-[10px] text-slate-500 font-mono">@ Rp {item.price.toLocaleString('id-ID')}</span>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-400 font-mono">
                                                Rp {item.subtotal.toLocaleString('id-ID')}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    className="p-1.5 hover:bg-slate-800 active:scale-90 text-slate-400 rounded-lg transition"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-8 text-center font-mono font-bold text-xs text-white">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    className="p-1.5 hover:bg-slate-800 active:scale-90 text-slate-400 rounded-lg transition"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => removeFromCart(item.product.id)}
                                                className="text-slate-500 hover:text-rose-400 p-1.5 transition active:scale-90"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* CART SUMMARY & FINANCIAL CALCULATOR */}
                        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3 pb-28 md:pb-4">
                            <div className="space-y-1.5 text-xs font-mono">
                                <div className="flex justify-between text-slate-400">
                                    <span>Subtotal</span>
                                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                                </div>

                                <div className="flex justify-between items-center text-slate-400">
                                    <span>Diskon Transaksi (Rp)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={transactionDiscount}
                                        onChange={(e) => setTransactionDiscount(Number(e.target.value))}
                                        className="w-24 p-1 bg-slate-900 border border-slate-800 rounded text-right text-amber-400 font-bold text-xs"
                                    />
                                </div>

                                {/* DYNAMIC PPN TAX SELECTOR */}
                                <div className="flex justify-between items-center text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <Percent className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Tarif PPN Pajak</span>
                                    </div>
                                    <select
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(Number(e.target.value))}
                                        className="p-1 bg-slate-900 border border-slate-800 rounded text-right text-blue-400 font-bold text-xs"
                                    >
                                        <option value={0}>0% (Non-PPN)</option>
                                        <option value={0.11}>11% (PPN Standard)</option>
                                        <option value={0.12}>12% (PPN 2025+)</option>
                                    </select>
                                </div>

                                <div className="flex justify-between text-slate-400">
                                    <span>PPN ({Math.round(taxRate * 100)}%)</span>
                                    <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm font-black text-emerald-400 pt-2 border-t border-slate-800 gap-2 overflow-hidden">
                                    <span className="shrink-0 uppercase tracking-wider text-[11px] sm:text-xs">GRAND TOTAL</span>
                                    <span className="truncate font-mono text-xs sm:text-sm font-black text-right">Rp {grandTotal.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    onClick={handleHoldCart}
                                    disabled={cart.length === 0 || holdingCart || !isShiftOpen}
                                    className="py-3 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-40"
                                >
                                    <PauseCircle className="w-4 h-4" /> Hold (F9)
                                </button>

                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    disabled={cart.length === 0 || !isShiftOpen}
                                    className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-40"
                                >
                                    <CreditCard className="w-4 h-4" /> Bayar (F8)
                                </button>
                            </div>
                        </div>

                    </div>

                </div>

            </div>

            {/* STICKY FLOATING MOBILE CART SUMMARY BAR (SHOWN WHEN PRODUCTS ARE IN CART ON MOBILE) */}
            {cart.length > 0 && mobileTab === 'catalog' && (
                <div className="md:hidden fixed bottom-20 left-3 right-3 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl shadow-2xl flex justify-between items-center border border-emerald-400/40 active:scale-98 transition">
                    <button
                        onClick={() => setMobileTab('cart')}
                        className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                    >
                        <div className="p-2 bg-slate-950/30 rounded-xl">
                            <ShoppingCart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-xs font-extrabold block">
                                {totalCartItemCount} Barang • Keranjang
                            </span>
                            <span className="text-[11px] text-emerald-100 font-mono font-bold block">
                                Rp {grandTotal.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            if (isShiftOpen) setShowPaymentModal(true);
                            else alert('Shift kasir belum dibuka!');
                        }}
                        disabled={!isShiftOpen}
                        className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span>BAYAR</span>
                    </button>
                </div>
            )}

            {/* PAYMENT CHECKOUT MODAL */}
            {showPaymentModal && (
                <PaymentModal
                    grandTotal={grandTotal}
                    subtotal={subtotal}
                    taxAmount={taxAmount}
                    discountAmount={transactionDiscount}
                    customerId={selectedCustomer?.id || null}
                    discounts={discounts}
                    customers={customers}
                    items={cart.map((i) => ({
                        product_id: i.product.id,
                        quantity: i.quantity,
                        unit_price: i.price,
                        discount_amount: i.discount_amount,
                    }))}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={(saleData) => {
                        setShowPaymentModal(false);
                        setCart([]);
                        setSelectedCustomer(null);
                        setTransactionDiscount(0);
                        setCompletedSale(saleData);
                    }}
                />
            )}

            {/* SUCCESS TRANSACTION MODAL WITH RECEIPT PRINT BUTTON */}
            {completedSale && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                            <CheckCircle className="w-8 h-8" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-lg font-extrabold text-white">Pembayaran Berhasil!</h3>
                            <p className="text-xs text-slate-400 font-mono">
                                No. Faktur: <span className="text-emerald-400 font-bold">#{completedSale.invoice_number}</span>
                            </p>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs font-mono">
                            <div className="flex justify-between text-slate-400">
                                <span>Total Belanja:</span>
                                <span className="text-white font-bold">Rp {Number(completedSale.grand_total || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Total Diterima:</span>
                                <span className="text-white font-bold">Rp {Number(completedSale.paid_amount || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-800 pt-2 text-emerald-400 font-extrabold text-sm">
                                <span>Kembalian:</span>
                                <span>Rp {Number(completedSale.change_amount || 0).toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Link
                                href={`/pos/receipt/${completedSale.id}`}
                                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Cetak Struk Thermal</span>
                            </Link>

                            <button
                                onClick={() => setCompletedSale(null)}
                                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition active:scale-95 cursor-pointer"
                            >
                                Transaksi Baru
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HELD CARTS MODAL */}
            {showHeldModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-400" /> Daftar Transaksi Tahan (Held Carts)
                            </h3>
                            <button onClick={() => setShowHeldModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {safeHeldCarts.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">Belum ada transaksi ditahan.</p>
                            ) : (
                                safeHeldCarts.map((h) => (
                                    <div key={h.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                                        <div>
                                            <h5 className="font-bold text-white">{h.reference_note}</h5>
                                            <p className="text-[10px] text-slate-500 font-mono">
                                                {h.customer?.name ? `Pelanggan: ${h.customer.name} • ` : ''}
                                                {h.items?.length || 0} Barang
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleResumeHeldCart(h)}
                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer transition"
                                        >
                                            Lanjutkan
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SALES HISTORY MODAL (RIWAYAT HASIL PENJUALAN KASIR) */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
                    <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl text-xs max-h-[85vh] flex flex-col">
                        
                        {/* MODAL HEADER */}
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                                    <History className="w-5 h-5 text-blue-400" /> Riwayat Transaksi Hasil Penjualan Kasir
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Daftar transaksi selesai pada shift kasir aktif. Anda dapat mencari dan mencetak ulang struk nota.</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* SEARCH INPUT */}
                        <div className="relative shrink-0">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                            <input
                                type="text"
                                value={historySearchQuery}
                                onChange={(e) => setHistorySearchQuery(e.target.value)}
                                placeholder="Cari berdasarkan No. Faktur (INV...), Pelanggan, atau Nama Barang..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* SALES HISTORY TABLE */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {recentSales.filter((s) => {
                                if (!historySearchQuery) return true;
                                const q = historySearchQuery.toLowerCase();
                                const matchesInvoice = s.invoice_number?.toLowerCase().includes(q);
                                const matchesCustomer = s.customer?.name?.toLowerCase().includes(q);
                                const matchesItem = s.items?.some((i: any) => i.product_name_snapshot?.toLowerCase().includes(q));
                                return matchesInvoice || matchesCustomer || matchesItem;
                            }).length === 0 ? (
                                <div className="p-8 text-center text-slate-500 space-y-2">
                                    <History className="w-8 h-8 opacity-30 mx-auto" />
                                    <p className="font-semibold">Tidak ada transaksi ditemukan.</p>
                                </div>
                            ) : (
                                recentSales.filter((s) => {
                                    if (!historySearchQuery) return true;
                                    const q = historySearchQuery.toLowerCase();
                                    const matchesInvoice = s.invoice_number?.toLowerCase().includes(q);
                                    const matchesCustomer = s.customer?.name?.toLowerCase().includes(q);
                                    const matchesItem = s.items?.some((i: any) => i.product_name_snapshot?.toLowerCase().includes(q));
                                    return matchesInvoice || matchesCustomer || matchesItem;
                                }).map((sale) => (
                                    <div key={sale.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-slate-700 transition">
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-white text-xs">#{sale.invoice_number}</span>
                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold uppercase">LUNAS</span>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {new Date(sale.sale_date || sale.created_at).toLocaleTimeString('id-ID')}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-400 truncate">
                                                {sale.customer?.name ? `Pelanggan: ${sale.customer.name} • ` : 'Pelanggan Umum • '}
                                                {(sale.items || []).map((i: any) => `${i.product_name_snapshot} (${i.quantity}x)`).join(', ')}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-500 block uppercase font-mono">
                                                    {(sale.payments || []).map((p: any) => p.payment_method?.toUpperCase()).join('/') || 'CASH'}
                                                </span>
                                                <span className="text-sm font-black text-emerald-400 font-mono">
                                                    Rp {Number(sale.grand_total).toLocaleString('id-ID')}
                                                </span>
                                            </div>

                                            <Link
                                                href={`/pos/receipt/${sale.id}`}
                                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 shrink-0"
                                            >
                                                <Printer className="w-3.5 h-3.5 text-blue-400" />
                                                <span>Cetak Struk</span>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

        </AppLayout>
    );
}
