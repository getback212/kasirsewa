<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SubscriptionTrialExpiryCommandTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        // Wire the WhatsApp gateway config so billing reminders can dispatch.
        config()->set('services.wa.api_key', 'test-wa-key');
        config()->set('services.wa.gateway_url', 'http://kasirsewa_whatsapp:3001/send');
    }

    #[Test]
    public function command_sends_trial_h1_reminder_via_whatsapp()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $plan = Plan::factory()->create([
            'name' => 'Starter',
            'monthly_price' => 99000,
            'max_stores' => 1,
            'max_users' => 3,
            'max_products' => 500,
        ]);

        $tenant = Tenant::factory()->create(['status' => 'active']);
        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'phone' => '081234567890',
            'is_active' => true,
        ]);
        $owner->assignRole('OWNER');
        $tenant->update(['owner_id' => $owner->id]);

        $subscription = Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'trial',
            'trial_ends_at' => now()->addDay(),
            'expires_at' => now()->addDay(),
        ]);

        Http::fake([
            '*' => Http::response(['success' => true], 200),
        ]);

        $this->artisan('app:check-subscription-expiry')
            ->expectsOutput('Mengawali pemeriksaan rutin subskripsi & trial SaaS...')
            ->assertSuccessful();

        // WA reminder should be sent for trial expiring in 1 day
        Http::assertSent(function ($request) use ($owner) {
            $body = $request->data();
            return isset($body['target']) && str_contains($body['target'], '81234567890')
                && isset($body['message']) && str_contains($body['message'], 'Pengingat Tagihan SaaS (H-1)');
        });
    }

    #[Test]
    public function command_expires_trial_and_sends_expired_notification()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $plan = Plan::factory()->create([
            'name' => 'Starter',
            'monthly_price' => 99000,
            'max_stores' => 1,
            'max_users' => 3,
            'max_products' => 500,
        ]);

        $tenant = Tenant::factory()->create(['status' => 'active']);
        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'phone' => '081299998888',
            'is_active' => true,
        ]);
        $owner->assignRole('OWNER');
        $tenant->update(['owner_id' => $owner->id]);

        $subscription = Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'trial',
            'trial_ends_at' => now()->subMinute(),
            'expires_at' => now()->subMinute(),
        ]);

        Http::fake([
            '*' => Http::response(['success' => true], 200),
        ]);

        $this->artisan('app:check-subscription-expiry')
            ->assertSuccessful();

        $subscription->refresh();
        $this->assertEquals('expired', $subscription->status);

        // WA expired notification should be sent
        Http::assertSent(function ($request) use ($owner) {
            $body = $request->data();
            return isset($body['target']) && str_contains($body['target'], '81299998888')
                && isset($body['message']) && str_contains($body['message'], 'Masa Aktif Berlangganan Berakhir');
        });
    }

    #[Test]
    public function command_does_not_duplicate_reminder_for_same_subscription()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $plan = Plan::factory()->create([
            'name' => 'Starter',
            'monthly_price' => 99000,
            'max_stores' => 1,
            'max_users' => 3,
            'max_products' => 500,
        ]);

        $tenant = Tenant::factory()->create(['status' => 'active']);
        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'phone' => '081234567890',
            'is_active' => true,
        ]);
        $owner->assignRole('OWNER');
        $tenant->update(['owner_id' => $owner->id]);

        Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'trial',
            'trial_ends_at' => now()->addDay(),
            'expires_at' => now()->addDay(),
        ]);

        Http::fake([
            '*' => Http::response(['success' => true], 200),
        ]);

        // Run twice
        $this->artisan('app:check-subscription-expiry')->assertSuccessful();
        $this->artisan('app:check-subscription-expiry')->assertSuccessful();

        // WA should only be sent once for H-1 reminder
        $sentCount = collect(Http::recorded())->filter(function ($record) {
            $body = $record[0]->data();
            return isset($body['message']) && str_contains($body['message'], 'Pengingat Tagihan SaaS (H-1)');
        })->count();

        $this->assertEquals(1, $sentCount);
    }
}
