# Pengaturan Subdomain & Custom Domain Toko

Fitur "Kelola alamat subdomain bawaan SaaS atau pasang domain pribadi toko Anda"
(kartu *Pengaturan Subdomain & Custom Domain Toko* di `/outlets`). Ada **dua jenis**
alamat, dan keduanya sengaja ditangani berbeda.

## 1. Subdomain SaaS — otomatis aktif

`<label>.superbackend.my.id` (mis. `toko-berkah.superbackend.my.id`).

Wildcard DNS `*` dan ingress tunnel sudah menutup **setiap** nama di bawah
`superbackend.my.id` (lihat `docs/cloudflare-tunnel.md`). Karena itu:

- begitu Owner menyimpan nama tersebut, alamat **langsung aktif**;
- `domain_type = saas_subdomain`, `domain_status = active` seketika;
- tidak ada DNS yang perlu diurus tenant, tidak ada sertifikat khusus.

Aturan label (dari `App\Support\TenantDomain`): hostname valid, huruf kecil,
tanpa skema/path/port/IP, dan label cadangan (`www`, `api`, `admin`, `saas`,
`mail`, `cdn`, …) ditolak.

## 2. Domain pribadi — butuh Cloudflare for SaaS

Domain milik tenant sendiri (mis. `tokoberkah.com`) **tidak** bisa hanya dengan
CNAME ke `superbackend.my.id`, dan **tidak** bisa diarahkan ke IP VPS: VPS tidak
membuka port 80/443 (akses hanya lewat Cloudflare Tunnel). Sertifikat TLS untuk
domain pihak ketiga harus diterbitkan Cloudflare for SaaS (custom hostname).

Alurnya:

1. Owner menyimpan domain pribadinya.
2. Aplikasi mendaftarkan *custom hostname* ke Cloudflare dan mencatat id-nya
   (`custom_hostname_id`).
3. UI menampilkan record CNAME yang harus dibuat tenant, yaitu ke
   `CLOUDFLARE_CUSTOM_DOMAIN_TARGET` (mis. `customers.superbackend.my.id`).
4. Setelah DNS tersebar, Owner menekan **Cek Status Domain**
   (`POST /outlets/domain/refresh`) untuk membaca status terbaru.
5. Alamat baru ditandai `active` **hanya jika** Cloudflare melaporkan hostname
   atau status SSL-nya `active`.

### Status yang mungkin

| Status        | Arti                                                        |
| ------------- | ----------------------------------------------------------- |
| `active`      | Alamat benar-benar bisa dipakai (sertifikat ada)            |
| `pending_dns` | Domain tersimpan; menunggu DNS/verifikasi tenant            |
| `failed`      | Cloudflare menolak atau menghentikan penerbitan sertifikat  |
| `none`        | Belum ada domain diatur                                     |

**Fail-safe:** tanpa `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID`, domain
pribadi tetap disimpan sebagai `pending_dns` dan pesan yang tampil jujur bahwa
domain belum aktif — aplikasi tidak pernah menandai domain `active` hanya karena
baris di database sudah terisi.

## Variabel lingkungan operator

```dotenv
CLOUDFLARE_API_TOKEN=            # token dengan izin SSL and Certificates:Edit + Zone:Custom Hostnames:Edit
CLOUDFLARE_ZONE_ID=              # zona superbackend.my.id
CLOUDFLARE_CUSTOM_DOMAIN_TARGET= # target CNAME, mis. customers.superbackend.my.id
```

Prasyarat di sisi Cloudflare (sekali, oleh operator): zona `superbackend.my.id`
diaktifkan sebagai **SaaS provider** (Cloudflare for SaaS / custom hostnames),
dan *fallback origin* untuk custom hostname diarahkan ke endpoint tunnel.

## Keamanan

Middleware `TenantDomainResolver` **hanya** mengikat tenant untuk domain pribadi
yang berstatus `active`. Domain yang masih `pending_dns`/`failed` tidak
menghasilkan sesi tenant, sehingga Host header palsu tidak bisa dipakai untuk
masuk ke konteks sebuah toko. Perubahan domain dicatat di audit log
(`TENANT_DOMAIN_UPDATE`, `TENANT_DOMAIN_REFRESH`).

## Berkas terkait

- `app/Services/Domain/TenantDomainProvisioner.php` — klasifikasi + provisioning.
- `app/Support/TenantDomain.php` — normalisasi/validasi label + `isBaseHost()`.
- `app/Http/Middleware/TenantDomainResolver.php` — resolusi host → tenant.
- `app/Http/Controllers/Outlet/OutletController.php` — `updateDomain`, `refreshDomain`.
- `resources/js/Pages/Outlets/Index.tsx` — kartu UI, badge status, tombol Cek Status.
- `tests/Feature/TenantDomainProvisioningTest.php` — cakupan provisioning + fail-safe.
