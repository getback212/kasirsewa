import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Truck, Plus, Trash2, CheckCircle2, PackageCheck, FileText, Building2, UserPlus, Phone, Mail, Edit } from 'lucide-react';
import type { PageProps } from '@/Types';

interface SupplierItem {
    id: number;
    code: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface ProductItem {
    id: number;
    sku: string;
    name: string;
    purchase_price: number;
    unit_name?: string;
}

interface PurchaseRecord {
    id: number;
    invoice_number: string;
    purchase_date: string;
    grand_total: number;
    status: string;
    supplier?: SupplierItem;
    user?: { name: string };
    items?: any[];
}

interface PurchasesPageProps extends PageProps {
    purchases: {
        data: PurchaseRecord[];
        links: any[];
        total: number;
    };
    suppliers: SupplierItem[];
    products: ProductItem[];
}

export default function PurchasesIndex({ purchases, suppliers, products }: PurchasesPageProps) {
    const { flash } = usePage<PurchasesPageProps>().props;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
    const [cartItems, setCartItems] = useState<any[]>([]);

    const [selectedProductId, setSelectedProductId] = useState<number>(products.length > 0 ? products[0].id : 0);
    
    // Use string state for inputs so clearing 0 works & formatted thousand separators
    const [purchaseQtyStr, setPurchaseQtyStr] = useState<string>('10');
    const [unitCostStr, setUnitCostStr] = useState<string>(
        products.length > 0 ? Number(products[0].purchase_price).toLocaleString('id-ID') : '0'
    );

    const activeProduct = products.find((p) => p.id === Number(selectedProductId)) || (products.length > 0 ? products[0] : null);

    const { data, setData, processing, reset } = useForm({
        supplier_id: suppliers.length > 0 ? String(suppliers[0].id) : '',
        subtotal: '0',
        discount_amount: '0',
        tax_amount: '0',
        grand_total: '0',
        note: 'Restok kulakan barang dari supplier',
    });

    const supplierForm = useForm({
        code: `SUPP-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        phone: '',
        email: '',
        address: '',
    });

    const editSupplierForm = useForm({
        code: '',
        name: '',
        phone: '',
        email: '',
        address: '',
    });

    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const grandTotal = subtotal;

    // Helper: format number with Indonesian thousand separator dot "."
    const formatNumberInput = (raw: string) => {
        const cleanDigits = raw.replace(/\D/g, '');
        if (!cleanDigits) return '';
        return Number(cleanDigits).toLocaleString('id-ID');
    };

    // Helper: parse formatted string back to raw number
    const parseFormattedNumber = (formatted: string): number => {
        const cleanDigits = formatted.replace(/\D/g, '');
        return cleanDigits ? Number(cleanDigits) : 0;
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        const prod = products.find((p) => p.id === Number(selectedProductId));
        if (!prod) return;

        const qtyNum = parseFormattedNumber(purchaseQtyStr);
        const costNum = parseFormattedNumber(unitCostStr);

        if (qtyNum <= 0) {
            alert('Jumlah masuk (Qty) harus lebih dari 0.');
            return;
        }

        setCartItems((prev) => [
            ...prev,
            {
                product_id: prod.id,
                sku: prod.sku,
                name: prod.name,
                unit_name: prod.unit_name || 'pcs',
                quantity: qtyNum,
                unit_cost: costNum,
                subtotal: qtyNum * costNum,
            },
        ]);
    };

    const removeItem = (index: number) => {
        setCartItems(cartItems.filter((_, i) => i !== index));
    };

    const handleOpenCreateModal = () => {
        if (suppliers.length > 0 && (!data.supplier_id || data.supplier_id === '0')) {
            setData('supplier_id', String(suppliers[0].id));
        }
        if (products.length > 0 && (!selectedProductId || selectedProductId === 0)) {
            setSelectedProductId(products[0].id);
            setUnitCostStr(Number(products[0].purchase_price).toLocaleString('id-ID'));
        }
        setShowCreateModal(true);
    };

    const handleSubmitPurchase = (e: React.FormEvent) => {
        e.preventDefault();
        if (cartItems.length === 0) {
            alert('Masukkan minimal 1 produk barang yang akan direstok.');
            return;
        }

        const effectiveSupplierId = Number(data.supplier_id) || (suppliers.length > 0 ? suppliers[0].id : 0);
        if (!effectiveSupplierId) {
            alert('Silakan pilih supplier resmi terlebih dahulu.');
            return;
        }

        const payload = {
            supplier_id: effectiveSupplierId,
            items: cartItems.map((i) => ({
                product_id: i.product_id,
                quantity: i.quantity,
                unit_cost: i.unit_cost,
            })),
            subtotal,
            discount_amount: 0,
            tax_amount: 0,
            grand_total: grandTotal,
            note: data.note || 'Restok kulakan barang dari supplier',
        };

        router.post('/purchases', payload, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateModal(false);
                setCartItems([]);
                reset();
            },
            onError: (errs) => {
                const msg = Object.values(errs).flat().join('\n') || 'Gagal menyimpan transaksi restok.';
                alert(`Gagal Restok:\n${msg}`);
            },
        });
    };

    const handleCreateSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        supplierForm.post('/suppliers', {
            onSuccess: () => {
                supplierForm.reset();
            },
        });
    };

    const openEditSupplierModal = (s: SupplierItem) => {
        setEditingSupplier(s);
        editSupplierForm.setData({
            code: s.code,
            name: s.name,
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
        });
    };

    const handleUpdateSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSupplier) return;

        editSupplierForm.put(`/suppliers/${editingSupplier.id}`, {
            onSuccess: () => {
                setEditingSupplier(null);
            },
        });
    };

    const handleDeleteSupplier = (id: number, name: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus data supplier '${name}'?`)) {
            router.delete(`/suppliers/${id}`);
        }
    };

