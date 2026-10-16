<?php

namespace Tests\Feature;

use App\Models\SaaSSetting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NotificationTestSendTest extends TestCase
{
    private function superAdmin(): User
    {
        return User::where('email', 'admin@example.com')->firstOrFail();
    }

    public function test_send_reports_real_whatsapp_success(): void
    {
        config()->set('services.wa.api_key', 'test-wa-key');
        config()->set('services.wa.gateway_url', 'http://kasirsewa_whatsapp:3001/send');
        Http::fake(['*' => Http::response(['success' => true], 200)]);

        $response = $this->actingAs($this->superAdmin())
            ->post('/admin/notification-settings/test', ['test_phone' => '081234567890']);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertStringContainsString(
            '6281234567890',
            (string) session('success'),
            'Flash sukses wajib menyebut nomor WA tujuan yang dinormalisasi.'
        );
    }

    public function test_send_reports_gateway_failure_honestly(): void
    {
        config()->set('services.wa.api_key', 'test-wa-key');
        config()->set('services.wa.gateway_url', 'http://kasirsewa_whatsapp:3001/send');
        Http::fake(['*' => Http::response(['success' => false], 503)]);

        $response = $this->actingAs($this->superAdmin())
            ->post('/admin/notification-settings/test', ['test_phone' => '081234567890']);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $response->assertSessionMissing('success');
    }

    public function test_send_without_any_target_number_skips_whatsapp(): void
    {
        config()->set('services.wa.api_key', 'test-wa-key');
        config()->set('services.wa.gateway_url', 'http://kasirsewa_whatsapp:3001/send');
        SaaSSetting::set('wa_cs_number', '');
        Http::fake(['*' => Http::response(['success' => true], 200)]);

        $response = $this->actingAs($this->superAdmin())
            ->post('/admin/notification-settings/test', ['test_phone' => '']);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        Http::assertNothingSent();
    }
}
