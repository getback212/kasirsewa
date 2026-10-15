export function formatThousand(val: string | number): string {
    if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    // Pastikan selalu 2 desimal desimal sebelum format ribuan
    // Contoh: 15000.5 → "15000.50" → "15.000,50" (id-ID locale)
    const fixed = Number(num.toFixed(2)); // konversi balik ke number
    return fixed.toLocaleString('id-ID');
}

export function parseThousand(val: string): string {
    if (!val) return '';
    // Tangani format id-ID: potong titik ribuan (.), ganti koma desimal jadi titik
    // Contoh input: "15.000,50" → setelah proses: "15000.50"
    let clean = val.replace(/\./g, '').replace(',', '.');
    // Hapus karakter selain angka dan titik
    clean = clean.replace(/[^0-9.]/g, '');
    if (!clean || clean === '.' || isNaN(Number(clean))) return '0';
    // Kepresi 2 desimal agar konsisten dengan format harga produk
    return Number(clean).toFixed(2);
}
