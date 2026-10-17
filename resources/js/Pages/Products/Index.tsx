import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Boxes, Plus, Search, Edit, Trash2, Barcode, Tag, FolderPlus } from 'lucide-react';
import { formatThousand, parseThousand } from '@/Utils/format';

interface CategoryItem {
    id: number;
    name: string;
}

interface UnitItem {
    id: number;
    name: string;
    short_name: string;
}

interface ProductItem {
    id: number;
    sku: string;
    barcode?: string;
    name: string;
    description?: string;
    purchase_price: number;
    selling_price: number;
    minimum_stock: number;
    is_active: boolean;
    category?: CategoryItem;
    unit?: UnitItem;
}

interface ProductsPageProps extends Record<string, any> {
    products: {
        data: ProductItem[];
        links: any[];
        total: number;
    };
    categories: CategoryItem[];
    units: UnitItem[];
    filters: {
        search?: string;
        category_id?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ProductsIndex({ products, categories, units, filters }: ProductsPageProps) {
    const { flash = {} } = usePage<ProductsPageProps>().props;
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        sku: `PRD-${Date.now().toString().slice(-4)}`,
        barcode: '',
        category_id: '',
        unit_id: '',
        purchase_price: '',
        selling_price: '',
        minimum_stock: '5',
        description: '',
    });

