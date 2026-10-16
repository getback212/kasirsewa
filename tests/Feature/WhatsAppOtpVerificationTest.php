<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WhatsAppOtpVerificationTest extends TestCase
{
    /**
     * Point both the OTP controller and the dispatcher at a deterministic
     * gateway URL so the test never depends on an environment default
     * (the code no longer hardcodes a host IP).
     */
    private function fakeGateway(string $url = 'http://wa-gateway.test/send'): void
    {
        config([
            'services.wa.gateway_url' => $url,
            'services.wa.api_key' => 'test-api-key',
        ]);
    }

    public function test_google_user_can_view_otp_page_send_otp_and_verify_whatsapp()
    {
        $this->seed(RolePermissionSeeder::class);
        $this->fakeGateway();

        $googleUser = User::factory()->create([
            'google_id' => '123456789',
            'phone' => '081234567890',
            'phone_verified_at' => null,
        ]);
        $googleUser->assignRole(UserRole::OWNER->value);

        // 1. Can view OTP page
        $response = $this->actingAs($googleUser)->get('/verify-otp');
        $response->assertStatus(200);

        // 2. Sends the OTP through the configured WhatsApp gateway.
        Http::fake([
            'http://wa-gateway.test/send' => Http::response(['success' => true], 200),
        ]);

        $sendResponse = $this->actingAs($googleUser)->post('/verify-otp/send', [
            'phone' => '085236267731',
        ]);
        $sendResponse->assertSessionHas('success');
        Http::assertSent(function ($request) {
            return $request->url() === 'http://wa-gateway.test/send'
                && $request['target'] === '6285236267731'
                && isset($request['message']);
        });

        $googleUser->refresh();
        $this->assertNotNull($googleUser->phone_otp);
        $this->assertEquals(6, strlen($googleUser->phone_otp));

        // 3. Can verify OTP code
        $verifyResponse = $this->actingAs($googleUser)->post('/verify-otp/verify', [
            'otp' => $googleUser->phone_otp,
        ]);
        $verifyResponse->assertRedirect('/dashboard');

        $this->assertNotNull($googleUser->fresh()->phone_verified_at);
    }

    public function test_cashier_can_send_otp_and_verify_whatsapp_redirecting_to_pos()
    {
        $this->seed(RolePermissionSeeder::class);
        $this->fakeGateway();

        $cashier = User::factory()->create([
            'phone' => '081299998888',
            'phone_verified_at' => null,
        ]);
        $cashier->assignRole(UserRole::CASHIER->value);

        $response = $this->actingAs($cashier)->get('/verify-otp');
        $response->assertStatus(200);

        Http::fake([
            'http://wa-gateway.test/send' => Http::response(['success' => true], 200),
        ]);

        $sendResponse = $this->actingAs($cashier)->post('/verify-otp/send', [
            'phone' => '085236267731',
        ]);
        $sendResponse->assertSessionHas('success');
        Http::assertSent(fn ($request) => $request->url() === 'http://wa-gateway.test/send');

        $cashier->refresh();
        $this->assertNotNull($cashier->phone_otp);

        $verifyResponse = $this->actingAs($cashier)->post('/verify-otp/verify', [
            'otp' => $cashier->phone_otp,
        ]);
        $verifyResponse->assertRedirect('/pos');

        $this->assertNotNull($cashier->fresh()->phone_verified_at);
    }

    /**
     * The OTP gateway lives outside our trust boundary. A 401/5xx means the
     * message was NOT delivered, so the user must not be told it was sent.
     */
    public function test_otp_send_fails_closed_when_the_gateway_rejects_the_message()
    {
        $this->seed(RolePermissionSeeder::class);
        $this->fakeGateway();

        $user = User::factory()->create([
            'phone' => '081200001111',
            'phone_verified_at' => null,
        ]);
        $user->assignRole(UserRole::OWNER->value);

        Http::fake([
            'http://wa-gateway.test/send' => Http::response(['success' => false, 'message' => 'Unauthorized API key'], 401),
        ]);

        $response = $this->actingAs($user)->post('/verify-otp/send', [
            'phone' => '085236267731',
        ]);

        $response->assertSessionHas('error');
        $response->assertSessionMissing('success');
    }

    /**
     * A transport failure (DNS, connection refused, timeout) is just as much a
     * non-delivery and must also be reported honestly, via the catch branch.
     */
    public function test_otp_send_fails_closed_when_the_gateway_is_unreachable()
    {
        $this->seed(RolePermissionSeeder::class);
        $this->fakeGateway('http://unreachable-gateway.invalid/send');

        $user = User::factory()->create([
            'phone' => '081200002222',
            'phone_verified_at' => null,
        ]);
        $user->assignRole(UserRole::OWNER->value);

        Http::fake([
            'http://unreachable-gateway.invalid/*' => fn () => throw new ConnectionException('Connection refused'),
        ]);

        $response = $this->actingAs($user)->post('/verify-otp/send', [
            'phone' => '085236267731',
        ]);

        $response->assertSessionHas('error');
        $response->assertSessionMissing('success');
    }
}