    return (
        <AppLayout title="Restok Supplier">
            <Head title="Restok Barang Supplier (Purchases) - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Truck className="w-5 h-5 text-emerald-400" /> Restok Barang & Transaksi Pembelian Supplier
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Pencatatan faktur pembelian (Purchase Order), pengadaan stok gudang, dan penambahan stok otomatis.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                        <button
                            onClick={() => setShowSupplierModal(true)}
                            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                            <Building2 className="w-4 h-4 text-blue-400" /> Kelola Supplier ({suppliers.length})
                        </button>

                        <button
                            onClick={handleOpenCreateModal}
                            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> + Restok Supplier Baru
                        </button>
                    </div>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* PURCHASES AUDIT TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 font-bold text-xs text-white flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <span>Histori Transaksi Restok Supplier ({purchases.total})</span>
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">INVOICE PO</th>
                                    <th className="p-4">TANGGAL RESTOK</th>
                                    <th className="p-4">SUPPLIER RESMI</th>
                                    <th className="p-4">TOTAL RESTOK (HPP)</th>
                                    <th className="p-4">DIBUAT OLEH</th>
                                    <th className="p-4 text-center">STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {purchases.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                                            Belum ada histori transaksi restok supplier recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    purchases.data.map((po) => (
                                        <tr key={po.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-4 font-bold text-white">{po.invoice_number}</td>
                                            <td className="p-4 text-slate-400">
                                                {new Date(po.purchase_date).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-4 font-sans font-bold text-white">
                                                {po.supplier?.name || 'Supplier Utama'}
                                            </td>
                                            <td className="p-4 font-bold text-emerald-400">
                                                Rp {Number(po.grand_total).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-4 font-sans text-slate-400">
                                                {po.user?.name || 'Admin'}
                                            </td>
                                            <td className="p-4 text-center font-sans">
                                                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-[10px] uppercase">
                                                    {po.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL RESTOK SUPPLIER */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <PackageCheck className="w-5 h-5 text-emerald-400" /> Restok Barang Dari Supplier
                                </h3>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                
                                {/* FORM SELECTION (COL 5) */}
                                <div className="md:col-span-5 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                                    <div>
                                        <label className="block text-slate-400 font-semibold mb-1">Pilih Supplier Resmi</label>
                                        <select
                                            value={data.supplier_id}
                                            onChange={(e) => setData('supplier_id', e.target.value)}
                                            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                                        >
                                            {suppliers.map((s) => (
                                                <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <form onSubmit={handleAddItem} className="space-y-3 pt-2 border-t border-slate-800">
                                        <div>
                                            <label className="block text-slate-400 font-semibold mb-1">Pilih Produk</label>
                                            <select
                                                value={selectedProductId}
                                                onChange={(e) => {
                                                    const pid = Number(e.target.value);
                                                    setSelectedProductId(pid);
                                                    const p = products.find((x) => x.id === pid);
                                                    if (p) setUnitCostStr(Number(p.purchase_price).toLocaleString('id-ID'));
                                                }}
                                                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-semibold"
                                            >
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>[{p.sku}] {p.name} ({p.unit_name || 'pcs'})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-slate-400 font-semibold mb-1 flex justify-between">
                                                    <span>Jumlah Masuk (Qty)</span>
                                                    <span className="text-emerald-400 font-mono font-bold">[{activeProduct?.unit_name || 'pcs'}]</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={purchaseQtyStr}
                                                    onChange={(e) => setPurchaseQtyStr(formatNumberInput(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-slate-400 font-semibold mb-1">Harga Kulakan (Rp)</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={unitCostStr}
                                                    onChange={(e) => setUnitCostStr(formatNumberInput(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                                        >
                                            <Plus className="w-4 h-4 text-emerald-400" /> + Tambahkan Ke Daftar Restok
                                        </button>
                                    </form>
                                </div>

                                {/* ITEMS LIST (COL 7) */}
                                <div className="md:col-span-7 space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs font-bold text-slate-300">
                                        <span>Daftar Barang Masuk Gudang</span>
                                        <span className="text-emerald-400 font-mono font-extrabold text-sm">Total HPP: Rp {grandTotal.toLocaleString('id-ID')}</span>
                                    </div>

                                    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold">
                                                <tr>
                                                    <th className="p-3">PRODUK</th>
                                                    <th className="p-3">QTY / SATUAN</th>
                                                    <th className="p-3">HARGA KULAKAN</th>
                                                    <th className="p-3">SUBTOTAL</th>
                                                    <th className="p-3 text-right">AKSI</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/60 font-mono">
                                                {cartItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                                                            Belum ada barang ditambahkan ke daftar restok.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    cartItems.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-800/40">
                                                            <td className="p-3 font-bold text-white font-sans">{item.name}</td>
                                                            <td className="p-3 font-bold text-emerald-400">
                                                                +{item.quantity.toLocaleString('id-ID')} {item.unit_name}
                                                            </td>
                                                            <td className="p-3 text-slate-400">Rp {item.unit_cost.toLocaleString('id-ID')}</td>
                                                            <td className="p-3 font-bold text-white">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                                                            <td className="p-3 text-right font-sans">
                                                                <button onClick={() => removeItem(idx)} className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 active:scale-95">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {cartItems.length > 0 && (
                                        <button
                                            onClick={handleSubmitPurchase}
                                            disabled={processing}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                                        >
                                            <Truck className="w-5 h-5" /> SIMPAN RESTOK BARANG & TAMBAH STOK MYSQL
                                        </button>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL KELOLA SUPPLIER RESMI */}
                {showSupplierModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-400" /> Kelola Data Supplier Resmi ({suppliers.length})
                                </h3>
                                <button type="button" onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            {/* FORM INSTAN TAMBAH SUPPLIER */}
                            <form onSubmit={handleCreateSupplier} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                                    <UserPlus className="w-4 h-4 text-emerald-400" /> + Pendaftaran Supplier Baru
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-slate-500 font-semibold mb-1">Kode Supplier</label>
                                        <input
                                            type="text"
                                            required
                                            value={supplierForm.data.code}
                                            onChange={(e) => supplierForm.setData('code', e.target.value)}
                                            className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-slate-500 font-semibold mb-1">Nama Supplier / PT Distributor</label>
                                        <input
                                            type="text"
                                            required
                                            value={supplierForm.data.name}
                                            onChange={(e) => supplierForm.setData('name', e.target.value)}
                                            placeholder="e.g. PT Indofood Sukses Makmur"
                                            className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-500 font-semibold mb-1">No. Telepon / Kontak</label>
                                        <input
                                            type="text"
                                            value={supplierForm.data.phone}
                                            onChange={(e) => supplierForm.setData('phone', e.target.value)}
                                            placeholder="021-xxxxxxx"
                                            className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 font-semibold mb-1">Email Resmi</label>
                                        <input
                                            type="email"
                                            value={supplierForm.data.email}
                                            onChange={(e) => supplierForm.setData('email', e.target.value)}
                                            placeholder="sales@indofood.test"
                                            className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={supplierForm.processing}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    <Plus className="w-4 h-4" /> Simpan Data Supplier Baru
                                </button>
                            </form>

                            {/* DAFTAR SUPPLIER TABLE */}
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                        <tr>
                                            <th className="p-3">KODE</th>
                                            <th className="p-3">NAMA SUPPLIER</th>
                                            <th className="p-3">TELEPON / EMAIL</th>
                                            <th className="p-3 text-right">AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 font-mono">
                                        {suppliers.map((s) => (
                                            <tr key={s.id} className="hover:bg-slate-800/40">
                                                <td className="p-3 font-bold text-blue-400">{s.code}</td>
                                                <td className="p-3 font-bold text-white font-sans">{s.name}</td>
                                                <td className="p-3 font-sans">
                                                    {s.phone && <div className="text-slate-300 flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" /> {s.phone}</div>}
                                                    {s.email && <div className="text-slate-400 text-[10px] flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" /> {s.email}</div>}
                                                    {!s.phone && !s.email && <span className="text-slate-500">-</span>}
                                                </td>
                                                <td className="p-3 text-right font-sans space-x-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditSupplierModal(s)}
                                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer active:scale-95"
                                                        title="Edit Supplier"
                                                    >
                                                        <Edit className="w-3.5 h-3.5 text-blue-400" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSupplier(s.id, s.name)}
                                                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition cursor-pointer active:scale-95"
                                                        title="Hapus Supplier"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL EDIT SUPPLIER */}
                {editingSupplier && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <form onSubmit={handleUpdateSupplier} className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Edit className="w-4 h-4 text-blue-400" /> Edit Data Supplier #{editingSupplier.code}
                                </h3>
                                <button type="button" onClick={() => setEditingSupplier(null)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Kode</label>
                                    <input
                                        type="text"
                                        required
                                        value={editSupplierForm.data.code}
                                        onChange={(e) => editSupplierForm.setData('code', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-slate-400 font-semibold mb-1">Nama Supplier</label>
                                    <input
                                        type="text"
                                        required
                                        value={editSupplierForm.data.name}
                                        onChange={(e) => editSupplierForm.setData('name', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">No. Telepon</label>
                                    <input
                                        type="text"
                                        value={editSupplierForm.data.phone}
                                        onChange={(e) => editSupplierForm.setData('phone', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Email Resmi</label>
                                    <input
                                        type="email"
                                        value={editSupplierForm.data.email}
                                        onChange={(e) => editSupplierForm.setData('email', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setEditingSupplier(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                                <button type="submit" disabled={editSupplierForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                                    {editSupplierForm.processing ? '⏳ Update...' : 'Simpan Perubahan Supplier'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
