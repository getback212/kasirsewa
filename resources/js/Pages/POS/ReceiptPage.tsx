import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { PageProps } from '@/Types';

interface ReceiptPageProps extends PageProps {
    sale: {
        id: number;
        invoice_number: string;
        grand_total: number;
        subtotal: number;
        discount_amount: number;
        tax_amount: number;
        paid_amount: number;
        change_amount: number;
        sale_date: string;
        items: any[];
        payments: any[];
        outlet?: { name: string; address?: string; phone?: string; tax_percentage?: number };
        cashier?: { name: string };
        customer?: { name: string };
    };
}

export default function ReceiptPage({ sale }: ReceiptPageProps) {
    const [paperWidth, setPaperWidth] = useState<58 | 80>(58);

    const handlePrint = () => {
        window.print();
    };

    const formattedDate = sale?.sale_date
        ? new Date(sale.sale_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
        : new Date().toLocaleString('id-ID');

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col items-center justify-center font-sans print:bg-white print:p-0 print:m-0 print:min-h-0 print:text-black">
            <Head title={`Struk Thermal #${sale?.invoice_number || 'POS'}`} />

            {/* PRINT CSS OVERRIDE STYLES FOR THERMAL PRINTER HARDWARE */}
            <style font-sans="true">{`
                @media print {
                    @page {
                        size: ${paperWidth}mm auto;
                        margin: 0mm;
                    }
                    html, body {
                        width: ${paperWidth}mm !important;
                        max-width: ${paperWidth}mm !important;
                        background-color: #ffffff !important;
                        color: #000000 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .printable-receipt {
                        width: ${paperWidth}mm !important;
                        max-width: ${paperWidth}mm !important;
                        padding: 3mm 2mm !important;
                        margin: 0 auto !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        border: none !important;
                        color: #000000 !important;
                        background: #ffffff !important;
                        font-family: 'Courier New', Courier, monospace !important;
                        font-size: ${paperWidth === 58 ? '11px' : '13px'} !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-lg space-y-4 no-print">
                
                {/* TOOLBAR BUTTONS */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl gap-4 shadow-xl">
                    <Link
                        href="/pos"
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                        <ArrowLeft className="w-4 h-4 text-emerald-400" /> Kembali Ke Kasir
                    </Link>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={() => setPaperWidth(58)}
                            className={`px-4 py-2 rounded-xl text-xs font-mono font-black transition cursor-pointer ${
                                paperWidth === 58 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            📏 Kertas 58mm
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaperWidth(80)}
                            className={`px-4 py-2 rounded-xl text-xs font-mono font-black transition cursor-pointer ${
                                paperWidth === 80 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            📏 Kertas 80mm
                        </button>

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                        >
                            <Printer className="w-4 h-4" /> Cetak Struk
                        </button>
                    </div>
                </div>

                <div className="text-center text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5 bg-slate-900/50 p-2.5 rounded-2xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Lebar Struk Otomatis Mengikuti Kertas ({paperWidth}mm - Format Mlijo Online)</span>
                </div>

            </div>

            {/* FLUID THERMAL RECEIPT DISPLAY & PRINT CONTAINER */}
            <div className="flex justify-center items-center w-full my-4">
                <div
                    style={{ width: `${paperWidth}mm`, maxWidth: `${paperWidth}mm` }}
                    className="printable-receipt bg-white text-black p-4 font-mono text-[12px] leading-tight rounded-2xl shadow-2xl border border-slate-300 space-y-2"
                >
                    {/* STORE HEADER */}
                    <div className="text-center font-bold">
                        <div className="text-sm uppercase tracking-wide">{sale?.outlet?.name || 'KASIRSEWA POS'}</div>
                        {sale?.outlet?.address && <div className="text-[10px] font-normal mt-0.5">{sale.outlet.address}</div>}
                        {sale?.outlet?.phone && <div className="text-[10px] font-normal">Telp: {sale.outlet.phone}</div>}
                    </div>

                    <div className="border-b-2 border-black my-2"></div>

                    {/* TRANSACTION META */}
                    <div className="text-[11px] space-y-0.5">
                        <div>No Nota : <span className="font-bold">{sale?.invoice_number}</span></div>
                        <div>Tgl Trans: {formattedDate}</div>
                        <div>Kasir   : {sale?.cashier?.name || 'Kasir Store'}</div>
                        {sale?.customer && <div>Pembeli : {sale.customer.name}</div>}
                    </div>

                    <div className="border-b border-dashed border-black my-2"></div>

                    {/* SHOPPING ITEMS */}
                    <div className="font-bold text-[11px] uppercase">ITEM BELANJAAN:</div>
                    <div className="space-y-1 text-[11px]">
                        {(sale?.items || []).map((item, idx) => (
                            <div key={idx} className="space-y-0.5">
                                <div className="font-bold break-words">{item.product_name_snapshot || item.name}</div>
                                <div className="flex justify-between text-slate-800">
                                    <span>{item.quantity} x Rp {Number(item.price_snapshot || item.price || 0).toLocaleString('id-ID')}</span>
                                    <span className="font-bold">Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-b border-dashed border-black my-2"></div>

                    {/* TOTALS & SUMMARY */}
                    <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>Rp {Number(sale?.subtotal || 0).toLocaleString('id-ID')}</span>
                        </div>

                        {Number(sale?.discount_amount) > 0 && (
                            <div className="flex justify-between text-rose-700">
                                <span>Diskon</span>
                                <span>-Rp {Number(sale.discount_amount).toLocaleString('id-ID')}</span>
                            </div>
                        )}

                        {Number(sale?.tax_amount) > 0 && (
                            <div className="flex justify-between">
                                <span>PPN ({sale?.outlet?.tax_percentage || 11}%)</span>
                                <span>Rp {Number(sale.tax_amount).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-b-2 border-black my-2"></div>

                    {/* GRAND TOTAL */}
                    <div className="space-y-1 text-[12px]">
                        <div className="flex justify-between font-bold text-sm">
                            <span>TOTAL BAYAR</span>
                            <span>Rp {Number(sale?.grand_total || 0).toLocaleString('id-ID')}</span>
                        </div>

                        {(sale?.payments || []).map((p, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                                <span>Bayar ({strtoupper(p.payment_method)})</span>
                                <span>Rp {Number(p.amount || 0).toLocaleString('id-ID')}</span>
                            </div>
                        ))}

                        <div className="flex justify-between font-bold text-[12px] pt-0.5">
                            <span>Kembali</span>
                            <span>Rp {Number(sale?.change_amount || 0).toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="border-b-2 border-black my-2"></div>

                    {/* FOOTER */}
                    <div className="text-center text-[10px] space-y-0.5 pt-1">
                        <div>Terima Kasih Telah Berbelanja!</div>
                        <div>Simpan Struk Ini Sebagai Bukti</div>
                        <div>Barang Yang Sudah Dibeli</div>
                        <div>Tidak Dapat Ditukar/Dikembalikan</div>
                    </div>
                </div>
            </div>

        </div>
    );
}

function strtoupper(str: string): string {
    return (str || '').toUpperCase();
}
