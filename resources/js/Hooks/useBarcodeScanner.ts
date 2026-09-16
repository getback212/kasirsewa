import { useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
    onScan: (barcode: string) => void;
    minCharLength?: number;
    maxIntervalMs?: number;
}

export function useBarcodeScanner({
    onScan,
    minCharLength = 3,
    maxIntervalMs = 50,
}: UseBarcodeScannerOptions) {
    const bufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore keystrokes if typing inside standard text input fields
            const target = e.target as HTMLElement;
            const isInputField =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // If user is focused on standard text input, do not hijack keystrokes unless it's Enter
            if (isInputField && target.getAttribute('id') !== 'barcode-scanner-input') {
                return;
            }

            const currentTime = Date.now();

            if (currentTime - lastKeyTimeRef.current > maxIntervalMs) {
                bufferRef.current = '';
            }

            lastKeyTimeRef.current = currentTime;

            if (e.key === 'Enter') {
                if (bufferRef.current.length >= minCharLength) {
                    onScan(bufferRef.current.trim());
                    bufferRef.current = '';
                    e.preventDefault();
                }
            } else if (e.key.length === 1) {
                bufferRef.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onScan, minCharLength, maxIntervalMs]);
}
