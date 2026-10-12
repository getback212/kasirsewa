<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Notification\NotificationDispatcherService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NotificationDispatcherServiceTest extends TestCase
{
    private function ownerFor(Tenant $tenant): User
    {
        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'phone' => '081234567890',
            'is_active' => true,
        ]);

        return $owner;
    }

    #[Test]
    public function a_gateway_failure_is_logged_as_failed_not_success(): void
    {
        config()->set('services.wa.api_key', 'test-wa-key');
        config()->set('services.wa.gateway_url', 'http://kasirsewa_whatsapp:3001/send');

        $tenant = Tenant::factory()->create(['status' => 'active']);
        $owner = $this->ownerFor($tenant);

        // The gateway rejects the request (wrong key / session down).
        Http::fake(['*' => Http::response(['success' => false, 'message' => 'Unauthorized API key'], 401)]);

        Log::shouldReceive('error')
            ->once()
            ->with('WA_BILLING_REMINDER_FAILED', \Mockery::on(fn ($ctx) => ($ctx['status'] ?? null) === 401));
        // A non-2xx must never be reported as a success.
        Log::shouldReceive('info')->never()->with('WA_BILLING_REMINDER_SENT_SUCCESS', \Mockery::any());
        // Email mocking is out of scope; allow anything else.
        Log::shouldReceive('info')->with(\Mockery::any(), \Mockery::any())->zeroOrMoreTimes();
        Log::shouldReceive('error')->with(\Mockery::any(), \Mockery::any())->zeroOrMoreTimes();

        NotificationDispatcherService::dispatch(
            tenantId: $tenant->id,
            userId: $owner->id,
            type: 'SUBSCRIPTION_REMINDER',
            title: 'Pengingat Tagihan SaaS (H-3)',
            message: 'Uji fail-closed.',
            owner: $owner,
        );

        // The in-app notification still lands even when WhatsApp fails.
        $this->assertSame(1, Notification::where('tenant_id', $tenant->id)->count());
    }

    #[Test]
    public function no_whatsapp_call_is_made_when_the_api_key_is_empty(): void
    {
        config()->set('services.wa.api_key', '');
        config()->set('services.wa.gateway_url', 'http://kasirsewa_whatsapp:3001/send');

        $tenant = Tenant::factory()->create(['status' => 'active']);
        $owner = $this->ownerFor($tenant);

        Http::fake(['*' => Http::response(['success' => true], 200)]);

        NotificationDispatcherService::dispatch(
            tenantId: $tenant->id,
            userId: $owner->id,
            type: 'SUBSCRIPTION_REMINDER',
            title: 'Pengingat Tagihan SaaS (H-7)',
            message: 'Tanpa kanal WhatsApp.',
            owner: $owner,
        );

        Http::assertNothingSent();
        // In-app remains active regardless.
        $this->assertSame(1, Notification::where('tenant_id', $tenant->id)->count());
    }
}