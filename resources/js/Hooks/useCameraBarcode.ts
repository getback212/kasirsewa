import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface UseCameraBarcodeOptions {
    onScan: (barcode: string) => void;
    onError?: (error: string) => void;
}

export function useCameraBarcode({ onScan, onError }: UseCameraBarcodeOptions) {
    const [isRunning, setIsRunning] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const qrCodeRef = useRef<Html5Qrcode | null>(null);
    const lastScanRef = useRef<string>('');
    const lastScanTimeRef = useRef<number>(0);

    const startScanning = async (elementId: string) => {
        try {
            // Check camera support
            const devices = await Html5Qrcode.getCameras();
            if (devices.length === 0) {
                setIsSupported(false);
                onError?.('Kamera tidak tersedia di perangkat ini.');
                return;
            }

            // Initialize scanner
            const qrCode = new Html5Qrcode(elementId);
            qrCodeRef.current = qrCode;

            // Configuration
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                rememberLastUsedCamera: true,
                disableFlip: false,
            };

            // Start camera
            await qrCode.start(
                { facingMode: 'environment' }, // Back camera
                config,
                (decodedText) => {
                    // Debounce: ignore duplicate scans within 500ms
                    const now = Date.now();
                    if (decodedText !== lastScanRef.current || now - lastScanTimeRef.current > 500) {
                        lastScanRef.current = decodedText;
                        lastScanTimeRef.current = now;
                        onScan(decodedText);
                    }
                },
                (errorMessage) => {
                    // Suppress error spam during scanning
                }
            );

            setIsRunning(true);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal mengakses kamera';
            onError?.(message);
            setIsSupported(false);
        }
    };

    const stopScanning = async () => {
        if (qrCodeRef.current && isRunning) {
            try {
                await qrCodeRef.current.stop();
                await qrCodeRef.current.clear();
                setIsRunning(false);
            } catch (error) {
                console.error('Error stopping camera:', error);
            }
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isRunning) {
                stopScanning();
            }
        };
    }, [isRunning]);

    return {
        isRunning,
        isSupported,
        startScanning,
        stopScanning,
    };
}
