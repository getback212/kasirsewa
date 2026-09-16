import { useEffect } from 'react';

interface ShortcutMap {
    onF2?: () => void; // Search Product
    onF3?: () => void; // Sales History
    onF4?: () => void; // Select Customer
    onF8?: () => void; // Payment Modal
    onF9?: () => void; // Hold Cart
    onEsc?: () => void; // Clear Cart / Close Modal
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                shortcuts.onF2?.();
            } else if (e.key === 'F3') {
                e.preventDefault();
                shortcuts.onF3?.();
            } else if (e.key === 'F4') {
                e.preventDefault();
                shortcuts.onF4?.();
            } else if (e.key === 'F8') {
                e.preventDefault();
                shortcuts.onF8?.();
            } else if (e.key === 'F9') {
                e.preventDefault();
                shortcuts.onF9?.();
            } else if (e.key === 'Escape') {
                shortcuts.onEsc?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}
