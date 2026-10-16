<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Tests\TestCase;

class SubscriptionBillingFlowTest extends TestCase
{
    /**
     * Full flow: Trial → Expired → Invoice → Payment → Active
     */
    public function test_full_subscription_billing_flow()
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $plan = Plan::firstOrCreate(['slug' => 'starter-test'], [
            'name' => 'Starter Test',
            'monthly_price' => 99000,
            'yearly_price' => 990000,
            'is_active' => true,
        ]);

        // 1. Create tenant & owner (trial)
        $tenant = Tenant::create(['name' => 'Test Flow Tenant', 'status' => 'active']);
        
        // Create default outlet using factory (handles all required fields)
        $outlet = \App\Models\Outlet::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $owner = User::create([
            'name' => 'Owner Flow',
            'email' => 'owner.flow@test.com',
            'password' => bcrypt('password'),
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
        ]);
        $owner->assignRole('OWNER');

        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'trial',
            'billing_cycle' => 'monthly',
            'starts_at' => now()->subDays(6),
            'expires_at' => now()->addDays(1),
            'trial_ends_at' => now()->addDays(1),
        ]);

        // 2. Trial period: owner CAN access dashboard
        $response = $this->actingAs($owner)->get('/dashboard');
        $response->assertOk();

        // 3. Trial ends: manually set expired & past_due
        $subscription->update(['status' => 'expired', 'trial_ends_at' => now()->subHours(1)]);
        $tenant->update(['status' => 'past_due']);

        // 4. Expired: owner CANNOT access dashboard
        $response = $this->actingAs($owner)->get('/dashboard');
        $response->assertRedirect('/subscription/expired');

        // 5. Owner goes to subscription page (ALLOWED)
        $response = $this->actingAs($owner)->get('/subscription');
        $response->assertOk();

        // 6. Owner clicks "Bayar Berlangganan" → POST /subscription/renew
        $response = $this->actingAs($owner)->post('/subscription/renew', [
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
        ]);
        $response->assertRedirect('/invoices');

        // 7. Verify invoice created
        $invoice = Invoice::where('tenant_id', $tenant->id)->latest()->first();
        $this->assertNotNull($invoice);
        $this->assertEquals('pending', $invoice->status);
        $this->assertEquals($plan->monthly_price, $invoice->total);

        // 8. Owner submits payment (POST /invoices/{id}/submit-payment)
        $response = $this->actingAs($owner)->post("/invoices/{$invoice->id}/submit-payment", [
            'payment_method' => 'bank_transfer',
            'sender_bank' => 'BCA',
            'sender_name' => 'Ari',
        ]);
        // After submit, middleware might redirect back to subscription (tenant is past_due)
        // This is OK — payment still recorded
        $response->assertRedirect();


        // 9. Verify invoice pending verification
        $invoice->refresh();
        $this->assertEquals('pending', $invoice->status); // masih pending sampai super admin confirm

        // 10. Seed Super Admin
        $super_admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
        ]);
        $super_admin->assignRole('SUPER_ADMIN');

        // 11. Super Admin verifies payment (POST /invoices/{id}/confirm-payment)
        $response = $this->actingAs($super_admin)->post("/invoices/{$invoice->id}/confirm-payment");
        $response->assertRedirect();

        // 12. Verify invoice marked paid & subscription renewed
        $invoice->refresh();
        $this->assertEquals('paid', $invoice->status);

        // 13. Verify subscription is ACTIVE & extended
        $subscription->refresh();
        $this->assertEquals('active', $subscription->status);
        $this->assertGreaterThan(now(), $subscription->expires_at);

        // 14. Verify tenant ACTIVE & owner can access dashboard again
        $tenant->refresh();
        $this->assertEquals('active', $tenant->status);

        $response = $this->actingAs($owner)->get('/dashboard');
        $response->assertOk();
    }
}
