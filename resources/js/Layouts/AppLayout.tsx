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
    Maximize,
    Minimize,
    Sun,
    Moon
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

export default function AppLayout({ title, children }: { title?: string; children: React.ReactNode }) {
    const pageProps = usePage<any>().props;
    const auth = pageProps.auth || {};
    const user = auth.user;
    
    // Fallback props resolution
    const currentOutlet = pageProps.currentOutlet || auth.currentOutlet;
    const availableOutlets = pageProps.availableOutlets || auth.availableOutlets || [];

    // Extract roles & permissions safely
    const roles: string[] = Array.isArray(auth.roles) 
        ? auth.roles 
        : (user?.role ? [user.role] : []);
        
    const permissions: string[] = Array.isArray(auth.permissions) 
        ? auth.permissions 
        : (Array.isArray(user?.permissions) ? user.permissions : []);

    const userRole = roles.length > 0 ? roles[0] : (user?.role || 'Staff');
    
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
    const [activeTopCategory, setActiveTopCategory] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
        }
        return 'dark';
    });
    const topNavRef = useRef<HTMLDivElement>(null);

    // Dark / Light Theme Class Sync
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

        try {
            const channel = new BroadcastChannel('pos_customer_display');
            channel.postMessage({ type: 'THEME_CHANGE', theme });
            channel.close();
        } catch (e) {
            // BroadcastChannel fallback
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    // Fullscreen Event Listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error enabling fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    // Close top dropdown when clicking outside
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

    const hasPermission = (permission: string | null) => {
        if (!permission) return true;

        // Super Admin SaaS Management features are restricted strictly to SUPER_ADMIN
        if (permission === 'manage-tenants' || permission === 'manage-plans') {
            return roles.includes('SUPER_ADMIN');
        }

        // CASHIER role menu permissions restriction
        if (roles.includes('CASHIER')) {
            if (permission === 'view-dashboard') return false;
            return ['open-shift', 'access-pos'].includes(permission);
        }

        // WAREHOUSE role menu permissions restriction
        if (roles.includes('WAREHOUSE')) {
            if (permission === 'view-dashboard') return false;
            return ['view-products', 'view-stock', 'view-purchases', 'view-suppliers'].includes(permission);
        }

        if (roles.includes('SUPER_ADMIN')) return true;

        if (roles.includes('OWNER')) {
            // Owner has full access to all tenant operational features except super admin tenant management
            return permission !== 'manage-tenants' && permission !== 'manage-plans';
        }

        return permissions.includes(permission);
    };

    const canSwitchOutlet = roles.includes('SUPER_ADMIN') || roles.includes('OWNER');

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
                { name: 'Riwayat Tagihan Invoice', path: '/invoices', icon: CreditCard, permission: 'view-reports-financial' },
            ]
        },
        {
            id: 'stok',
            group: 'Stok & Inventaris',
            icon: Boxes,
            items: [
                { name: 'Katalog Produk', path: '/products', icon: Boxes, permission: 'view-products' },
                { name: 'Stok Gudang', path: '/inventory', icon: Warehouse, permission: 'view-stock' },
                { name: 'Stock Opname Audit', path: '/stock-opname', icon: ClipboardCheck, permission: 'view-stock' },
                { name: 'Transfer Stok Cabang', path: '/stock-transfers', icon: Repeat, permission: 'view-stock' },
                { name: 'Restok Supplier', path: '/purchases', icon: Truck, permission: 'view-purchases' },
            ]
        },
        {
            id: 'operasional',
            group: 'Operasional Toko',
            icon: Clock,
            items: [
                { name: 'Shift & Kas Laci', path: '/shifts', icon: Clock, permission: 'open-shift' },
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
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
            
            {/* ========================================================================= */}
            {/* 🖥️ TOP NAVIGATION HEADER BAR (BERADA DI ATAS DENGAN KATEOGORI DROPDOWN) */}
            {/* ========================================================================= */}
            <header ref={topNavRef} className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        
                        {/* LEFT BRAND LOGO */}
                        <div className="flex items-center gap-6">
                            <Link href="/dashboard" className="flex items-center gap-3 group">
                                <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition transform">
                                    <ShoppingBag className="w-5 h-5 text-white" />
                                </div>
                                <div className="hidden sm:block">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-black text-base tracking-tight store-name-text leading-none">RetailPRO</span>
                                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[9px] font-mono font-bold">v2.0</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase font-semibold block mt-0.5">Enterprise POS</span>
                                </div>
                            </Link>

                            {/* DESKTOP TOP KATEGORI DROPDOWNS (DI ATAS) */}
                            <nav className="hidden lg:flex items-center gap-1.5">
                                
                                {/* DIRECT DASHBOARD BUTTON */}
                                {hasPermission('view-dashboard') && (
                                    <Link
                                        href="/dashboard"
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                            isCurrentRoute('/dashboard')
                                                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                                        <span>Dashboard</span>
                                    </Link>
                                )}

                                {/* DIRECT POS KASIR BUTTON */}
                                {hasPermission('access-pos') && (
                                    <Link
                                        href="/pos"
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                            isCurrentRoute('/pos')
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                                : 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/30'
                                        }`}
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        <span>POS Kasir</span>
                                    </Link>
                                )}

                                {/* CATEGORY DROPDOWN BUTTONS ON TOPBAR */}
                                {navigationGroups.map((group) => {
                                    const filteredItems = group.items.filter(item => hasPermission(item.permission));
                                    if (filteredItems.length === 0) return null;

                                    const isCategoryActive = group.items.some(item => isCurrentRoute(item.path));
                                    const isOpen = activeTopCategory === group.id;
                                    const GroupIcon = group.icon;

                                    return (
                                        <div key={group.id} className="relative">
                                            <button
                                                type="button"
                                                onClick={() => toggleTopCategory(group.id)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95 ${
                                                    isCategoryActive
                                                        ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                                }`}
                                            >
                                                <GroupIcon className={`w-4 h-4 ${isCategoryActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                                                <span>{group.group}</span>
                                                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                                            </button>

                                            {/* DROPDOWN MENU BOARD (TAMPIL TEPAT DI BAWAH KATEGORI) */}
                                            {isOpen && (
                                                <div className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                                    <div className="px-3.5 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-800/80">
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
                                                                    className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition ${
                                                                        item.highlight
                                                                            ? 'bg-emerald-600/10 text-emerald-400 font-bold hover:bg-emerald-600/20'
                                                                            : active
                                                                                ? 'bg-slate-800 text-emerald-400 font-bold'
                                                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : ''}`} />
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
                            
                            {/* OUTLET BADGE / DROPDOWN */}
                            {currentOutlet && (
                                <div className="relative">
                                    {canSwitchOutlet ? (
                                        <button 
                                            type="button"
                                            onClick={() => setOutletDropdownOpen(!outletDropdownOpen)}
                                            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-inner"
                                        >
                                            <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span className="font-black store-name-text max-w-[140px] sm:max-w-[220px] md:max-w-[280px] truncate">{currentOutlet.name}</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs">
                                            <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span className="font-black store-name-text max-w-[140px] sm:max-w-[220px] md:max-w-[280px] truncate">{currentOutlet.name}</span>
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

                            {/* THEME TOGGLE BUTTON (DARK / LIGHT MODE) */}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center border border-slate-800/80"
                                title={theme === 'dark' ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                                ) : (
                                    <Moon className="w-4 h-4 text-indigo-400" />
                                )}
                            </button>

                            {/* FULLSCREEN TOGGLE BUTTON (DESKTOP & TABLET ONLY) */}
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="hidden sm:flex p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition cursor-pointer active:scale-95 items-center justify-center border border-slate-800/80"
                                title={isFullscreen ? "Keluar Fullscreen" : "Layar Penuh (Full Screen)"}
                            >
                                {isFullscreen ? (
                                    <Minimize className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <Maximize className="w-4 h-4 text-slate-300 hover:text-emerald-400" />
                                )}
                            </button>

                            {/* USER PROFILE & LOGOUT */}
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex flex-col text-right">
                                    <span className="text-xs font-black store-name-text leading-tight">{user?.name}</span>
                                    <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider">{userRole}</span>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer active:scale-95"
                                    title="Logout Keluar Sistem"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>

                            {/* MOBILE MENU TOGGLE */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 active:scale-95 transition cursor-pointer"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>

                        </div>

                    </div>
                </div>
            </header>

            {/* MOBILE DRAWER MENU (BAGUS & UTUH) */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-b border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-4 text-xs animate-in slide-in-from-top-2 duration-200">
                    
                    {/* MOBILE OUTLET SWITCHER */}
                    {currentOutlet && canSwitchOutlet && (
                        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Pilih Outlet Cabang Aktif</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                                {availableOutlets.map((outlet: any) => (
                                    <button
                                        key={outlet.id}
                                        onClick={() => handleSwitchOutlet(outlet.id)}
                                        className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between font-bold transition active:scale-98 ${
                                            outlet.id === currentOutlet.id
                                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                                                : 'bg-slate-900 border-slate-800 text-slate-300'
                                        }`}
                                    >
                                        <span>{outlet.name}</span>
                                        {outlet.id === currentOutlet.id && <Check className="w-4 h-4 text-emerald-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GROUPED MOBILE MENU LIST */}
                    {navigationGroups.map((group, idx) => {
                        const filteredItems = group.items.filter(item => hasPermission(item.permission));
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
                                                item.highlight
                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                                    : active
                                                        ? 'bg-slate-800 text-emerald-400 border border-slate-700'
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

            {/* MAIN CONTENT BODY AREA */}
            <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
                {title && <div className="sr-only">{title}</div>}
                {children}
            </main>

            {/* MOBILE BOTTOM NAVIGATION DOCK (5 KEY BUTTONS - UTUH) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800 px-3 py-1.5 flex justify-between items-center shadow-2xl">
                
                {/* HOME / DASHBOARD */}
                <Link
                    href="/dashboard"
                    className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                        isCurrentRoute('/dashboard') ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-[10px]">Home</span>
                </Link>

                {/* PRODUK */}
                {hasPermission('view-products') && (
                    <Link
                        href="/products"
                        className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                            isCurrentRoute('/products') ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Boxes className="w-5 h-5" />
                        <span className="text-[10px]">Produk</span>
                    </Link>
                )}

                {/* CENTER FLOATING POS BUTTON */}
                {hasPermission('access-pos') && (
                    <div className="flex-1 flex justify-center -mt-6">
                        <Link
                            href="/pos"
                            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 text-white shadow-2xl transition transform active:scale-90 border-4 border-slate-950 ${
                                isCurrentRoute('/pos')
                                    ? 'bg-emerald-500 shadow-emerald-500/50 ring-4 ring-emerald-500/20'
                                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40'
                            }`}
                            title="Buka POS Kasir Touch"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            <span className="text-[9px] font-extrabold tracking-tighter leading-none">KASIR</span>
                        </Link>
                    </div>
                )}

                {/* RESTOK */}
                {hasPermission('view-purchases') ? (
                    <Link
                        href="/purchases"
                        className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                            isCurrentRoute('/purchases') ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Truck className="w-5 h-5" />
                        <span className="text-[10px]">Restok</span>
                    </Link>
                ) : hasPermission('open-shift') ? (
                    <Link
                        href="/shifts"
                        className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                            isCurrentRoute('/shifts') ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Clock className="w-5 h-5" />
                        <span className="text-[10px]">Shift</span>
                    </Link>
                ) : null}

                {/* LAPORAN */}
                {(hasPermission('view-reports-sales') || hasPermission('view-reports-financial')) && (
                    <Link
                        href="/reports"
                        className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
                            isCurrentRoute('/reports') ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-[10px]">Laporan</span>
                    </Link>
                )}

            </div>

        </div>
    );
}
