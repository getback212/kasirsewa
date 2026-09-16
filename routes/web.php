<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Outlet\OutletController;
use App\Http\Controllers\Master\ProductController;
use App\Http\Controllers\Master\CategoryController;
use App\Http\Controllers\Master\SupplierController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\Inventory\InventoryController;
use App\Http\Controllers\Inventory\StockOpnameController;
use App\Http\Controllers\Inventory\StockTransferController;
use App\Http\Controllers\POS\POSController;
use App\Http\Controllers\POS\PaymentController;
use App\Http\Controllers\POS\ReceiptController;
use App\Http\Controllers\Shift\ShiftController;
use App\Http\Controllers\Purchase\PurchaseController;
use App\Http\Controllers\Sales\SalesReturnController;
use App\Http\Controllers\Report\ReportController;
use App\Http\Controllers\Expense\ExpenseController;
use App\Http\Controllers\Audit\AuditLogController;
use App\Http\Controllers\Backup\BackupController;
use App\Http\Controllers\Tenant\TenantController;
use App\Http\Controllers\Subscription\SubscriptionController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Invoice\InvoiceController;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Super Admin Tenant, Plan & Dashboard Routes
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/admin/tenants', [TenantController::class, 'index'])->name('admin.tenants.index');
    Route::post('/admin/tenants', [TenantController::class, 'store'])->name('admin.tenants.store');
    Route::put('/admin/tenants/{id}', [TenantController::class, 'update'])->name('admin.tenants.update');

    Route::get('/admin/plans', [PlanController::class, 'index'])->name('admin.plans.index');
    Route::post('/admin/plans', [PlanController::class, 'store'])->name('admin.plans.store');
    Route::put('/admin/plans/{id}', [PlanController::class, 'update'])->name('admin.plans.update');

    // Tenant SaaS Subscription & Billing Routes
    Route::get('/subscription', [SubscriptionController::class, 'index'])->name('subscription.index');
    Route::post('/subscription/renew', [SubscriptionController::class, 'renew'])->name('subscription.renew');

    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/{id}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::post('/invoices/{id}/confirm-payment', [InvoiceController::class, 'confirmPayment'])->name('invoices.confirm_payment');

    // Dashboard & Executive Summary
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Multi-Outlet Configuration Routes
    Route::get('/outlets', [OutletController::class, 'index'])->name('outlets.index');
    Route::post('/outlets', [OutletController::class, 'store'])->name('outlets.store');
    Route::put('/outlets/{id}', [OutletController::class, 'update'])->name('outlets.update');
    Route::post('/outlets/{id}/switch', [OutletController::class, 'switchOutlet'])->name('outlets.switch');

    // Master Data Products, Categories & Suppliers
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::put('/products/{id}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->name('products.destroy');

    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
    Route::put('/suppliers/{id}', [SupplierController::class, 'update'])->name('suppliers.update');
    Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');

    // Staff User Management Routes
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update');
    Route::post('/users/{id}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle_status');
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');

    // Inventory & Stock Movements Engine
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory/adjust', [InventoryController::class, 'adjust'])->name('inventory.adjust');

    // Stock Opname
    Route::get('/stock-opname', [StockOpnameController::class, 'index'])->name('stock_opname.index');
    Route::post('/stock-opname', [StockOpnameController::class, 'store'])->name('stock_opname.store');

    // Stock Transfer Antar Outlet
    Route::get('/stock-transfers', [StockTransferController::class, 'index'])->name('stock_transfers.index');
    Route::post('/stock-transfers', [StockTransferController::class, 'store'])->name('stock_transfers.store');
    Route::post('/stock-transfers/{id}/send', [StockTransferController::class, 'send'])->name('stock_transfers.send');
    Route::post('/stock-transfers/{id}/receive', [StockTransferController::class, 'receive'])->name('stock_transfers.receive');

    // POS Kasir Touch, Barcode & Payment Engine
    Route::get('/pos', [POSController::class, 'index'])->name('pos.index');
    Route::get('/pos/customer-display', [POSController::class, 'customerDisplay'])->name('pos.customer_display');
    Route::post('/pos/hold-cart', [POSController::class, 'holdCart'])->name('pos.hold_cart');
    Route::delete('/pos/hold-cart/{id}', [POSController::class, 'destroyHold'])->name('pos.destroy_hold');
    Route::post('/pos/checkout', [PaymentController::class, 'processCheckout'])->name('pos.checkout');

    // EscPOS Receipts
    Route::get('/receipt/{saleId}', [ReceiptController::class, 'show'])->name('receipt.show');
    Route::get('/receipt/{saleId}/escpos', [ReceiptController::class, 'rawEscpos'])->name('receipt.escpos');

    // Shift Management & Cash Movement
    Route::get('/shifts', [ShiftController::class, 'index'])->name('shifts.index');
    Route::post('/shifts/open', [ShiftController::class, 'openShift'])->name('shifts.open');
    Route::post('/shifts/close', [ShiftController::class, 'closeShift'])->name('shifts.close');
    Route::post('/shifts/{id}/force-close', [ShiftController::class, 'forceClose'])->name('shifts.force_close');
    Route::post('/shifts/cash-movement', [ShiftController::class, 'cashMovement'])->name('shifts.cash_movement');

    // Purchases (Supplier Restock)
    Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');

    // Operational Expenses
    Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::post('/expenses', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::put('/expenses/{id}', [ExpenseController::class, 'update'])->name('expenses.update');
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');

    // Sales Returns
    Route::get('/sales-returns', [SalesReturnController::class, 'index'])->name('sales_returns.index');
    Route::post('/sales-returns', [SalesReturnController::class, 'processReturn'])->name('sales_returns.store');

    // Reports & Analytics
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'exportExcel'])->name('reports.export');
    Route::get('/reports/export-excel', [ReportController::class, 'exportExcel'])->name('reports.export_excel');

    // Audit Logs & Security System
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit_logs.index');

    // PostgreSQL Database Backup & Restore Engine
    Route::get('/backups', [BackupController::class, 'index'])->name('backups.index');
    Route::post('/backups/run', [BackupController::class, 'runBackup'])->name('backups.run');
    Route::post('/backups/upload', [BackupController::class, 'upload'])->name('backups.upload');
    Route::post('/backups/{filename}/restore', [BackupController::class, 'restore'])->name('backups.restore');
    Route::get('/backups/{filename}/download', [BackupController::class, 'download'])->name('backups.download');
    Route::delete('/backups/{filename}', [BackupController::class, 'delete'])->name('backups.delete');
});
