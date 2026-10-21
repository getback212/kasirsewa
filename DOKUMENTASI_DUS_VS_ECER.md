# Panduan Workaround: Barang DUS vs ECER di KasirSewa

**Status**: Dokumentasi untuk workaround dengan sistem unit saat ini (v1.0)  
**Tanggal**: 2026-10-21  
**Audience**: Owner Tenant, Admin Toko  

---

## ⚠️ Limitasi Saat Ini

KasirSewa v1 **hanya support 1 unit per product**. Jika barang masuk DUS dengan harga berbeda per ECER:

| Aspek | Status |
|-------|--------|
| Multiple unit per product | ❌ Tidak ada |
| Konversi DUS → ECER otomatis | ❌ Manual |
| Harga berbeda DUS vs ECER | ⚠️ Workaround saja |
| Stock normalisasi | ❌ Perlu manual |

---

## 📋 Strategi Workaround (Pilih Salah Satu)

### **Opsi A: 1 Product = 1 Satuan (RECOMMENDED untuk bisnis kecil)**

**Prinsip**: Gunakan satuan TERKECIL sebagai base unit.

**Contoh:**
- Barang: Minyak Goreng
- Supplier: 1 Dus = 12 Botol (Pcs)
- Pilihan satuan: **PCS** (bukan DUS)

**Implementasi:**

1. **Setup Unit di Master Data:**
   ```
   Menu → Settings/Master → Units
   Buat unit: "Botol" (short: "Btl")
   ```

2. **Input Product:**
   ```
   Nama: Minyak Goreng Kemasan Botol
   SKU: MGK-001
   Unit: Botol
   Harga Beli: Rp 10.000 (per botol)
   Harga Jual: Rp 11.000 (per botol)
   Minimum Stock: 60 (= 5 Dus × 12 Btl)
   ```

3. **Input Pembelian dari Supplier:**
   ```
   Supplier: PT ABC Distributor
   Product: Minyak Goreng Kemasan Botol
   Qty: 120 (= 10 Dus × 12 Btl)
   Unit: Botol
   Harga Beli: Rp 10.000/Botol
   ```
   ✅ Stock akan tercatat: 120 Botol

4. **Jual di POS:**
   ```
   Pelanggan minta 1 Dus (12 Botol)
   POS: input qty 12, unit Botol
   Sistem catat: -12 Botol
   ```

**Keuntungan:**
- ✅ Stock akurat per satuan terkecil
- ✅ Harga jual per unit konsisten
- ✅ Simple, tidak perlu konversi manual

**Kerugian:**
- ❌ Qty lebih besar di form (120 bukan 10)
- ❌ Owner harus hitung DUS → satuan saat order

---

### **Opsi B: 2 Products = 2 Unit (Untuk tracking detail)**

**Prinsip**: Buat 2 product terpisah - satu unit DUS, satu unit ECER.

**Contoh:**

1. **Setup Units:**
   ```
   Unit 1: "Dus" (short: "Dus")
   Unit 2: "Pcs" (short: "Pcs")
   ```

2. **Buat 2 Products:**

   **Product 1 (Wholesale/Pembelian):**
   ```
   Nama: Minyak Goreng Kemasan Botol [DUS]
   SKU: MGK-001-DUS
   Unit: Dus
   Harga Beli: Rp 120.000/Dus
   Harga Jual: Rp 135.000/Dus (jika reseller beli dus)
   Minimum Stock: 5 (dus)
   ```

   **Product 2 (Retail/POS):**
   ```
   Nama: Minyak Goreng Kemasan Botol [ECER]
   SKU: MGK-001-PCS
   Unit: Pcs
   Harga Beli: Rp 10.000/Pcs (120.000÷12)
   Harga Jual: Rp 11.000/Pcs
   Minimum Stock: 60 (= 5 dus × 12 pcs)
   ```

3. **Workflow:**
   - **Pembelian**: Gunakan SKU `MGK-001-DUS` (qty 10 Dus)
   - **POS Ecer**: Gunakan SKU `MGK-001-PCS` (qty 12 Pcs)
   - **Manual Update Stock**: Setiap 1 Dus terjual, kurangi:
     - `MGK-001-DUS`: -1
     - `MGK-001-PCS`: -12

**Keuntungan:**
- ✅ Tracking pembelian vs penjualan terpisah
- ✅ Laporan detail DUS vs ECER

