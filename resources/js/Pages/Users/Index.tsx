import React, { useState } from 'react';
import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Users as UsersIcon, Plus, Search, Edit, Trash2, CheckCircle2, AlertCircle, Shield, Key, Lock } from 'lucide-react';
import type { PageProps } from '@/Types';

interface UserRecord {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    outlet_id: number;
    outlet_name: string;
    role: string;
    created_at: string;
}

interface OutletItem {
    id: number;
    code: string;
    name: string;
}

interface RoleOption {
    value: string;
    label: string;
}

interface UsersPageProps extends PageProps {
    users: {
        data: UserRecord[];
        links: any[];
        total: number;
    };
    outlets: OutletItem[];
    roles: RoleOption[];
    filters: { search?: string; role?: string };
}

export default function UsersIndex({ users, outlets, roles, filters }: UsersPageProps) {
    const { flash, tenantSubscription } = usePage<UsersPageProps & { tenantSubscription: any }>().props;
    const canCreateUser = tenantSubscription ? tenantSubscription.can_create_user : true;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState(filters.role || '');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);

    const handleConfirmDelete = () => {
        if (!deletingUser) return;
        router.delete(`/users/${deletingUser.id}`, {
            onSuccess: () => setDeletingUser(null),
        });
    };

    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        password: 'password',
        role: 'CASHIER',
        outlet_id: outlets.length > 0 ? String(outlets[0].id) : '',
        send_invite: true,
    });

    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        role: 'CASHIER',
        outlet_id: '',
        is_active: true,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/users', { search, role: selectedRoleFilter }, { preserveState: true });
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/users', {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const openEditModal = (user: UserRecord) => {
        setEditingUser(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            outlet_id: String(user.outlet_id),
            is_active: user.is_active,
        });
    };

    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        const payload: any = {
            name: editForm.data.name,
            email: editForm.data.email,
            role: editForm.data.role,
            outlet_id: editForm.data.outlet_id,
            is_active: editForm.data.is_active,
        };

        if (editForm.data.password && editForm.data.password.trim() !== '') {
            payload.password = editForm.data.password;
        }

        router.put(`/users/${editingUser.id}`, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingUser(null);
            },
            onError: (errs) => {
                const msg = Object.values(errs).flat().join('\n') || 'Gagal mengubah data staff.';
                alert(`Gagal Update Staff:\n${msg}`);
            },
        });
    };

    const handleToggleStatus = (user: UserRecord) => {
        const action = user.is_active ? 'nonaktifkan' : 'aktifkan';
        if (confirm(`Apakah Anda yakin ingin meng-${action} akun staff ${user.name}?`)) {
            router.post(`/users/${user.id}/toggle-status`);
        }
    };

    return (
        <AppLayout title="Manajemen Staff">
            <Head title="👥 Pengaturan Staff & Akun Role User - RetailPRO POS" />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <UsersIcon className="w-5 h-5 text-blue-400" /> Manajemen Staff & Akun Pengguna Role
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Pengelolaan akun karyawan, penugasan role (Owner, Manager, Kasir, Gudang), dan outlet cabang toko.
                        </p>
                    </div>

                    {canCreateUser ? (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> + Tambah Karyawan / Staff Baru
                        </button>
                    ) : (
                        <Link
                            href="/subscription"
                            className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-2xl flex items-center gap-2 transition cursor-pointer"
                        >
                            <Lock className="w-4 h-4 text-amber-400" />
                            <span>Batas Staff Terpenuhi ({tenantSubscription?.current_users_count}/{tenantSubscription?.max_users}) • Upgrade Paket</span>
                        </Link>
                    )}
                </div>

                {/* SAAS LIMIT WARNING BANNER */}
                {!canCreateUser && tenantSubscription && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 font-medium flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                                Batas kuota staff karyawan untuk paket berlangganan <strong>{tenantSubscription.plan_name}</strong> telah mencapai batas maksimal (<strong>{tenantSubscription.current_users_count}/{tenantSubscription.max_users} Staff Users</strong>).
                            </span>
                        </div>
                        <Link
                            href="/subscription"
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl shrink-0 transition"
                        >
                            Upgrade Paket SaaS →
                        </Link>
                    </div>
                )}

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* SEARCH & ROLE FILTER TOOLBAR */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari Nama Staff / Email Karyawan..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <select
                            value={selectedRoleFilter}
                            onChange={(e) => {
                                setSelectedRoleFilter(e.target.value);
                                router.get('/users', { search, role: e.target.value }, { preserveState: true });
                            }}
                            className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white font-medium focus:outline-none"
                        >
                            <option value="">Semua Role Access</option>
                            {roles.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </form>
                </div>

                {/* USERS TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 font-bold text-xs text-white flex justify-between items-center">
                        <span>Daftar Akun Staff Terdaftar ({users.total})</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">NAMA KARYAWAN</th>
                                    <th className="p-4">EMAIL LOGIN</th>
                                    <th className="p-4">PERAN (ROLE)</th>
                                    <th className="p-4">OUTLET CABANG</th>
                                    <th className="p-4 text-center">STATUS AKUN</th>
                                    <th className="p-4 text-right">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-[11px]">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                                            Belum ada data staff pengguna terdaftar.
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-800/40 transition font-sans">
                                            <td className="p-4 font-bold text-white flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400 uppercase">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <span>{u.name}</span>
                                            </td>
                                            <td className="p-4 text-slate-400 font-mono">{u.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase font-mono border ${
                                                    u.role === 'OWNER' || u.role === 'SUPER_ADMIN'
                                                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                                        : u.role === 'MANAGER'
                                                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                        : u.role === 'CASHIER'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                }`}>
                                                    <Shield className="w-3 h-3 inline mr-1" />
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-300 font-medium">{u.outlet_name}</td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(u)}
                                                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase cursor-pointer border transition ${
                                                        u.is_active
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-400'
                                                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-400'
                                                    }`}
                                                >
                                                    {u.is_active ? 'AKTIF' : 'NON-AKTIF'}
                                                </button>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => openEditModal(u)}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition active:scale-95"
                                                >
                                                    <Edit className="w-3.5 h-3.5 text-blue-400" /> Edit
                                                </button>
                                                {u.role !== 'OWNER' && u.role !== 'SUPER_ADMIN' && (
                                                    <button
                                                        onClick={() => setDeletingUser(u)}
                                                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition active:scale-95"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Hapus
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL TAMBAH STAFF BARU */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <form onSubmit={handleCreateUser} className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <UsersIcon className="w-4 h-4 text-blue-400" /> Tambah Staff Pengguna Baru
                                </h3>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nama Lengkap Karyawan</label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="e.g. Santi Kasir Utami"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Email Gmail Staff (Untuk Google SSO)</label>
                                <input
                                    type="email"
                                    required
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                    placeholder="e.g. kasirsanti@gmail.com"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nomor WhatsApp Staff (Opsional)</label>
                                <input
                                    type="text"
                                    value={createForm.data.phone}
                                    onChange={(e) => createForm.setData('phone', e.target.value)}
                                    placeholder="e.g. 081234567890"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Password Awal Login Staff</label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    placeholder="Masukkan password awal"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Default password awal: <span className="font-mono text-emerald-400 font-bold">password</span> (Staf dapat login via Google SSO atau Password).</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Role / Peran</label>
                                    <select
                                        value={createForm.data.role}
                                        onChange={(e) => createForm.setData('role', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    >
                                        {roles.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Outlet Cabang</label>
                                    <select
                                        value={createForm.data.outlet_id}
                                        onChange={(e) => createForm.setData('outlet_id', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                                    >
                                        {outlets.map((o) => (
                                            <option key={o.id} value={o.id}>[{o.code}] {o.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                                <button type="submit" disabled={createForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                                    {createForm.processing ? '⏳ Menyimpan...' : 'Simpan Staff Baru'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODAL EDIT STAFF & RESET PASSWORD */}
                {editingUser && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <form onSubmit={handleUpdateUser} className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Edit className="w-4 h-4 text-blue-400" /> Edit Data Staff #{editingUser.id}
                                </h3>
                                <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Nama Lengkap Karyawan</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Email Login Staff</label>
                                <input
                                    type="email"
                                    required
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                                    <Key className="w-3.5 h-3.5 text-amber-400" /> Reset Password (Biarkan kosong jika tidak diubah)
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                    placeholder="Password baru..."
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Role / Peran</label>
                                    <select
                                        value={editForm.data.role}
                                        onChange={(e) => editForm.setData('role', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                    >
                                        {roles.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-400 font-semibold mb-1">Outlet Cabang</label>
                                    <select
                                        value={editForm.data.outlet_id}
                                        onChange={(e) => editForm.setData('outlet_id', e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                                    >
                                        {outlets.map((o) => (
                                            <option key={o.id} value={o.id}>[{o.code}] {o.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-semibold mb-1">Status Keaktifan Akun</label>
                                <select
                                    value={editForm.data.is_active ? '1' : '0'}
                                    onChange={(e) => editForm.setData('is_active', e.target.value === '1')}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                                >
                                    <option value="1">Aktif (Dapat Login)</option>
                                    <option value="0">Non-Aktif (Di-blokir)</option>
                                </select>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">Batal</button>
                                <button type="submit" disabled={editForm.processing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                                    {editForm.processing ? '⏳ Update...' : 'Simpan Perubahan Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODAL KONFIRMASI HAPUS STAFF */}
                {deletingUser && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-rose-500/30 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
                            <div className="flex items-center gap-3 text-rose-400">
                                <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-white">Konfirmasi Hapus Akun Staff</h3>
                                    <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                                <p><strong>Nama Staff:</strong> {deletingUser.name}</p>
                                <p><strong>Email:</strong> {deletingUser.email}</p>
                                <p><strong>Role:</strong> {deletingUser.role}</p>
                            </div>
                            <p className="text-xs text-slate-400">
                                Apakah Anda yakin ingin menghapus akun staff <strong>{deletingUser.name}</strong> secara permanen dari database?
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletingUser(null)}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg cursor-pointer transition"
                                >
                                    Hapus Staff
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