    const categoryForm = useForm({
        name: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/products', { search }, { preserveState: true });
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        reset();
        setData({
            name: '',
            sku: `PRD-${Date.now().toString().slice(-4)}`,
            barcode: '',
            category_id: categories.length > 0 ? String(categories[0].id) : '',
            unit_id: units.length > 0 ? String(units[0].id) : '',
            purchase_price: '',
            selling_price: '',
            minimum_stock: '5',
            description: '',
        });
        setShowModal(true);
    };

    const openEditModal = (product: ProductItem) => {
        setEditingProduct(product);
        setData({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || '',
            category_id: product.category ? String(product.category.id) : '',
            unit_id: product.unit ? String(product.unit.id) : '',
            purchase_price: String(product.purchase_price),
            selling_price: String(product.selling_price),
            minimum_stock: String(product.minimum_stock),
            description: product.description || '',
        });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            put(`/products/${editingProduct.id}`, {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post('/products', {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDeleteProduct = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
            router.delete(`/products/${id}`);
        }
    };

    const handleCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        categoryForm.post('/categories', {
            onSuccess: () => {
                categoryForm.reset();
            },
        });
    };

    const handleDeleteCategory = (id: number, name: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus kategori '${name}'?`)) {
            router.delete(`/categories/${id}`);
        }
    };

    return (
        <AppLayout title="Katalog Produk">
            <Head title="Katalog Master Data Produk - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Boxes className="w-5 h-5 text-blue-400" /> Katalog Master Data Produk & Barcode Scanner
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Kelola produk barang, harga beli (HPP), harga jual, SKU/barcode, kategori, dan batas minimum stok.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCategoryModal(true)}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs rounded-2xl flex items-center gap-2 transition cursor-pointer"
                        >
                            <Tag className="w-4 h-4 text-emerald-400" /> Kelola Kategori ({categories.length})
                        </button>

                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> + Tambah Produk Baru
                        </button>
                    </div>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center justify-between">
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-semibold flex items-center justify-between">
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* SEARCH TOOLBAR & CATEGORIES FILTER */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <form onSubmit={handleSearch} className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari Nama Produk / SKU / Barcode Scanner..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                        />
                    </form>

                    <div className="text-xs font-mono font-bold text-slate-400">
                        {products.total} Produk Terdaftar
                    </div>
                </div>

                {/* PRODUCTS TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">SKU / BARCODE</th>
                                    <th className="p-4">NAMA PRODUK</th>
                                    <th className="p-4">KATEGORI</th>
                                    <th className="p-4">HARGA BELI (HPP)</th>
                                    <th className="p-4">HARGA JUAL</th>
                                    <th className="p-4 text-center">SATUAN</th>
                                    <th className="p-4 text-right">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {products.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                                            Belum ada data produk terdaftar.
                                        </td>
                                    </tr>
                                ) : (
                                    products.data.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-4 font-bold text-blue-400">
                                                <div>{p.sku}</div>
                                                {p.barcode && <div className="text-[10px] text-slate-500 font-normal flex items-center gap-1"><Barcode className="w-3 h-3 inline" /> {p.barcode}</div>}
                                            </td>
                                            <td className="p-4 font-sans font-bold text-white">
                                                {p.name}
                                            </td>
                                            <td className="p-4 font-sans text-slate-300">
                                                <span className="px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-[10px]">
                                                    {p.category?.name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-400">
                                                Rp {Number(p.purchase_price).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-4 font-bold text-emerald-400">
                                                Rp {Number(p.selling_price).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-4 text-center font-sans text-slate-400">
                                                {p.unit?.short_name || 'pcs'}
                                            </td>
                                            <td className="p-4 text-right space-x-2 font-sans">
                                                <button
                                                    onClick={() => openEditModal(p)}
                                                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                                                >
                                                    <Edit className="w-3.5 h-3.5 text-blue-400" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(p.id)}
                                                    className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL TAMBAH / EDIT PRODUK */}
                {showModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <form onSubmit={handleSubmit} className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Boxes className="w-5 h-5 text-blue-400" />
                                    <span>{editingProduct ? 'Edit Master Produk' : 'Tambah Produk Baru'}</span>
                                </h3>
                                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">SKU Barang (Unik)</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.sku}
                                        onChange={(e) => setData('sku', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                    />
                                    {errors.sku && <span className="text-rose-400 text-[10px]">{errors.sku}</span>}
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Barcode (Hardware Scanner)</label>
                                    <input
                                        type="text"
                                        value={data.barcode}
                                        onChange={(e) => setData('barcode', e.target.value)}
                                        placeholder="Scan Barcode USB..."
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nama Produk</label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Kopi Instant Sachet 25g"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Kategori Produk</label>
                                    <select
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                                    >
                                        <option value="">Pilih Kategori...</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Satuan Produk</label>
                                    <select
                                        value={data.unit_id}
                                        onChange={(e) => setData('unit_id', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                                    >
                                        {units.map((u) => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Harga Beli Kulakan HPP (Rp)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formatThousand(data.purchase_price)}
                                        onChange={(e) => setData('purchase_price', parseThousand(e.target.value))}
                                        placeholder="0"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Harga Jual POS (Rp)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formatThousand(data.selling_price)}
                                        onChange={(e) => setData('selling_price', parseThousand(e.target.value))}
                                        placeholder="0"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Batas Minimum Stok</label>
                                    <input
                                        type="number"
                                        required
                                        value={data.minimum_stock}
                                        onChange={(e) => setData('minimum_stock', e.target.value)}
                                        placeholder="0"
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                                    />
                                    {errors.minimum_stock && <span className="text-rose-400 text-[10px]">{errors.minimum_stock}</span>}
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Status Produk</label>
                                    <select
                                        value={editingProduct?.is_active ? 'true' : 'false'}
                                        onChange={(e) => setData('is_active', e.target.value === 'true')}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                                    >
                                        <option value="true">✓ Aktif (Dijual)</option>
                                        <option value="false">✕ Nonaktif (Tidak Dijual)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Deskripsi Produk</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Catatan detail produk..."
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-normal resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                                <button type="submit" disabled={processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                                    {processing ? '⏳ Menyimpan...' : 'Simpan Produk'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODAL KELOLA KATEGORI PRODUK */}
                {showCategoryModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-emerald-400" /> Kelola Kategori Produk ({categories.length})
                                </h3>
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            {/* FORM INSTAN TAMBAH KATEGORI */}
                            <form onSubmit={handleCreateCategory} className="flex gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                                <input
                                    type="text"
                                    required
                                    value={categoryForm.data.name}
                                    onChange={(e) => categoryForm.setData('name', e.target.value)}
                                    placeholder="Nama Kategori Baru (e.g. Snack/Minuman)..."
                                    className="flex-1 px-3 py-2 bg-transparent text-white placeholder-slate-600 focus:outline-none font-bold"
                                />
                                <button
                                    type="submit"
                                    disabled={categoryForm.processing}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1 active:scale-95"
                                >
                                    <FolderPlus className="w-4 h-4" /> Tambah
                                </button>
                            </form>

                            {/* DAFTAR KATEGORI TABLE */}
                            <div className="space-y-2 max-h-60 overflow-y-auto pt-1">
                                {categories.length === 0 ? (
                                    <p className="text-center text-slate-500 py-6">Belum ada kategori terdaftar.</p>
                                ) : (
                                    categories.map((c) => (
                                        <div key={c.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center font-bold text-slate-200">
                                            <span className="flex items-center gap-2">
                                                <Tag className="w-3.5 h-3.5 text-blue-400" /> {c.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCategory(c.id, c.name)}
                                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition cursor-pointer active:scale-95"
                                                title="Hapus Kategori"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