**Kerugian:**
- ❌ **RISKY**: Mudah desinkronisasi (lupa update salah satu)
- ❌ Double entry, error-prone
- ❌ Stock report bisa tidak match

**⚠️ HATI-HATI**: Pilih opsi ini hanya jika:
- Ada staff khusus untuk update stock
- Inventory check rutin (daily/weekly)

---

### **Opsi C: Hybrid - Catat di Catatan (Minimal)**

**Prinsip**: Gunakan product 1 unit, catat DUS di description/catatan.

**Implementasi:**

```
Product Setup (sama Opsi A):
Nama: Minyak Goreng Kemasan Botol
SKU: MGK-001
Unit: Botol
Harga Beli: Rp 10.000
Harga Jual: Rp 11.000
Description: "Supplier: PT ABC. 1 Dus = 12 Botol. Min order: 10 Dus (120 Botol)"
```

**Workflow Pembelian:**
```
Pembeli/Owner baca description:
"Mau 10 Dus → input qty 120 Botol"
```

**Keuntungan:**
- ✅ Stock akurat (1 unit system)
- ✅ Sederhana

**Kerugian:**
- ❌ Owner harus hitung manual
- ❌ Tidak ada enforcement di sistem

---

## 🎯 Rekomendasi Berdasarkan Tipe Bisnis

| Tipe Bisnis | Rekomendasi | Alasan |
|-------------|-------------|--------|
| **Warung Kecil** (1-2 outlet, stok manual) | Opsi A | Simple, tidak kompleks |
| **Toko Retail** (DUS beli/ECER jual saja) | Opsi A | Tracking jelas, stock akurat |
| **Distributor/Grosir** (track DUS vs ECER ketat) | **Tunggu Feature Update** | Opsi B terlalu risky |
| **Multi-outlet** (perlu sync stock DUS/ECER) | **Tunggu Feature Update** | Perlu product units (v2) |

---

## 📝 Contoh Setup Praktis: Toko Retail Ecer

**Skenario**: Warung retail yang beli dari distributor per DUS, jual ECER ke konsumen.

### Master Setup:

**1. Unit Master:**
```
Unit 1: Pcs (Satuan)
Unit 2: Botol (khusus minuman)
Unit 3: Pack (khusus snack/cemilan)
```

**2. Contoh Product:**

```
Product A: Minyak Goreng Pertamina Botol 1L
├─ SKU: MGK-PERTAMINA-001
├─ Unit: Botol
├─ Purchase Price: Rp 10.500/Botol
├─ Selling Price: Rp 12.000/Botol
├─ Min Stock: 60 (5 dus × 12 botol)
└─ Description: "Distributor: PT ABC | 1 Dus = 12 Botol | Harga beli/dus: Rp 126.000"

Product B: Indomie Rasa Goreng
├─ SKU: IND-GORENG-001
├─ Unit: Pack
├─ Purchase Price: Rp 1.850/Pack
├─ Selling Price: Rp 2.500/Pack
├─ Min Stock: 200 (5 dus × 40 pack)
└─ Description: "Distributor: PT DEF | 1 Dus = 40 Pack | Harga beli/dus: Rp 74.000"
```

### Workflow Pembelian:

**Saat terima PO dari distributor:**
```
Keterangan: "Kira2 beli 5 Dus Minyak Goreng"

Di Sistem KasirSewa:
1. Buka Pembelian → Tambah Product "Minyak Goreng Pertamina Botol 1L"
2. Input:
   ├─ Qty: 60 (= 5 Dus × 12 Botol)
   ├─ Unit: Botol
   ├─ Harga Satuan: Rp 10.500/Botol
   └─ Total: Rp 630.000 (= 5 Dus × 126.000)
3. Submit ✅
```

**Stock akan bertambah: 60 Botol**

### Workflow POS (Penjualan):

**Saat penjualan:**
```
Konsumen: "Mau 1 botol minyak + 2 pack indomie"

Di POS:
1. Scan/Cari: Minyak Goreng → Qty 1
2. Scan/Cari: Indomie Goreng → Qty 2
3. Total: Rp 12.000 + (2.500 × 2) = Rp 17.000
4. Bayar ✅
```

**Stock akan berkurang: -1 Botol, -2 Pack**

---

