import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { PageProps } from '@/Types';

interface ReceiptPageProps extends PageProps {
    sale: {
        id: number;
        invoice_number: string;
        grand_total: number;
        paid_amount: number;
        change_amount: number;
        sale_date: string;
        items: any[];
        payments: any[];
        outlet?: { name: string; address?: string; phone?: string };
        cashier?: { name: string };
        customer?: { name: string };
    };
    textReceipt58: string;
    textReceipt80: string;
}

export default function ReceiptPage({ sale, textReceipt58, textReceipt80 }: ReceiptPageProps) {
    const [paperWidth, setPaperWidth] = useState<58 | 80>(58);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col items-center justify-center font-sans print:bg-white print:p-0 print:m-0 print:min-h-0">
            <Head title={`Struk Thermal #${sale.invoice_number}`} />

            {/* PRINT CSS OVERRIDE STYLES FOR THERMAL PRINTER HARDWARE (58mm Roll: 58x210mm) */}
            <style font-sans="true">{`
                @media print {
                    @page {
                        size: ${paperWidth === 58 ? '48mm' : '72mm'} auto;
                        margin: 0mm;
                    }
                    html, body {
                        width: ${paperWidth === 58 ? '48mm' : '72mm'} !important;
                        background-color: #ffffff !important;
                        color: #000000 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .printable-receipt {
                        width: ${paperWidth === 58 ? '48mm' : '72mm'} !important;
                        max-width: ${paperWidth === 58 ? '48mm' : '72mm'} !important;
                        padding: 0mm !important;
                        margin: 0 auto !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        border: none !important;
                        color: #000000 !important;
                        background: #ffffff !important;
                    }
                    .printable-pre {
                        font-family: 'Consolas', 'Courier New', Courier, monospace !important;
                        font-size: ${paperWidth === 58 ? '9.5px' : '11.5px'} !important;
                        line-height: 1.25 !important;
                        letter-spacing: -0.2px !important;
                        white-space: pre !important;
                        overflow: visible !important;
                        word-break: normal !important;
                        text-align: left !important;
                        margin: 0 auto !important;
                        font-weight: 700 !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-lg space-y-6 no-print">
                
                {/* TOOLBAR BUTTONS (HIDDEN WHEN PRINTING) */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl gap-4">
                    <Link
                        href="/pos"
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                        <ArrowLeft className="w-4 h-4 text-emerald-400" /> Kembali Ke Kasir
                    </Link>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            onClick={() => setPaperWidth(58)}
                            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                                paperWidth === 58 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white'
                            }`}
                        >
                            58mm
                        </button>
                        <button
                            onClick={() => setPaperWidth(80)}
                            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                                paperWidth === 80 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white'
                            }`}
                        >
                            80mm
                        </button>

                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
                        >
                            <Printer className="w-4 h-4" /> Cetak Struk
                        </button>
                    </div>
                </div>

                <div className="text-center text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5 bg-slate-900/50 p-2.5 rounded-2xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Presisi Matriks Thermal ESC/POS ({paperWidth}mm - Anti Patah Angka)</span>
                </div>

            </div>

            {/* THERMAL RECEIPT DISPLAY & PRINT CONTAINER */}
            <div className="flex justify-center items-center w-full my-4">
                <div
                    className={`printable-receipt bg-white text-black px-6 py-5 font-mono text-[11px] leading-tight rounded-2xl shadow-2xl border border-slate-300 flex flex-col items-center justify-center text-center ${
                        paperWidth === 58 ? 'w-[300px]' : 'w-[400px]'
                    }`}
                >
                    <pre className="printable-pre whitespace-pre font-mono tracking-tighter text-black mx-auto inline-block text-left">
                        {paperWidth === 58 ? textReceipt58 : textReceipt80}
                    </pre>
                </div>
            </div>

        </div>
    );
}
