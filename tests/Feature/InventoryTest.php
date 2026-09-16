<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Outlet;
use App\Models\Stock;
use App\Actions\Inventory\AdjustStockAction;
use App\Enums\StockMovementType;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_adjust_stock_action_increases_stock_and_records_movement_ledger(): void
    {
        $user = User::first();
        $outlet = Outlet::first();
        $product = Product::first();
        $action = app(AdjustStockAction::class);

        $initialStock = (float) (Stock::where('outlet_id', $outlet->id)->where('product_id', $product->id)->value('quantity') ?? 0);

        $action->execute(
            outletId: $outlet->id,
            productId: $product->id,
            quantityChange: 20.00,
            type: StockMovementType::ADJUSTMENT,
            userId: $user->id,
            note: 'Unit Test Stock Adjustment'
        );

        $updatedStock = (float) Stock::where('outlet_id', $outlet->id)->where('product_id', $product->id)->value('quantity');
        $this->assertEquals($initialStock + 20, $updatedStock);

        $this->assertDatabaseHas('stock_movements', [
            'outlet_id' => $outlet->id,
            'product_id' => $product->id,
            'type' => 'adjustment',
            'quantity' => 20.00,
        ]);
    }

    public function test_adjust_stock_action_prevents_negative_stock_when_allow_negative_stock_is_false(): void
    {
        config(['app.allow_negative_stock' => false]);

        $user = User::first();
        $outlet = Outlet::first();
        $product = Product::first();
        $action = app(AdjustStockAction::class);

        $currentStock = (float) Stock::where('outlet_id', $outlet->id)->where('product_id', $product->id)->value('quantity');

        $this->expectException(InvalidArgumentException::class);

        $action->execute(
            outletId: $outlet->id,
            productId: $product->id,
            quantityChange: -($currentStock + 100),
            type: StockMovementType::SALE,
            userId: $user->id,
            note: 'Testing Negative Stock Block'
        );
    }
}