## 🔍 Validasi Stock (Penting!)

Karena tidak ada otomatis konversi DUS ↔ ECER, lakukan:

### Daily Stock Check:

```
Setiap hari pukul 17:00:
1. Buka Inventory → Stock Count
2. Pilih outlet
3. Filter: "Minimum Alert" (merah)
4. Lihat physical vs sistem
5. Jika beda > 5 unit → audit penjualan hari itu
```

### Weekly Inventory Opname:

```
Setiap Jumat:
1. Hitung stock fisik semua barang
2. Bandingkan dengan sistem
3. Jika ada barang:
   - DUS di gudang = berapa Pcs?
   - Catat di laporan
   - Adjust di sistem jika ada varian
```

### Template Laporan:

```
LAPORAN STOCK DUS vs ECER - [Outlet] [Tanggal]

Barang: Minyak Goreng Pertamina Botol 1L
├─ Sistem: 48 Botol = 4 Dus + 0 Botol
├─ Fisik Gudang:
│  ├─ Dus utuh: 4
│  ├─ Botol lepas: 0
│  └─ Total fisik: 4 Dus 0 Botol = 48 Botol ✓
└─ Status: MATCH ✅

Barang: Indomie Rasa Goreng
├─ Sistem: 178 Pack = 4 Dus + 18 Pack
├─ Fisik Gudang:
│  ├─ Dus utuh: 4
│  ├─ Pack lepas: 20
│  └─ Total fisik: 4 Dus 20 Pack = 180 Pack
└─ Status: VARIAN +2 Pack (kemungkinan barang rusak/hilang) ⚠️
```

---

## ⚡ Tips Efisiensi

### 1. **Gunakan Barcode untuk Pcs**
```
Jangan: Scan barcode dus → manual input qty 12
Lakukan: 
  - Buka kemasan dus
  - Scan barcode per botol
  - Qty auto-accumulate
```

### 2. **Naming Convention Jelas**
```
❌ Buruk: "Minyak"
✅ Baik: "Minyak Goreng Pertamina Botol 1L - ECER"
```

### 3. **Description = Info Supplier**
```
✅ Lengkap:
"Supplier: PT ABC Distributor
Kontak: 0812-1234-5678
Konversi: 1 Dus = 12 Botol
Harga Dus: Rp 126.000
Lead Time: 2-3 hari"
```

### 4. **Minimum Stock = Aman**
```
Jika: Jual rata-rata 50 Botol/hari
Min stock: 60 Botol (1-2 hari cadangan)
```

### 5. **Order Gudang = Multiple of Dus**
```
Belanja: 10 Dus = 120 qty di sistem
Catatan: "Order PO: 10 Dus dari PT ABC"
```

---

## 🚨 Potential Issues & Solusi

| Issue | Penyebab | Solusi |
|-------|---------|--------|
| Stock tidak match | Manual hitung salah | Daily count, update sistem |
| Lupa catat 1 Dus jadi ECER | Tidak ada enforcement | Rutin audit gudang |
| Duplikat product DUS + ECER | Pakai Opsi B | Stick dengan Opsi A |
| Harga tidak konsisten | Update manual di banyak tempat | Ganti product, delete yang lama |
| Report tidak akurat | Data entry salah | Weekly inventory check |

---

## 📅 Roadmap Feature Upgrade (v2.0)

Fitur yang akan datang untuk solve limitasi:

```
Q4 2026 - Product Units (Multiple Unit Support):
├─ 1 Product → Multiple Units + Harga
├─ Auto-konversi DUS ↔ ECER
├─ Stock normalized ke base unit
└─ Pilih unit di POS/Pembelian

Contoh:
Product: Minyak Goreng
├─ Unit 1: Botol (Rp 10.500) ← base unit
├─ Unit 2: Dus (Rp 126.000 = 12 × 10.500)
│  └─ Conversion: 1 Dus = 12 Botol
└─ Stock: 120 Botol (= 10 Dus)
```

---

## 📞 Dukungan

**Ada pertanyaan tentang workaround?**
- Hubungi: support@kasirsewa.com
- Docs: https://docs.kasirsewa.com/units
- Chat: Telegram @kasirsewa_support

**Sudah siap upgrade ke Product Units?**
- Feature akan tersedia Q4 2026
- Akan ada migration guide dari v1 → v2
