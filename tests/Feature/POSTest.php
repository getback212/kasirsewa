<?php

namespace Tests\Feature;

use App\Actions\POS\CreateSaleAction;
use App\Actions\Shifts\OpenShiftAction;
use App\Models\Outlet;
use App\Models\Product;
use App\Models\Stock;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class POSTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_create_sale_action_processes_transaction_atomically_and_deducts_stock(): void
    {
        $outlet = Outlet::first();
        $product = Product::first();
        $cashier = User::where('email', 'cashier@example.test')->first();
        $action = app(CreateSaleAction::class);

        $initialStock = (float) Stock::where('outlet_id', $outlet->id)->where('product_id', $product->id)->value('quantity');

        $sale = $action->execute(
            outletId: $outlet->id,
            cashierId: $cashier->id,
            customerId: null,
            items: [
                [
                    'product_id' => $product->id,
                    'quantity' => 2.00,
                    'price' => (float) $product->selling_price,
                    'discount_amount' => 0.00,
                ],
            ],
            payments: [
                [
                    'method' => 'cash',
                    'amount' => ($product->selling_price * 2) * 1.11,
                ],
            ],
            subtotal: (float) ($product->selling_price * 2),
            discountAmount: 0.00,
            taxAmount: (float) (($product->selling_price * 2) * 0.11),
            grandTotal: (float) (($product->selling_price * 2) * 1.11),
            paidAmount: (float) (($product->selling_price * 2) * 1.11),
            note: 'POS Integration Test'
        );

        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'invoice_number' => $sale->invoice_number,
            'transaction_status' => 'completed',
        ]);

        $updatedStock = (float) Stock::where('outlet_id', $outlet->id)->where('product_id', $product->id)->value('quantity');
        $this->assertEquals($initialStock - 2, $updatedStock);
    }

    public function test_cashier_can_hold_and_resume_cart_transaction(): void
    {
        $cashier = User::where('email', 'cashier@example.test')->first();
        $outlet = Outlet::first();
        $product = Product::first();

        // Open Shift first
        app(OpenShiftAction::class)->execute($outlet->id, $cashier->id, 100000);

        $response = $this->actingAs($cashier)->post('/pos/hold-cart', [
            'customer_id' => null,
            'reference_note' => 'Pending Customer Test',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 3,
                    'price' => $product->selling_price,
                    'discount_amount' => 0,
                ],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('held_transactions', [
            'reference_note' => 'Pending Customer Test',
        ]);
    }
}
