import React, { useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import { useCameraBarcode } from '@/Hooks/useCameraBarcode';

interface CameraScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (barcode: string) => void;
}

export default function CameraScannerModal({ isOpen, onClose, onScan }: CameraScannerModalProps) {
    const [error, setError] = useState<string | null>(null);
    const { isRunning, isSupported, startScanning, stopScanning } = useCameraBarcode({
        onScan: (barcode) => {
            onScan(barcode);
            // Auto close after successful scan
            setTimeout(() => {
                stopScanning();
                onClose();
            }, 500);
        },
        onError: (err) => setError(err),
    });

    const handleStartScanning = () => {
        setError(null);
        startScanning('qr-reader');
    };

    const handleStopScanning = () => {
        stopScanning();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-400" /> Scan Barcode / QR Code
                    </h3>
                    <button
                        type="button"
                        onClick={handleStopScanning}
                        className="text-slate-400 hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Camera Support Check */}
                {!isSupported ? (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-rose-400">
                            <p className="font-semibold">Kamera tidak tersedia</p>
                            <p className="text-rose-300/80 mt-1">Gunakan hardware scanner (USB/Bluetooth) atau perangkat dengan kamera.</p>
                        </div>
                    </div>
                ) : null}

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-400">{error}</p>
                    </div>
                )}

                {/* Scanner Preview */}
                <div id="qr-reader" className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden"></div>

                {/* Info Text */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400 text-center">
                        {isRunning
                            ? '🔴 Arahkan kamera ke barcode/QR code\nScan otomatis akan menambah produk'
                            : '📸 Tekan tombol "Mulai Scan" untuk membuka kamera'}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={handleStopScanning}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                    >
                        Tutup
                    </button>
                    {!isRunning && isSupported ? (
                        <button
                            type="button"
                            onClick={handleStartScanning}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
                        >
                            📹 Mulai Scan
                        </button>
                    ) : null}
                    {isRunning ? (
                        <button
                            type="button"
                            onClick={handleStopScanning}
                            className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition cursor-pointer"
                        >
                            🛑 Hentikan
                        </button>
                    ) : null}
                </div>

                {/* Keyboard Hint */}
                <p className="text-[10px] text-slate-500 text-center">
                    💡 Atau gunakan hardware scanner (USB/Bluetooth) dan tekan Enter
                </p>
            </div>
        </div>
    );
}
