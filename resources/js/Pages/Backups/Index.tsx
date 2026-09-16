import { useState } from 'react';
import { Head, usePage, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Database, Download, Trash2, CheckCircle2, AlertCircle, HardDrive, Loader2, RefreshCw, Upload } from 'lucide-react';
import type { PageProps } from '@/Types';

interface BackupItem {
    filename: string;
    size: string;
    created_at: string;
}

interface BackupsPageProps extends PageProps {
    backups?: BackupItem[];
}

export default function BackupsIndex({ backups = [] }: BackupsPageProps) {
    const { flash } = usePage<BackupsPageProps>().props;
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [restoringFilename, setRestoringFilename] = useState<string | null>(null);

    const uploadForm = useForm({
        backup_file: null as File | null,
    });

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadForm.data.backup_file) {
            alert('Pilih file backup database (.sql atau .sql.gz) terlebih dahulu.');
            return;
        }

        uploadForm.post('/backups/upload', {
            preserveScroll: true,
            onSuccess: () => {
                setShowUploadModal(false);
                uploadForm.reset();
            },
        });
    };

    const handleRunBackup = () => {
        setIsBackingUp(true);
        router.post('/backups/run', {}, {
            onFinish: () => setIsBackingUp(false),
            preserveScroll: true,
        });
    };

    const handleRestore = (filename: string) => {
        if (confirm(`⚠️ PERINGATAN BESAR!\n\nApakah Anda yakin ingin memulihkan (RESTORE) database dari file ${filename}?\n\nSemua data transaksi dan stok saat ini akan dikembalikan ke kondisi saat file backup ini dibuat!`)) {
            setRestoringFilename(filename);
            router.post(`/backups/${filename}/restore`, {}, {
                onFinish: () => setRestoringFilename(null),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = (filename: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus file backup ${filename}?`)) {
            router.delete(`/backups/${filename}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout title="Backup & Restore Database">
            <Head title="Manajemen Backup & Restore Database - RetailPRO POS" />

            <div className="max-w-6xl mx-auto p-6 space-y-6">
                
                {/* HEADER BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Database className="w-5 h-5 text-emerald-400" /> PostgreSQL Database Backup & Restore Subsystem
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Cadangan otomatis 30 hari, 1-click manual backup, dan pemulihan (restore) database PostgreSQL instan.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                            <Upload className="w-4 h-4 text-blue-400" />
                            <span>📤 Upload File Backup</span>
                        </button>

                        <button
                            onClick={handleRunBackup}
                            disabled={isBackingUp}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                        >
                            {isBackingUp ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>⏳ Sedang Membuat Backup...</span>
                                </>
                            ) : (
                                <>
                                    <HardDrive className="w-4 h-4" />
                                    <span>+ Jalankan Backup Sekarang</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* FLASH NOTIFICATION */}
                {flash.success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* BACKUPS HISTORY TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 font-bold text-xs text-white flex justify-between items-center">
                        <span>📋 Daftar File Backup PostgreSQL (.sql.gz) ({(backups || []).length} Files)</span>
                        <span className="text-[10px] text-slate-500 font-mono">Retensi Auto Clean: 30 Hari</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="p-4">NAMA FILE BACKUP</th>
                                    <th className="p-4">UKURAN FILE</th>
                                    <th className="p-4">TANGGAL BACKUP</th>
                                    <th className="p-4 text-right">AKSI PEMULIHAN & CADANGAN</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {!backups || backups.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500 font-sans">
                                            Belum ada file backup database PostgreSQL recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    backups.map((bk, idx) => {
                                        const isRestoringThis = restoringFilename === bk.filename;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-800/40 transition">
                                                <td className="p-4 font-bold text-emerald-400">{bk.filename}</td>
                                                <td className="p-4 text-slate-300">{bk.size}</td>
                                                <td className="p-4 text-slate-400">{bk.created_at}</td>
                                                <td className="p-4 text-right space-x-2 font-sans">
                                                    <button
                                                        onClick={() => handleRestore(bk.filename)}
                                                        disabled={isRestoringThis}
                                                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                                                    >
                                                        {isRestoringThis ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                        )}
                                                        <span>Restore</span>
                                                    </button>

                                                    <a
                                                        href={`/backups/${bk.filename}/download`}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                                                    >
                                                        <Download className="w-3.5 h-3.5" /> Unduh
                                                    </a>

                                                    <button
                                                        onClick={() => handleDelete(bk.filename)}
                                                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL UPLOAD FILE BACKUP DATABASE */}
                {showUploadModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-blue-400" /> Upload File Backup PostgreSQL (.sql.gz)
                                </h3>
                                <button type="button" onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <form onSubmit={handleUploadSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-slate-400 font-semibold mb-1">Pilih File Backup (.sql.gz / .sql)</label>
                                    <input
                                        type="file"
                                        accept=".gz,.sql,.sql.gz"
                                        required
                                        onChange={(e) => uploadForm.setData('backup_file', e.target.files ? e.target.files[0] : null)}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                                    />
                                    <p className="text-[11px] text-slate-500">Mendukung file kompresi backup PostgreSQL (.sql.gz) hingga 100MB.</p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowUploadModal(false)}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploadForm.processing}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg cursor-pointer transition disabled:opacity-50"
                                    >
                                        {uploadForm.processing ? '⏳ Uploading...' : 'Upload File Backup'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
