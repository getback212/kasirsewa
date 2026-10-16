import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, Calendar, Clock, CreditCard, ArrowRight } from 'lucide-react';

interface SubscriptionData {
    status: string;
    expires_at: string | null;
    plan_name: string | null;
    plan_price: number | null;
    billing_cycle: string;
}

interface TenantData {
    id: number;
    name: string;
}

interface Props {
    subscription: SubscriptionData | null;
    tenant: TenantData | null;
}

export default function SubscriptionExpired({ subscription, tenant }: Props) {
    const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
    const daysOverdue = expiresAt ? Math.floor((new Date().getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <>
            <Head title="Subscription Expired" />
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Header Card */}
                    <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-red-500">
                        <div className="flex justify-center mb-6">
                            <div className="bg-red-100 rounded-full p-4">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                            Masa Berlangganan Berakhir
                        </h1>
                        <p className="text-center text-gray-600 mb-6">
                            Paket langganan Anda sudah tidak aktif. Silakan lakukan perpanjangan untuk melanjutkan akses.
                        </p>

                        {/* Subscription Details */}
                        {subscription && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm">Berakhir:</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">
                                        {expiresAt?.toLocaleDateString('id-ID', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">Status:</span>
                                    </div>
                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                                        {subscription.status === 'expired' ? 'Berakhir' : 
                                         subscription.status === 'suspended' ? 'Ditangguhkan' : 
                                         subscription.status === 'cancelled' ? 'Dibatalkan' : 
                                         subscription.status}
                                    </span>
                                </div>

                                {subscription.plan_name && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <CreditCard className="w-4 h-4" />
                                            <span className="text-sm">Paket:</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">
                                            {subscription.plan_name}
                                        </span>
                                    </div>
                                )}

                                {daysOverdue > 0 && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <p className="text-sm text-red-700 font-medium">
                                            ⚠️ Telah {daysOverdue} hari tidak aktif
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Warning Message */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-yellow-800">
                                <strong>Perhatian:</strong> Semua karyawan di toko ini tidak dapat mengakses sistem POS, stok, dan fitur lainnya hingga Anda melakukan perpanjangan paket.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Link
                                href="/subscription"
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
                            >
                                Perpanjang Sekarang
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                href="/invoices"
                                className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                            >
                                Lihat Invoice
                            </Link>
                        </div>

                        {/* Support Info */}
                        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
                            <p>Butuh bantuan? Hubungi tim support kami di</p>
                            <a
                                href="https://wa.me/6285179790890?text=Saya%20ingin%20memperpanjang%20paket%20langganan"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700 font-semibold inline-block mt-2"
                            >
                                WhatsApp: 0828-5179-790890
                            </a>
                        </div>
                    </div>

                    {/* Tenant Info Footer */}
                    {tenant && (
                        <div className="mt-4 text-center text-sm text-gray-600">
                            <p>
                                Toko: <span className="font-semibold text-gray-900">{tenant.name}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
