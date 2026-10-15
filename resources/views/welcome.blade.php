<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>KasirSewa - Sistem POS Cloud untuk Bisnis Retail & F&B</title>
    <meta name="description" content="Platform POS cloud terpadu dengan billing, inventory, dan multi-outlet. Coba gratis 7 hari, akses dari mana saja, integrasi WhatsApp & payment gateway.">
    
    @fonts
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <span class="text-white font-bold text-lg">K</span>
                </div>
                <span class="font-bold text-xl">KasirSewa</span>
            </div>
            <div class="flex items-center gap-4">
                @auth
                    <a href="{{ url('/dashboard') }}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        Dashboard
                    </a>
                @else
                    <a href="{{ route('login') }}" class="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">
                        Masuk
                    </a>
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Daftar Gratis
                        </a>
                    @endif
                @endauth
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="max-w-6xl mx-auto px-6 py-20 md:py-32">
        <div class="grid md:grid-cols-2 gap-12 items-center">
            <div>
                <h1 class="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Sistem POS Cloud untuk <span class="text-blue-600">Bisnis Retail & F&B</span>
                </h1>
                <p class="text-xl text-slate-600 dark:text-slate-300 mb-8">
                    Kelola penjualan, inventory, dan multiple outlet dari satu platform. Coba gratis 7 hari tanpa perlu kartu kredit.
                </p>
                <div class="flex flex-col sm:flex-row gap-4">
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-center">
                            Mulai Trial Gratis
                        </a>
                    @endif
                    <button onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'})" class="px-6 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-900 transition font-semibold">
                        Pelajari Lebih Lanjut
                    </button>
                </div>
                <p class="text-sm text-slate-500 mt-6">✓ Gratis 7 hari • ✓ Tidak perlu kartu kredit • ✓ Setup dalam 5 menit</p>
            </div>
            <div class="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 flex items-center justify-center h-96">
                <div class="text-center">
                    <div class="text-6xl mb-4">📱</div>
                    <p class="text-slate-600 dark:text-slate-400 font-semibold">Akses dari Desktop, Tablet, atau Mobile</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="bg-slate-50 dark:bg-slate-900 py-20 md:py-32">
        <div class="max-w-6xl mx-auto px-6">
            <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">Fitur Lengkap untuk Bisnis Modern</h2>
            
            <div class="grid md:grid-cols-3 gap-8">
                <!-- Feature 1 -->
                <div class="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
                    <div class="text-4xl mb-4">🛒</div>
                    <h3 class="text-xl font-bold mb-3">Point of Sale (POS)</h3>
                    <p class="text-slate-600 dark:text-slate-300 mb-4">Transaksi cepat, pelayanan pembayaran fleksibel, support berbagai metode (cash, e-wallet, transfer bank).</p>
                    <ul class="text-sm text-slate-500 space-y-2">
                        <li>✓ Receipt digital & cetak</li>
                        <li>✓ Diskon & promo real-time</li>
                        <li>✓ Layar pembeli (customer display)</li>
                    </ul>
                </div>

                <!-- Feature 2 -->
                <div class="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
                    <div class="text-4xl mb-4">📦</div>
                    <h3 class="text-xl font-bold mb-3">Manajemen Inventory</h3>
                    <p class="text-slate-600 dark:text-slate-300 mb-4">Pantau stok otomatis, alert reorder, tracking serial produk, support kategori & variant SKU.</p>
                    <ul class="text-sm text-slate-500 space-y-2">
                        <li>✓ Barcode scanning</li>
                        <li>✓ Penyesuaian stok manual</li>
                        <li>✓ Laporan inventory real-time</li>
                    </ul>
                </div>

                <!-- Feature 3 -->
                <div class="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
                    <div class="text-4xl mb-4">💰</div>
                    <h3 class="text-xl font-bold mb-3">Billing & Invoicing</h3>
                    <p class="text-slate-600 dark:text-slate-300 mb-4">Invoice otomatis, tracking pembayaran, laporan keuangan detail, pajak terintegrasi.</p>
                    <ul class="text-sm text-slate-500 space-y-2">
                        <li>✓ Template invoice custom</li>
                        <li>✓ E-invoice & PDF</li>
                        <li>✓ Laporan penjualan harian</li>
                    </ul>
                </div>

                <!-- Feature 4 -->
                <div class="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
                    <div class="text-4xl mb-4">🏪</div>
                    <h3 class="text-xl font-bold mb-3">Multi-Outlet Management</h3>
                    <p class="text-slate-600 dark:text-slate-300 mb-4">Kelola banyak lokasi dari satu dashboard, sync data real-time antar outlet.</p>
                    <ul class="text-sm text-slate-500 space-y-2">
                        <li>✓ Izin akses per outlet</li>
                        <li>✓ Laporan konsolidasi</li>
                        <li>✓ Inventory sharing</li>
                    </ul>
                </div>

                <!-- Feature 5 -->
                <div class="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
                    <div class="text-4xl mb-4">📊</div>
                    <h3 class="text-xl font-bold mb-3">Analytics & Laporan</h3>
                    <p class="text-slate-600 dark:text-slate-300 mb-4">Dashboard interaktif, laporan penjualan, trend analisis, export data CSV/Excel.</p>
                    <ul class="text-sm text-slate-500 space-y-2">
                        <li>✓ Metrik performa harian</li>
                        <li>✓ Top produk & kategori</li>
                        <li>✓ Segmentasi customer</li>
                    </ul>
                </div>

                <!-- Feature 6 -->
                <div class="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
                    <div class="text-4xl mb-4">🔗</div>
                    <h3 class="text-xl font-bold mb-3">Integrasi & API</h3>
                    <p class="text-slate-600 dark:text-slate-300 mb-4">WhatsApp Gateway, payment gateway (Midtrans, Stripe), custom integration via API.</p>
                    <ul class="text-sm text-slate-500 space-y-2">
                        <li>✓ Notifikasi WhatsApp</li>
                        <li>✓ Pembayaran online</li>
                        <li>✓ REST API documentation</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing Section -->
    <section class="max-w-6xl mx-auto px-6 py-20 md:py-32">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-4">Paket Berlangganan</h2>
        <p class="text-center text-slate-600 dark:text-slate-300 mb-16 text-lg">Coba gratis 7 hari, upgrade kapan saja sesuai kebutuhan bisnis Anda</p>
        
        <div class="grid md:grid-cols-3 gap-8">
            <!-- Starter Plan -->
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8">
                <h3 class="text-2xl font-bold mb-2">Starter</h3>
                <p class="text-slate-600 dark:text-slate-400 mb-6">Untuk toko kecil & awal</p>
                <div class="text-4xl font-bold text-blue-600 mb-6">Rp 99K<span class="text-lg text-slate-500">/bulan</span></div>
                <ul class="space-y-3 mb-8 text-sm">
                    <li>✓ 1 outlet</li>
                    <li>✓ Unlimited produk & transaksi</li>
                    <li>✓ Laporan dasar</li>
                    <li>✓ Support email</li>
                    <li>✗ API & Custom</li>
                </ul>
                @if (Route::has('register'))
                    <a href="{{ route('register') }}" class="w-full px-6 py-2 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-900 transition font-semibold inline-block text-center">
                        Mulai Trial Gratis
                    </a>
                @endif
            </div>

            <!-- Professional Plan (Popular) -->
            <div class="bg-blue-600 text-white rounded-xl p-8 md:scale-105 shadow-xl">
                <div class="bg-blue-500 text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">POPULER</div>
                <h3 class="text-2xl font-bold mb-2">Professional</h3>
                <p class="text-blue-100 mb-6">Untuk bisnis berkembang</p>
                <div class="text-4xl font-bold mb-6">Rp 299K<span class="text-lg text-blue-100">/bulan</span></div>
                <ul class="space-y-3 mb-8 text-sm text-blue-50">
                    <li>✓ Hingga 5 outlet</li>
                    <li>✓ Unlimited produk & transaksi</li>
                    <li>✓ Laporan advanced</li>
                    <li>✓ WhatsApp notification</li>
                    <li>✓ Priority support</li>
                </ul>
                @if (Route::has('register'))
                    <a href="{{ route('register') }}" class="w-full px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold inline-block text-center">
                        Mulai Trial Gratis
                    </a>
                @endif
            </div>

            <!-- Enterprise Plan -->
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8">
                <h3 class="text-2xl font-bold mb-2">Enterprise</h3>
                <p class="text-slate-600 dark:text-slate-400 mb-6">Untuk franchise & brand besar</p>
                <div class="text-4xl font-bold text-blue-600 mb-6">Custom</div>
                <ul class="space-y-3 mb-8 text-sm">
                    <li>✓ Unlimited outlet</li>
                    <li>✓ API penuh & custom integration</li>
                    <li>✓ Advanced security & audit</li>
                    <li>✓ Dedicated account manager</li>
                    <li>✓ On-premise option</li>
                </ul>
                <a href="mailto:sales@kasirsewa.id" class="w-full px-6 py-2 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-900 transition font-semibold inline-block text-center">
                    Hubungi Sales
                </a>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16 md:py-20">
        <div class="max-w-4xl mx-auto px-6 text-center">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">Siap Tingkatkan Bisnis Anda?</h2>
            <p class="text-xl text-blue-100 mb-8">Bergabunglah dengan ribuan bisnis yang telah mempercayai KasirSewa untuk mengelola penjualan mereka.</p>
            <div class="flex flex-col sm:flex-row justify-center gap-4">
                @if (Route::has('register'))
                    <a href="{{ route('register') }}" class="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold">
                        Coba Gratis 7 Hari
                    </a>
                @endif
                <button class="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition font-semibold">
                    Lihat Demo
                </button>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-900 text-slate-300 py-12">
        <div class="max-w-6xl mx-auto px-6">
            <div class="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                    <h3 class="font-bold text-white mb-4">KasirSewa</h3>
                    <p class="text-sm">Platform POS cloud terpadu untuk retail & F&B.</p>
                </div>
                <div>
                    <h4 class="font-semibold text-white mb-4">Produk</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="#" class="hover:text-white transition">Fitur</a></li>
                        <li><a href="#" class="hover:text-white transition">Pricing</a></li>
                        <li><a href="#" class="hover:text-white transition">API Docs</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold text-white mb-4">Perusahaan</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="#" class="hover:text-white transition">Tentang Kami</a></li>
                        <li><a href="#" class="hover:text-white transition">Blog</a></li>
                        <li><a href="#" class="hover:text-white transition">Kontak</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold text-white mb-4">Legal</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="#" class="hover:text-white transition">Privasi</a></li>
                        <li><a href="#" class="hover:text-white transition">Terms</a></li>
                        <li><a href="#" class="hover:text-white transition">Security</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-slate-700 pt-8 text-center text-sm">
                <p>&copy; 2026 KasirSewa. Semua hak dilindungi.</p>
            </div>
        </div>
    </footer>
</body>
</html>
