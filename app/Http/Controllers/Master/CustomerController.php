<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Tenant;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('view-customers')) {
            abort(403, 'Anda tidak memiliki hak akses melihat data pelanggan member.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        if (! $tenantId && $user->hasRole('SUPER_ADMIN')) {
            $firstTenant = Tenant::first();
            $tenantId = $firstTenant?->id;
        }

        $query = Customer::query();
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                    ->orWhere('phone', 'ILIKE', "%{$search}%")
                    ->orWhere('code', 'ILIKE', "%{$search}%");
            });
        }

        $customers = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $tenantId = session('active_tenant_id', $request->user()->tenant_id);
        if (! $tenantId && $request->user()->hasRole('SUPER_ADMIN')) {
            $firstTenant = Tenant::first();
            $tenantId = $firstTenant?->id ?? 1;
        }

        $companyId = $request->user()->company_id ?? Company::first()?->id ?? 1;
        $code = 'CUST-'.mt_rand(1000, 9999);

        $customer = Customer::create([
            'company_id' => $companyId,
            'tenant_id' => $tenantId,
            'code' => $code,
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'email' => $validated['email'] ?? null,
            'city' => $validated['city'] ?? null,
            'credit_limit' => $validated['credit_limit'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'customer_type' => $validated['customer_type'] ?? 'retail',
        ]);

        AuditLogService::log('CUSTOMER_CREATE', 'Customer', $customer->id, ['name' => $customer->name]);

        return redirect()->back()->with('success', "Pelanggan member {$customer->name} berhasil ditambahkan!");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasRole(['SUPER_ADMIN', 'OWNER']) && ! $user->hasPermissionTo('delete-customers')) {
            abort(403, 'Anda tidak memiliki hak akses menghapus data pelanggan member.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);

        $query = Customer::query();
        if (! $user->hasRole('SUPER_ADMIN') && $tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $customer = $query->findOrFail($id);
        $customerName = $customer->name;
        $customer->delete();

        AuditLogService::log('CUSTOMER_DELETE', 'Customer', $id, ['name' => $customerName]);

        return redirect()->back()->with('success', "Data pelanggan member {$customerName} berhasil dihapus!");
    }

    public function payCredit(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'note' => ['nullable', 'string'],
        ]);

        // Sanitize note field
        if (isset($validated['note'])) {
            $validated['note'] = strip_tags(trim($validated['note']));
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $customer = Customer::where('tenant_id', $tenantId)->findOrFail($id);

        $payAmount = (float) $validated['amount'];
        $customer->decrement('credit_balance', min((float) $customer->credit_balance, $payAmount));

        AuditLogService::log('CUSTOMER_CREDIT_PAYMENT', 'Customer', $customer->id, [
            'name' => $customer->name,
            'amount_paid' => $payAmount,
            'remaining_credit' => $customer->credit_balance,
        ]);

        return redirect()->back()->with('success', "Pelunasan piutang/kasbon member {$customer->name} sebesar Rp ".number_format($payAmount, 0, ',', '.').' berhasil dicatat!');
    }
}
