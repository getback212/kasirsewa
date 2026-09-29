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
use App\Http\Controllers\Admin\AdminPaymentSettingController;
use App\Http\Controllers\Admin\AdminNotificationSettingController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Master\CustomerController;
use App\Http\Controllers\Invoice\InvoiceController;

// PUBLIC LANDING PAGE & GUEST ROUTES
Route::get('/', function () {
    if (auth()->check()) {
        $user = auth()->user();
        if ($user->hasRole('SUPER_ADMIN')) {
            return redirect()->route('admin.dashboard');
        }
        if ($user->hasRole('CASHIER')) {
            return redirect()->route('pos.index');
        }
        if ($user->hasRole('WAREHOUSE')) {
            return redirect()->route('inventory.index');
        }
        return redirect()->route('dashboard');
    }
    
    $plans = \App\Models\Plan::where('is_active', true)->get();
    $waCsNumber = \App\Models\SaaSSetting::get('wa_cs_number', '6281234567890');
    return \Inertia\Inertia::render('Welcome', [
        'plans' => $plans,
        'waCsNumber' => $waCsNumber,
    ]);
})->name('home');

Route::get('/wa-qr', function () {
    try {
        $res = \Illuminate\Support\Facades\Http::get('http://172.17.0.1:3001/qr');
        return response($res->body(), 200)->header('Content-Type', 'text/html');
    } catch (\Exception $e) {
        return response("Gagal mengambil QR Code: " . $e->getMessage(), 500);
    }
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    Route::get('/super-admin/login', [AuthenticatedSessionController::class, 'createSuperAdmin'])->name('superadmin.login');
    Route::post('/super-admin/login', [AuthenticatedSessionController::class, 'storeSuperAdmin']);
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);

    // Google SSO Routes
    Route::get('/auth/google/redirect', [\App\Http\Controllers\Auth\GoogleAuthController::class, 'redirectToGoogle'])->name('auth.google.redirect');
    Route::get('/auth/google/callback', [\App\Http\Controllers\Auth\GoogleAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // WhatsApp OTP Verification Routes
    Route::get('/verify-otp', [\App\Http\Controllers\Auth\VerifyOtpController::class, 'show'])->name('verify.otp');
    Route::post('/verify-otp/send', [\App\Http\Controllers\Auth\VerifyOtpController::class, 'sendOtp'])->name('verify.otp.send');
    Route::post('/verify-otp/verify', [\App\Http\Controllers\Auth\VerifyOtpController::class, 'verifyOtp'])->name('verify.otp.verify');

    // Super Admin Tenant, Plan & Dashboard Routes
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/admin/tenants', [TenantController::class, 'index'])->name('admin.tenants.index');
    Route::post('/admin/tenants', [TenantController::class, 'store'])->name('admin.tenants.store');
    Route::put('/admin/tenants/{id}', [TenantController::class, 'update'])->name('admin.tenants.update');
    Route::delete('/admin/tenants/{id}', [TenantController::class, 'destroy'])->name('admin.tenants.destroy');
    Route::post('/admin/tenants/{id}/impersonate', [TenantController::class, 'impersonate'])->name('admin.tenants.impersonate');
    Route::post('/admin/tenants/stop-impersonate', [TenantController::class, 'stopImpersonate'])->name('admin.tenants.stop_impersonate');

    Route::get('/admin/plans', [PlanController::class, 'index'])->name('admin.plans.index');
    Route::post('/admin/plans', [PlanController::class, 'store'])->name('admin.plans.store');
    Route::put('/admin/plans/{id}', [PlanController::class, 'update'])->name('admin.plans.update');

    Route::get('/admin/payment-settings', [AdminPaymentSettingController::class, 'index'])->name('admin.payment_settings.index');
    Route::post('/admin/payment-settings', [AdminPaymentSettingController::class, 'update'])->name('admin.payment_settings.update');

    Route::get('/admin/notification-settings', [AdminNotificationSettingController::class, 'index'])->name('admin.notification_settings.index');
    Route::post('/admin/notification-settings', [AdminNotificationSettingController::class, 'update'])->name('admin.notification_settings.update');
    Route::post('/admin/notification-settings/test', [AdminNotificationSettingController::class, 'testSend'])->name('admin.notification_settings.test');

    // Tenant SaaS Subscription & Billing Routes
    Route::get('/subscription', [SubscriptionController::class, 'index'])->name('subscription.index');
    Route::post('/subscription/renew', [SubscriptionController::class, 'renew'])->name('subscription.renew');

    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/{id}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::post('/invoices/{id}/submit-payment', [InvoiceController::class, 'submitPayment'])->name('invoices.submit_payment');
    Route::post('/invoices/{id}/confirm-payment', [InvoiceController::class, 'confirmPayment'])->name('invoices.confirm_payment');
    Route::delete('/invoices/{id}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

    // Dashboard & Executive Summary
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Master Customers / Member Database Routes
    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy'])->name('customers.destroy');

    // Multi-Outlet Configuration Routes
    Route::get('/outlets', [OutletController::class, 'index'])->name('outlets.index');
    Route::post('/outlets', [OutletController::class, 'store'])->name('outlets.store');
    Route::put('/outlets/{id}', [OutletController::class, 'update'])->name('outlets.update');
    Route::post('/outlets/{id}/switch', [OutletController::class, 'switchOutlet'])->name('outlets.switch');

    // Product & Master Data Management
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::put('/products/{id}', [ProductController::class, 'update'])->name('products.update');
    Route::post('/products/{id}/toggle-status', [ProductController::class, 'toggleStatus'])->name('products.toggle_status');

    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::put('/categories/{id}', [CategoryController::class, 'update'])->name('categories.update');

    Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
    Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
    Route::put('/suppliers/{id}', [SupplierController::class, 'update'])->name('suppliers.update');

    // Staff User Management Routes
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update');
    Route::post('/users/{id}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle_status');
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');

    // Inventory & Stock Management Routes
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory/adjust', [InventoryController::class, 'adjust'])->name('inventory.adjust');

    Route::get('/stock-opname', [StockOpnameController::class, 'index'])->name('stock_opname.index');
    Route::post('/stock-opname', [StockOpnameController::class, 'store'])->name('stock_opname.store');

    Route::get('/stock-transfers', [StockTransferController::class, 'index'])->name('stock_transfers.index');
    Route::post('/stock-transfers', [StockTransferController::class, 'store'])->name('stock_transfers.store');

    // Procurement / Purchase Routes
    Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');

    // POS Cashier Routes
    Route::get('/pos', [POSController::class, 'index'])->name('pos.index');
    Route::post('/pos/checkout', [PaymentController::class, 'checkout'])->name('pos.checkout');
    Route::post('/pos/hold-cart', [POSController::class, 'holdCart'])->name('pos.hold_cart');
    Route::delete('/pos/hold-cart/{id}', [POSController::class, 'destroyHold'])->name('pos.destroy_hold');
    Route::get('/pos/receipt/{id}', [ReceiptController::class, 'show'])->name('pos.receipt');
    Route::get('/receipt/{id}', [ReceiptController::class, 'show']);
    Route::get('/pos/customer-display', [POSController::class, 'customerDisplay'])->name('pos.customer_display');

    // Sales Return Routes
    Route::get('/sales-returns', [SalesReturnController::class, 'index'])->name('sales_returns.index');
    Route::post('/sales-returns', [SalesReturnController::class, 'store'])->name('sales_returns.store');

    // Cash Shift & Laci Cash Control
    Route::get('/shifts', [ShiftController::class, 'index'])->name('shifts.index');
    Route::post('/shifts/open', [ShiftController::class, 'open'])->name('shifts.open');
    Route::post('/shifts/close', [ShiftController::class, 'close'])->name('shifts.close');
    Route::post('/shifts/force-close', [ShiftController::class, 'forceClose'])->name('shifts.force_close');
    Route::post('/shifts/cash-movement', [ShiftController::class, 'cashMovement'])->name('shifts.cash_movement');

    // Expense Management
    Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::post('/expenses', [ExpenseController::class, 'store'])->name('expenses.store');

    // Reports & Financial Insights
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

    // System Audit Logs & Backup/Restore
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit_logs.index');
    Route::delete('/audit-logs/clear', [AuditLogController::class, 'clear'])->name('audit_logs.clear');
    Route::delete('/audit-logs/{id}', [AuditLogController::class, 'destroy'])->name('audit_logs.destroy');
    Route::get('/backups', [BackupController::class, 'index'])->name('backups.index');
    Route::post('/backups/run', [BackupController::class, 'runBackup'])->name('backups.run');
    Route::post('/backups/upload', [BackupController::class, 'upload'])->name('backups.upload');
    Route::post('/backups/restore/{filename}', [BackupController::class, 'restore'])->name('backups.restore');
    Route::get('/backups/download/{filename}', [BackupController::class, 'download'])->name('backups.download');
    Route::delete('/backups/delete/{filename}', [BackupController::class, 'delete'])->name('backups.delete');
});
