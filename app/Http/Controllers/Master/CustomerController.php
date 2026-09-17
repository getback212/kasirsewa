<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Customer;
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

        if (!$user->hasPermissionTo('view-customers')) {
            abort(403, 'Anda tidak memiliki hak akses melihat data pelanggan member.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);

        $query = Customer::where('tenant_id', $tenantId);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $customers = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('create-customers')) {
            abort(403, 'Anda tidak memiliki hak akses menambah pelanggan member.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        $tenantId = session('active_tenant_id', $user->tenant_id);
        $code = 'CUST-'.mt_rand(1000, 9999);

        $customer = Customer::create([
            'company_id' => $user->company_id,
            'tenant_id' => $tenantId,
            'code' => $code,
            'name' => $request->name,
            'phone' => $request->phone,
            'address' => $request->address,
        ]);

        AuditLogService::log('CUSTOMER_CREATE', 'Customer', $customer->id, ['name' => $customer->name]);

        return redirect()->back()->with('success', "Pelanggan member {$customer->name} berhasil ditambahkan!");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasRole(['SUPER_ADMIN', 'OWNER']) && !$user->hasPermissionTo('delete-customers')) {
            abort(403, 'Anda tidak memiliki hak akses menghapus data pelanggan member.');
        }

        $tenantId = session('active_tenant_id', $user->tenant_id);
        
        $query = Customer::query();
        if (!$user->hasRole('SUPER_ADMIN')) {
            $query->where('tenant_id', $tenantId);
        }

        $customer = $query->findOrFail($id);
        $customerName = $customer->name;
        $customer->delete();

        AuditLogService::log('CUSTOMER_DELETE', 'Customer', $id, ['name' => $customerName]);

        return redirect()->back()->with('success', "Data pelanggan member {$customerName} berhasil dihapus!");
    }
}
