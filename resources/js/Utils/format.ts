export function formatThousand(val: string | number): string {
    if (!val && val !== 0) return '';
    const cleanNum = String(val).replace(/[^0-9]/g, '');
    if (!cleanNum) return '';
    return Number(cleanNum).toLocaleString('id-ID');
}

export function parseThousand(val: string): string {
    return val.replace(/[^0-9]/g, '');
}
