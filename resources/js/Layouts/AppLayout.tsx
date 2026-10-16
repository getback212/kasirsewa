import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { 
    ShoppingBag, 
    ShoppingCart, 
    Store, 
    LogOut, 
    Menu, 
    X, 
    ChevronDown, 
    LayoutDashboard,
    Boxes,
    Clock,
    BarChart3,
    Warehouse,
    Users as UsersIcon,
    Database,
    Truck,
    Check,
    Repeat,
    ClipboardCheck,
    ShieldAlert,
    PackageCheck,
    Receipt,
    Building2,
    Sparkles,
    CreditCard,
    Globe,
    Maximize,
    Minimize,
    Sun,
    Moon,
    UserCircle
} from 'lucide-react';

interface NavItem {
    name: string;
    path: string;
    icon: any;
    permission: string | null;
    highlight?: boolean;
}

interface NavGroup {
    id: string;
    group: string;
    icon: any;
    items: NavItem[];
}

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
    const { auth, currentOutlet, availableOutlets, tenantSubscription } = usePage<any>().props;

    const user = auth?.user;
    const roles: string[] = Array.isArray(auth?.roles)
        ? auth.roles
        : (Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []));

    const permissions: string[] = Array.isArray(auth?.permissions)
        ? auth.permissions
        : (Array.isArray(user?.permissions) ? user.permissions : []);

    const userRole = roles.length > 0 ? roles[0] : (user?.role || 'Staff');

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTopCategory, setActiveTopCategory] = useState<string | null>(null);
    const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [trialDismissed, setTrialDismissed] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
        }
        return 'dark';
    });

    const topNavRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.remove('dark');
            root.classList.add('light');
        } else {
            root.classList.remove('light');
            root.classList.add('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (topNavRef.current && !topNavRef.current.contains(event.target as Node)) {
                setActiveTopCategory(null);
                setOutletDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
            }
        }
    };

    const hasPermission = (permission: string | null) => {
        if (!permission) return true;

        if (permission === 'manage-tenants' || permission === 'manage-plans') {
            return roles.includes('SUPER_ADMIN');
        }

        // Single-store tenants (max_stores <= 1) do not need multi-branch transfer feature
        if (permission === 'transfer-stock' && tenantSubscription && tenantSubscription.max_stores <= 1 && !roles.includes('SUPER_ADMIN')) {
            return false;
        }

        if (roles.includes('CASHIER')) {
            if (permission === 'view-dashboard') return false;
            return ['open-shift', 'access-pos'].includes(permission);
        }

        if (roles.includes('WAREHOUSE')) {
            if (permission === 'view-dashboard') return false;
            return ['view-products', 'view-stock', 'view-purchases', 'view-suppliers'].includes(permission);
        }

        if (roles.includes('SUPER_ADMIN')) return true;

        if (roles.includes('OWNER')) {
            return permission !== 'manage-tenants' && permission !== 'manage-plans';
        }

        return permissions.includes(permission);
    };

    const canSwitchOutlet = (roles.includes('SUPER_ADMIN') && Boolean(tenantSubscription)) || roles.includes('OWNER');

    const handleLogout = () => {
        router.post('/logout');
    };

    const handleSwitchOutlet = (outletId: number) => {
        router.post(`/outlets/${outletId}/switch`, {}, {
            onSuccess: () => {
                setOutletDropdownOpen(false);
                setMobileMenuOpen(false);
            }
        });
    };

    const isCurrentRoute = (path: string) => {
        if (path === '/dashboard') return window.location.pathname === '/dashboard';
        return window.location.pathname.startsWith(path);
    };

    const navigationGroups: NavGroup[] = [
        {
            id: 'saas_admin',
            group: 'SaaS Admin Management',
            icon: Sparkles,
            items: [
                { name: 'Dashboard SaaS Global', path: '/admin/dashboard', icon: BarChart3, permission: 'manage-tenants' },
                { name: 'Kelola Tenant SaaS', path: '/admin/tenants', icon: Building2, permission: 'manage-tenants' },
                { name: 'Pengaturan Paket SaaS', path: '/admin/plans', icon: Sparkles, permission: 'manage-plans' },
                { name: 'Rekening Pembayaran SaaS', path: '/admin/payment-settings', icon: CreditCard, permission: 'manage-plans' },
                { name: 'Verifikasi Bukti Pembayaran', path: '/admin/payment-proofs', icon: Check, permission: 'manage-plans' },
                { name: 'Notifikasi WA & Email SaaS', path: '/admin/notification-settings', icon: Sparkles, permission: 'manage-plans' },
                { name: 'Riwayat Tagihan Invoice', path: '/invoices', icon: CreditCard, permission: 'view-reports-financial' },
            ]
        },
        {
            id: 'stok',
            group: 'Stok & Inventaris',
            icon: Boxes,
            items: [
                { name: 'Katalog Produk', path: '/products', icon: Boxes, permission: 'view-products' },
                { name: 'Satuan Unit Barang', path: '/units', icon: Boxes, permission: 'view-products' },
                { name: 'Stok Gudang', path: '/inventory', icon: Warehouse, permission: 'view-stock' },
                { name: 'Stock Opname Audit', path: '/stock-opname', icon: ClipboardCheck, permission: 'view-stock' },
                { name: 'Transfer Stok Cabang', path: '/stock-transfers', icon: Repeat, permission: 'transfer-stock' },
                { name: 'Restok Supplier', path: '/purchases', icon: Truck, permission: 'view-purchases' },
            ]
        },
        {
            id: 'operasional',
            group: 'Operasional Toko',
            icon: Clock,
            items: [
                { name: 'Shift & Kas Laci', path: '/shifts', icon: Clock, permission: 'open-shift' },
                { name: 'Voucher Promo & Diskon', path: '/discounts', icon: Sparkles, permission: 'view-products' },
                { name: 'Pelanggan Member', path: '/customers', icon: UsersIcon, permission: 'view-customers' },
                { name: 'Biaya Operasional', path: '/expenses', icon: Receipt, permission: 'view-expenses' },
                { name: 'Retur Penjualan', path: '/sales-returns', icon: PackageCheck, permission: 'process-return' },
                { name: 'Manajemen Staff', path: '/users', icon: UsersIcon, permission: 'view-users' },
                { name: 'Pengaturan Outlet', path: '/outlets', icon: Store, permission: 'view-outlets' },
            ]
        },
        {
            id: 'laporan',
            group: 'Laporan & Audit',
            icon: BarChart3,
            items: [
                { name: 'Laporan Keuangan', path: '/reports', icon: BarChart3, permission: 'view-reports-financial' },
                { name: 'Audit Logs System', path: '/audit-logs', icon: ShieldAlert, permission: 'view-audit-logs' },
                { name: 'Backup & Restore', path: '/backups', icon: Database, permission: 'view-audit-logs' },
            ]
        }
    ];

    const toggleTopCategory = (catId: string) => {
        setActiveTopCategory(activeTopCategory === catId ? null : catId);
    };

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
            
            {/* IMPERSONATION NOTICE BANNER FOR SUPER ADMIN */}
            {auth?.impersonator_id && (
                <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between shadow-xl border-b border-amber-400">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-950 text-amber-400 rounded text-[10px] uppercase font-mono font-bold">IMPERSONATION MODE</span>
                        <span>⚠️ Anda sedang dalam mode impersonate sebagai Owner tenant. Klik stop untuk kembali ke Super Admin.</span>
                    </div>
                    <button 
                        onClick={() => router.post('/admin/tenants/stop-impersonate')}
                        className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 rounded-lg text-[10px] font-extrabold uppercase border border-amber-400/40 cursor-pointer transition"
                    >
                        ✕ Stop Impersonate (Kembali ke SaaS Admin)
                    </button>
                </div>
            )}

            {/* WHATSAPP VERIFICATION NOTICE BANNER (EXCLUSIVE FOR OWNER ROLE) */}
            {user && user.google_id && !user.phone_verified_at && roles.includes('OWNER') && (
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-4 py-2.5 text-xs font-bold flex flex-col sm:flex-row items-center justify-between shadow-xl border-b border-blue-400 gap-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-white text-blue-900 rounded text-[10px] uppercase font-mono font-black">📲 VERIFIKASI WA</span>
                        <span>⚠️ Akun Google Anda belum terverifikasi nomor WhatsApp. Silakan lengkapi dan verifikasi nomor WhatsApp untuk notifikasi transaksi toko.</span>
                    </div>
                    <Link 
                        href="/verify-otp"
                        className="px-3 py-1 bg-white text-blue-950 hover:bg-slate-100 rounded-lg text-[10px] font-black uppercase shadow cursor-pointer transition shrink-0"
                    >
                        Verifikasi WhatsApp Sekarang →
                    </Link>
                </div>
            )}

            {/* TRIAL EXPIRING SOON BANNER (OWNER/ADMIN ROLES) */}
            {tenantSubscription && tenantSubscription.is_trial && tenantSubscription.trial_warning && !trialDismissed && (
                <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white px-4 py-2.5 text-xs font-bold flex flex-col sm:flex-row items-center justify-between shadow-xl border-b border-amber-400 gap-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-white text-amber-900 rounded text-[10px] uppercase font-mono font-black">🎁 TRIAL AKAN HABIS</span>
                        <span>⚠️ Masa uji coba gratis 7 hari Anda tersisa <strong>{tenantSubscription.remaining_trial_hours} jam</strong> (<strong>{tenantSubscription.remaining_trial_days} hari</strong>). Segera berlangganan untuk menjaga operasional toko lancar.</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setTrialDismissed(true)}
                            className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-medium shadow cursor-pointer transition"
                        >
                            Tutup
                        </button>
                        <Link
                            href="/subscription"
                            className="px-3 py-1 bg-white text-amber-950 hover:bg-slate-100 rounded-lg text-[10px] font-black uppercase shadow cursor-pointer transition shrink-0"
                        >
                            Bayar Berlangganan Sekarang →
                        </Link>
                    </div>
                </div>
            )}

            {/* TRIAL EXPIRED BANNER */}
            {tenantSubscription && tenantSubscription.is_trial && tenantSubscription.trial_expired && !trialDismissed && (
                <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 text-white px-4 py-2.5 text-xs font-bold flex flex-col sm:flex-row items-center justify-between shadow-xl border-b border-rose-400 gap-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-white text-rose-900 rounded text-[10px] uppercase font-mono font-black">❌ TRIAL HABIS</span>
                        <span>⚠️ Masa uji coba gratis 7 hari Anda telah berakhir. Silakan berlangganan paket untuk mengaktifkan kembali akses kasir.</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setTrialDismissed(true)}
                            className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-medium shadow cursor-pointer transition"
                        >
                            Tutup
                        </button>
                        <Link
                            href="/subscription"
                            className="px-3 py-1 bg-white text-rose-950 hover:bg-slate-100 rounded-lg text-[10px] font-black uppercase shadow cursor-pointer transition shrink-0"
                        >
                            Aktifkan Berlangganan →
                        </Link>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 🖥️ TOP NAVIGATION HEADER BAR (DI ATAS - COMPACT & MEWAH 100% FLUID) */}
            {/* ========================================================================= */}
            <header ref={topNavRef} className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        
                        {/* LEFT BRAND LOGO */}
                        <div className="flex items-center gap-4">
                            <Link href={roles.includes('SUPER_ADMIN') ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2.5 group shrink-0">
                                <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-600/20 group-hover:scale-105 transition transform">
                                    <Building2 className="w-4 h-4 text-white" />
                                </div>
                                <div className="hidden sm:flex items-center gap-1.5">
                                    <span className="font-extrabold text-base tracking-tight text-white">KasirSewa</span>
                                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[9px] font-mono font-bold">POS</span>
                                </div>
                            </Link>

                            {/* DESKTOP TOP KATEGORI DROPDOWNS (DI ATAS - COMPACT PILLS) */}
                            <nav className="hidden lg:flex items-center gap-1">
                                
                                {/* DIRECT DASHBOARD BUTTON */}
                                {hasPermission('view-dashboard') && (
                                    <Link
                                        href={roles.includes('SUPER_ADMIN') && !tenantSubscription ? '/admin/dashboard' : '/dashboard'}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                            (isCurrentRoute('/dashboard') || isCurrentRoute('/admin/dashboard'))
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <LayoutDashboard className="w-3.5 h-3.5" />
                                        <span>{roles.includes('SUPER_ADMIN') && !tenantSubscription ? 'Dashboard SaaS' : 'Dashboard Toko'}</span>
                                    </Link>
                                )}

                                {/* DIRECT POS KASIR BUTTON */}
                                {hasPermission('access-pos') && (!roles.includes('SUPER_ADMIN') || tenantSubscription) && (
                                    <Link
                                        href="/pos"
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                            isCurrentRoute('/pos')
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                                : 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/30'
                                        }`}
                                    >
                                        <ShoppingCart className="w-3.5 h-3.5" />
                                        <span>POS Kasir</span>
                                    </Link>
                                )}

                                {/* CATEGORY DROPDOWN BUTTONS ON TOPBAR */}
                                {navigationGroups.map((group) => {
                                    if (group.id === 'saas_admin') {
                                        return null;
                                    }

                                    // Hide store operational menus from Super Admin when NOT impersonating a tenant
                                    if (roles.includes('SUPER_ADMIN') && !tenantSubscription && (group.id === 'stok' || group.id === 'operasional')) {
                                        return null;
                                    }

                                    let filteredItems = group.items.filter(item => hasPermission(item.permission));

                                    // Global Super Admin (not impersonating) only gets the Audit Logs & Backup tools
                                    // from the "Laporan & Audit" group (Laporan Keuangan needs an active outlet).
                                    if (roles.includes('SUPER_ADMIN') && !tenantSubscription && group.id === 'laporan') {
                                        filteredItems = filteredItems.filter(item => item.path === '/audit-logs' || item.path === '/backups');
                                    }

                                    if (filteredItems.length === 0) return null;

                                    const isCategoryActive = group.items.some(item => isCurrentRoute(item.path));
                                    const isOpen = activeTopCategory === group.id;
                                    const GroupIcon = group.icon;

                                    return (
                                        <div key={group.id} className="relative">
                                            <button
                                                type="button"
                                                onClick={() => toggleTopCategory(group.id)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                                    isCategoryActive
                                                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                                }`}
                                            >
                                                <GroupIcon className={`w-3.5 h-3.5 ${isCategoryActive ? 'text-blue-400' : 'text-slate-400'}`} />
                                                <span>{group.group}</span>
                                                <ChevronDown className={`w-3 h-3 text-slate-500 transition transform ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
                                            </button>

                                            {/* DROPDOWN MENU BOARD */}
                                            {isOpen && (
                                                <div className="absolute left-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                                    <div className="px-3 py-1 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-800/80">
                                                        Menu {group.group}
                                                    </div>
                                                    <div className="py-1">
                                                        {filteredItems.map((item) => {
                                                            const Icon = item.icon;
                                                            const active = isCurrentRoute(item.path);

                                                            return (
                                                                <Link
                                                                    key={item.path}
                                                                    href={item.path}
                                                                    onClick={() => setActiveTopCategory(null)}
                                                                    className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition ${
                                                                        active
                                                                            ? 'bg-slate-800 text-blue-400 font-bold'
                                                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-blue-400' : ''}`} />
                                                                    <span>{item.name}</span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                            </nav>
                        </div>

                        {/* RIGHT: OUTLET SWITCHER & USER PROFILE */}
                        <div className="flex items-center gap-3">

                            {/* TRIAL REMAINING COUNT BADGE FOR OWNER (SLEEK MINIMALIST) */}
                            {tenantSubscription?.is_trial && roles.includes('OWNER') && (
                                <Link
                                    href="/subscription"
                                    className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-full text-xs font-bold transition shrink-0 group cursor-pointer"
                                    title="Masa trial 7 hari aktif. Klik untuk berlangganan sekarang."
                                >
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    <span>Trial {tenantSubscription.remaining_trial_days > 0 ? `${tenantSubscription.remaining_trial_days} Hari` : `${tenantSubscription.remaining_trial_hours} Jam`}</span>
                                    <span className="text-[10px] font-extrabold text-amber-400 group-hover:text-amber-200 underline underline-offset-2 ml-0.5">
                                        Bayar →
                                    </span>
                                </Link>
                            )}

                            
                            {/* OUTLET BADGE / DROPDOWN */}
                            {currentOutlet && (!roles.includes('SUPER_ADMIN') || tenantSubscription) && (
                                <div className="relative">
                                    {canSwitchOutlet ? (
                                        <button 
                                            type="button"
                                            onClick={() => setOutletDropdownOpen(!outletDropdownOpen)}
                                            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-inner"
                                        >
                                            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                                            <span className="font-bold store-name-text max-w-[100px] xs:max-w-[130px] sm:max-w-[200px] md:max-w-[280px] truncate">{currentOutlet.name}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs">
                                            <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span className="font-bold store-name-text max-w-[100px] xs:max-w-[130px] sm:max-w-[200px] md:max-w-[280px] truncate">{currentOutlet.name}</span>
                                        </div>
                                    )}

                                    {outletDropdownOpen && canSwitchOutlet && (
                                        <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-800 flex items-center gap-1">
                                                <Building2 className="w-3 h-3 text-emerald-400" />
                                                <span>Pilih Outlet Cabang Toko</span>
                                            </div>
                                            <div className="py-1 max-h-60 overflow-y-auto">
                                                {availableOutlets.map((outlet: any) => (
                                                    <button
                                                        key={outlet.id}
                                                        onClick={() => handleSwitchOutlet(outlet.id)}
                                                        className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between hover:bg-slate-800 transition cursor-pointer ${
                                                            outlet.id === currentOutlet.id ? 'text-emerald-400 font-bold bg-slate-800/60' : 'text-slate-300'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="font-bold">{outlet.name}</div>
                                                            <div className="text-[10px] text-slate-500 font-mono">{outlet.code}</div>
                                                        </div>
                                                        {outlet.id === currentOutlet.id && <Check className="w-4 h-4 text-emerald-400" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* USER PROFILE DROPDOWN MENU */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-inner"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-[11px] uppercase shrink-0">
                                        {user?.name ? user.name.charAt(0) : 'U'}
                                    </div>
                                    <div className="hidden sm:flex flex-col text-left">
                                        <span className="text-xs font-bold text-white max-w-[110px] truncate leading-none">{user?.name}</span>
                                        <span className="text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-wider mt-0.5">{userRole}</span>
                                    </div>
                                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                                </button>

                                {userDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="px-3 py-2 border-b border-slate-800/80 space-y-0.5">
                                            <div className="font-bold text-xs text-white truncate">{user?.name}</div>
                                            <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                                            <div className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">{userRole}</div>
                                        </div>

                                        <div className="py-1 border-b border-slate-800/80">
                                            {roles.includes('SUPER_ADMIN') && (
                                                <Link
                                                    href="/admin/profile"
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/10 hover:text-blue-200 transition"
                                                >
                                                    <UserCircle className="w-3.5 h-3.5 text-blue-400" />
                                                    <span>Edit Profil Super Admin</span>
                                                </Link>
                                            )}

                                            {roles.includes('SUPER_ADMIN') && (
                                                <>
                                                    <div className="px-3 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                        SaaS Admin Management
                                                    </div>
                                                    <Link
                                                        href="/admin/dashboard"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                                    >
                                                        <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                                                        <span>Dashboard SaaS Global</span>
                                                    </Link>
                                                    <Link
                                                        href="/admin/tenants"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                                    >
                                                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>Kelola Tenant SaaS</span>
                                                    </Link>
                                                    <Link
                                                        href="/admin/plans"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                                        <span>Pengaturan Paket SaaS</span>
                                                    </Link>
                                                    <Link
                                                        href="/admin/payment-settings"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                                    >
                                                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                                                        <span>Rekening Pembayaran SaaS</span>
                                                    </Link>
                                                    <Link
                                                        href="/admin/notification-settings"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                                        <span>Notifikasi WA & Email</span>
                                                    </Link>
                                                    <Link
                                                        href="/invoices"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                                    >
                                                        <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>Riwayat Tagihan Invoice</span>
                                                    </Link>
                                                    <div className="px-3 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                        Keamanan Sistem
                                                    </div>
                                                    <Link
                                                        href="/audit-logs"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                                    >
                                                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                                        <span>Audit Logs System</span>
                                                    </Link>
                                                    <div className="my-1 border-t border-slate-800/80" />
                                                </>
                                            )}

                                            {roles.includes('OWNER') && (
                                                <>
                                                    <Link
                                                        href="/outlets"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                                    >
                                                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                                                        <span>Pengaturan Subdomain Toko</span>
                                                    </Link>
                                                    <Link
                                                        href="/subscription"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                                    >
                                                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                                                        <span>Masa Langganan & Billing</span>
                                                    </Link>
                                                    <Link
                                                        href="/invoices"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                                    >
                                                        <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>Riwayat Tagihan Invoice</span>
                                                    </Link>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => { toggleTheme(); setUserDropdownOpen(false); }}
                                                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                                                    <span>Tampilan Mode</span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-mono">{theme === 'dark' ? 'Gelap' : 'Terang'}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { toggleFullscreen(); setUserDropdownOpen(false); }}
                                                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-emerald-400" /> : <Maximize className="w-3.5 h-3.5 text-slate-400" />}
                                                    <span>Layar Penuh (Fullscreen)</span>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="pt-1">
                                            <button
                                                onClick={() => { setUserDropdownOpen(false); handleLogout(); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition cursor-pointer"
                                            >
                                                <LogOut className="w-4 h-4 shrink-0" />
                                                <span>🚪 Keluar Sistem (Logout)</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* MOBILE MENU TOGGLE — tenant/staff only.
                                Super admin mobile intentionally keeps only the profile menu. */}
                            {!roles.includes('SUPER_ADMIN') && (
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 active:scale-95 transition cursor-pointer"
                                    aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                                >
                                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </button>
                            )}

                        </div>

                    </div>
                </div>
            </header>

            {/* DESKTOP SIDEBAR FOR SUPER_ADMIN */}
            {roles.includes('SUPER_ADMIN') && !tenantSubscription && (
                <aside className="hidden lg:block w-64 bg-slate-900/50 border-r border-slate-800 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                    <div className="p-4 space-y-6">
                        {navigationGroups
                            .filter(group => group.id === 'saas_admin')
                            .map((group) => (
                                <div key={group.id} className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                                        {group.group}
                                    </div>
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const active = isCurrentRoute(item.path);
                                        return (
                                            <Link
                                                key={item.path}
                                                href={item.path}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition ${
                                                    active
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4 shrink-0" />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ))}
                    </div>
                </aside>
            )}

            {/* MOBILE DRAWER MENU */}
            {mobileMenuOpen && !roles.includes('SUPER_ADMIN') && (
                <div className="lg:hidden border-b border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-4 text-xs animate-in slide-in-from-top-2 duration-200">
                    {/* SUPER ADMIN: Direct Dashboard & POS buttons matching desktop top nav */}
                    {roles.includes('SUPER_ADMIN') && !tenantSubscription && (
                        <>
                            {/* Direct Dashboard SaaS Button */}
                            <Link
                                href="/admin/dashboard"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition ${
                                    isCurrentRoute('/admin/dashboard')
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4 shrink-0" />
                                <span>Dashboard SaaS</span>
                            </Link>
                            {/* Direct POS Kasir Button (only when impersonating) */}
                            {hasPermission('access-pos') && (
                                <Link
                                    href="/pos"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition ${
                                        isCurrentRoute('/pos')
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                            : 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/30'
                                    }`}
                                >
                                    <ShoppingCart className="w-4 h-4 shrink-0" />
                                    <span>POS Kasir</span>
                                </Link>
                            )}
                        </>
                    )}

                    {navigationGroups.map((group, idx) => {
                        if (roles.includes('SUPER_ADMIN') && !tenantSubscription && (group.id === 'stok' || group.id === 'operasional')) {
                            return null;
                        }

                        let filteredItems = group.items.filter(item => hasPermission(item.permission));

                        // Global Super Admin (not impersonating) only gets the Audit Logs & Backup tools
                        if (roles.includes('SUPER_ADMIN') && !tenantSubscription && group.id === 'laporan') {
                            filteredItems = filteredItems.filter(item => item.path === '/audit-logs' || item.path === '/backups');
                        }

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={idx} className="space-y-1">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-1">
                                    {group.group}
                                </div>
                                {filteredItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isCurrentRoute(item.path);

                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition ${
                                                active
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                                    : 'text-slate-300 hover:bg-slate-800'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4 shrink-0" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto lg:pb-8 ${roles.includes('SUPER_ADMIN') ? 'pb-8' : 'pb-24'}`}>
                {title && <div className="sr-only">{title}</div>}
                {children}
            </main>

            {/* MOBILE BOTTOM DOCK — hidden for SUPER_ADMIN; profile menu is the only mobile menu */}
            {!roles.includes('SUPER_ADMIN') && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800 px-3 py-1.5 flex justify-between items-center shadow-2xl">
                    {/* Tenant/staff mobile dock */}
                {roles.includes('SUPER_ADMIN') && !tenantSubscription ? (
                    <>
                        <Link
                            href="/admin/dashboard"
                            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                                isCurrentRoute('/admin/dashboard') ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span className="text-[10px]">SaaS</span>
                        </Link>

                        <Link
                            href="/admin/tenants"
                            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                                isCurrentRoute('/admin/tenants') ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Building2 className="w-5 h-5" />
                            <span className="text-[10px]">Tenant</span>
                        </Link>

                        <Link
                            href="/admin/plans"
                            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                                isCurrentRoute('/admin/plans') ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Sparkles className="w-5 h-5" />
                            <span className="text-[10px]">Paket</span>
                        </Link>

                        <Link
                            href="/invoices"
                            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                                isCurrentRoute('/invoices') ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Receipt className="w-5 h-5" />
                            <span className="text-[10px]">Invoice</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link
                            href={roles.includes('SUPER_ADMIN') ? '/admin/dashboard' : '/dashboard'}
                            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                                (isCurrentRoute('/dashboard') || isCurrentRoute('/admin/dashboard')) ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span className="text-[10px]">Home</span>
                        </Link>

                        {hasPermission('view-products') && (
                            <Link
                                href="/products"
                                className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                                    isCurrentRoute('/products') ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Boxes className="w-5 h-5" />
                                <span className="text-[10px]">Produk</span>
                            </Link>
                        )}

                        {hasPermission('access-pos') && (
                            <div className="flex-1 flex justify-center -mt-6">
                                <Link
                                    href="/pos"
                                    className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 text-white shadow-2xl transition transform active:scale-90 border-4 border-slate-950 ${
                                        isCurrentRoute('/pos')
                                            ? 'bg-emerald-500 shadow-emerald-500/50 ring-4 ring-emerald-500/20'
                                            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40'
                                    }`}
                                    title="POS Kasir Touch"
                                >
                                    <ShoppingCart className="w-6 h-6" />
                                    <span className="text-[9px] font-extrabold tracking-tighter leading-none">KASIR</span>
                                </Link>
                            </div>
                        )}

                        {hasPermission('view-purchases') ? (
                            <Link
                                href="/purchases"
                                className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                                    isCurrentRoute('/purchases') ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Truck className="w-5 h-5" />
                                <span className="text-[10px]">Restok</span>
                            </Link>
                        ) : hasPermission('open-shift') ? (
                            <Link
                                href="/shifts"
                                className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                                    isCurrentRoute('/shifts') ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Clock className="w-5 h-5" />
                                <span className="text-[10px]">Shift</span>
                            </Link>
                        ) : null}

                        {(hasPermission('view-reports-sales') || hasPermission('view-reports-financial')) && (
                            <Link
                                href="/reports"
                                className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                                    isCurrentRoute('/reports') ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <BarChart3 className="w-5 h-5" />
                                <span className="text-[10px]">Laporan</span>
                            </Link>
                        )}
                    </>
                    )}
                </div>
            )}

        </div>
    );
}
