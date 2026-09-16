import { Head } from '@inertiajs/react';
import { ShoppingBag, Shield, Layers, Rocket } from 'lucide-react';

export default function Welcome() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
            <Head title="RetailPRO POS System" />
            
            <div className="max-w-xl w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
                    <ShoppingBag className="w-8 h-8" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">RetailPRO POS System</h1>
                    <p className="text-xs text-slate-400 mt-2">
                        Production-Ready Modern Multi-Outlet POS Engine (Laravel 12 + Inertia v2 + React 19)
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-left">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <div className="text-[11px] font-bold text-slate-200">Server RBAC</div>
                        <div className="text-[9px] text-slate-500">Spatie Security</div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <div className="text-[11px] font-bold text-slate-200">Multi-Outlet</div>
                        <div className="text-[9px] text-slate-500">Isolated Scope</div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <Rocket className="w-4 h-4 text-amber-400" />
                        <div className="text-[11px] font-bold text-slate-200">React 19 SPA</div>
                        <div className="text-[9px] text-slate-500">Inertia Engine</div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                    PHASE 1 Complete — Architecture & Setup Ready
                </div>
            </div>
        </div>
    );
}
