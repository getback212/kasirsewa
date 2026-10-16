<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TenantBackupTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Isolasi file: semua operasi disk backup (command + controller)
        // berjalan di fake disk, tidak pernah menyentuh storage produksi.
        Storage::fake('local');
    }

    private function ownerOfCompany1(): User
    {
        return User::where('email', 'owner@example.test')->firstOrFail();
    }

    public function test_owner_backup_contains_only_own_tenant_data(): void
    {
        $owner = $this->ownerOfCompany1();

        $response = $this->actingAs($owner)->post('/backups/run');

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $dir = "backups/tenants/tenant_{$owner->tenant_id}";
        $files = Storage::disk('local')->files($dir);
        $this->assertNotEmpty($files, 'File backup tenant tidak dibuat.');

        $raw = gzdecode(Storage::disk('local')->get($files[0]));
        $this->assertIsString($raw);

        // Data milik tenant sendiri wajib ada.
        $this->assertStringContainsString('BerkahPRO Retail Enterprise', $raw);
        $this->assertStringContainsString('owner@example.test', $raw);

        // Data tenant lain tidak boleh bocor ke file ini.
        $this->assertStringNotContainsString('Sinar Jaya Supermarket', $raw);
        $this->assertStringNotContainsString('sinarjaya@example.test', $raw);
    }

    public function test_owner_can_upload_own_valid_backup_file(): void
    {
        $owner = $this->ownerOfCompany1();

        // Buat backup valid dulu, pakai isinya sebagai file upload.
        $this->actingAs($owner)->post('/backups/run')->assertRedirect();
        $dir = "backups/tenants/tenant_{$owner->tenant_id}";
        $files = Storage::disk('local')->files($dir);
        $this->assertNotEmpty($files);
        $content = Storage::disk('local')->get($files[0]);
        $filename = basename($files[0]);

        $upload = UploadedFile::fake()->createWithContent($filename, $content);
        $response = $this->actingAs($owner)->post('/backups/upload', ['backup_file' => $upload]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertTrue(Storage::disk('local')->exists("{$dir}/{$filename}"));
    }

    public function test_owner_upload_of_tampered_file_is_rejected_and_deleted(): void
    {
        $owner = $this->ownerOfCompany1();
        $dir = "backups/tenants/tenant_{$owner->tenant_id}";

        // File racikan: pola nama benar tapi isi bukan backup tenant ini.
        $upload = UploadedFile::fake()
            ->createWithContent("tenant_{$owner->tenant_id}_backup_palsu.sql.gz", gzencode('isi palsu'));

        $response = $this->actingAs($owner)->post('/backups/upload', ['backup_file' => $upload]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertFalse(
            Storage::disk('local')->exists("{$dir}/tenant_{$owner->tenant_id}_backup_palsu.sql.gz"),
            'File racikan wajib dihapus dari storage.'
        );
    }

    public function test_owner_can_restore_own_tenant_backup(): void
    {
        $owner = $this->ownerOfCompany1();

        $this->actingAs($owner)->post('/backups/run')->assertRedirect();
        $dir = "backups/tenants/tenant_{$owner->tenant_id}";
        $files = Storage::disk('local')->files($dir);
        $this->assertNotEmpty($files);
        $filename = basename($files[0]);

        // Hapus satu produk, lalu restore: produk harus kembali.
        Product::where('sku', 'SKU-KOPI-001')->delete();
        $this->assertDatabaseMissing('products', ['sku' => 'SKU-KOPI-001']);

        $response = $this->actingAs($owner)->post("/backups/restore/{$filename}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('products', ['sku' => 'SKU-KOPI-001']);

        // Data tenant lain tidak tersentuh.
        $this->assertDatabaseHas('tenants', ['slug' => 'sinar-jaya']);
    }

    public function test_owner_cannot_restore_foreign_or_invalid_file(): void
    {
        $owner = $this->ownerOfCompany1();
        $dir = "backups/tenants/tenant_{$owner->tenant_id}";
        Storage::disk('local')->put("{$dir}/pos_backup_fake.sql.gz", gzencode('bukan backup tenant'));

        $response = $this->actingAs($owner)->post('/backups/restore/pos_backup_fake.sql.gz');

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_super_admin_keeps_upload_and_restore_access(): void
    {
        $superAdmin = User::where('email', 'admin@example.com')->firstOrFail();

        // Upload tanpa file: lolos gate (422 validasi), bukan 403.
        $this->actingAs($superAdmin)->post('/backups/upload')->assertStatus(302);

        // Restore file tak ada: lolos gate, gagal dengan pesan error (bukan 403).
        $response = $this->actingAs($superAdmin)->post('/backups/restore/tidak-ada.sql.gz');
        $response->assertRedirect();
        $response->assertSessionHas('error');
    }
}
