<?php

namespace Tests\Feature;

use App\Models\User;
use App\Enums\UserRole;
use Tests\TestCase;

class WhatsAppOtpVerificationTest extends TestCase
{
    public function test_google_user_can_view_otp_page_send_otp_and_verify_whatsapp()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $googleUser = User::factory()->create([
            'google_id' => '123456789',
            'phone' => '081234567890',
            'phone_verified_at' => null,
        ]);
        $googleUser->assignRole(UserRole::OWNER->value);

        // 1. Can view OTP page
        $response = $this->actingAs($googleUser)->get('/verify-otp');
        $response->assertStatus(200);

        // 2. Can request OTP via WhatsApp
        $sendResponse = $this->actingAs($googleUser)->post('/verify-otp/send', [
            'phone' => '085236267731',
        ]);
        $sendResponse->assertRedirect();

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
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $cashier = User::factory()->create([
            'phone' => '081299998888',
            'phone_verified_at' => null,
        ]);
        $cashier->assignRole(UserRole::CASHIER->value);

        $response = $this->actingAs($cashier)->get('/verify-otp');
        $response->assertStatus(200);

        $sendResponse = $this->actingAs($cashier)->post('/verify-otp/send', [
            'phone' => '085236267731',
        ]);
        $sendResponse->assertRedirect();

        $cashier->refresh();
        $this->assertNotNull($cashier->phone_otp);

        $verifyResponse = $this->actingAs($cashier)->post('/verify-otp/verify', [
            'otp' => $cashier->phone_otp,
        ]);
        $verifyResponse->assertRedirect('/pos');

        $this->assertNotNull($cashier->fresh()->phone_verified_at);
    }
}
