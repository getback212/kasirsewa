<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Outlet;
use App\Enums\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

use App\Services\Audit\AuditLogService;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $currentUser = $request->user();

        if (!$currentUser->hasPermissionTo('view-users')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola data staff pengguna.');
        }

        $query = User::with(['roles', 'outlet'])
            ->where('company_id', $currentUser->company_id);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('email', 'ILIKE', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $roleName = $request->input('role');
            $query->whereHas('roles', function ($q) use ($roleName) {
                $q->where('name', $roleName);
            });
        }

        $users = $query->latest()->paginate(20)->withQueryString()
            ->through(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'outlet_id' => $user->outlet_id,
                    'outlet_name' => $user->outlet?->name ?? 'Semua Outlet',
                    'role' => $user->roles->first()?->name ?? 'CASHIER',
                    'created_at' => $user->created_at->format('Y-m-d H:i'),
                ];
            });

        $outlets = Outlet::where('company_id', $currentUser->company_id)
            ->where('is_active', true)
            ->get(['id', 'code', 'name']);

        $roles = [
            ['value' => UserRole::MANAGER->value, 'label' => 'Manager Toko'],
            ['value' => UserRole::CASHIER->value, 'label' => 'Kasir'],
            ['value' => UserRole::WAREHOUSE->value, 'label' => 'Staf Gudang'],
        ];

        if ($currentUser->hasRole([UserRole::SUPER_ADMIN->value, UserRole::OWNER->value])) {
            array_unshift($roles, ['value' => UserRole::OWNER->value, 'label' => 'Owner / Pemilik Toko']);
        }

        return Inertia::render('Users/Index', [
            'users' => $users,
            'outlets' => $outlets,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $currentUser = $request->user();

        if (!$currentUser->hasPermissionTo('create-users')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menambah staff.');
        }

        $tenantId = session('active_tenant_id', $currentUser->tenant_id);
        if ($tenantId) {
            $tenant = \App\Models\Tenant::with('subscription.plan')->find($tenantId);
            if ($tenant && $tenant->subscription && $tenant->subscription->plan) {
                $maxUsers = $tenant->subscription->plan->max_users;
                $currentUsersCount = User::where('tenant_id', $tenantId)->count();

                if ($currentUsersCount >= $maxUsers) {
                    return back()->with('error', "Batas pengguna untuk paket '{$tenant->subscription->plan->name}' adalah {$maxUsers} pengguna. Silakan upgrade paket berlangganan SaaS Anda.");
                }
            }
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'string', Rule::in([UserRole::OWNER->value, UserRole::MANAGER->value, UserRole::CASHIER->value, UserRole::WAREHOUSE->value])],
            'outlet_id' => ['required', 'exists:outlets,id'],
        ]);

        $user = User::create([
            'company_id' => $currentUser->company_id ?? 1,
            'tenant_id' => $tenantId,
            'outlet_id' => $validated['outlet_id'],
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        $user->syncRoles([$validated['role']]);

        AuditLogService::log(
            action: 'USER_CREATE',
            modelType: 'User',
            modelId: $user->id,
            newValues: ['name' => $user->name, 'email' => $user->email, 'role' => $validated['role']]
        );

        return back()->with('success', "Staff pengguna {$user->name} berhasil ditambahkan!");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user();

        if (!$currentUser->hasPermissionTo('edit-users')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengedit staff.');
        }

        $user = User::where('company_id', $currentUser->company_id)->findOrFail($id);

        if (!$request->filled('password')) {
            $request->request->remove('password');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['required', 'string', Rule::in([UserRole::OWNER->value, UserRole::MANAGER->value, UserRole::CASHIER->value, UserRole::WAREHOUSE->value])],
            'outlet_id' => ['required', 'exists:outlets,id'],
            'is_active' => ['required', 'boolean'],
        ]);

        $dataToUpdate = [
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'outlet_id' => $validated['outlet_id'],
            'is_active' => $validated['is_active'],
        ];

        if ($request->filled('password')) {
            $dataToUpdate['password'] = Hash::make($validated['password']);
        }

        $oldUserData = $user->only(['name', 'email', 'is_active', 'outlet_id']);

        $user->update($dataToUpdate);
        $user->syncRoles([$validated['role']]);

        AuditLogService::log(
            action: 'USER_UPDATE',
            modelType: 'User',
            modelId: $user->id,
            oldValues: $oldUserData,
            newValues: ['name' => $user->name, 'email' => $user->email, 'is_active' => $user->is_active, 'role' => $validated['role']]
        );

        return back()->with('success', "Data staff {$user->name} berhasil diperbarui!");
    }

    public function toggleStatus(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user();

        if (!$currentUser->hasPermissionTo('edit-users')) {
            abort(403, 'Anda tidak memiliki hak akses.');
        }

        $user = User::where('company_id', $currentUser->company_id)->findOrFail($id);
        $user->update(['is_active' => !$user->is_active]);

        $statusText = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return back()->with('success', "Akun staff {$user->name} berhasil {$statusText}.");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user();

        if (!$currentUser->hasRole([UserRole::SUPER_ADMIN->value, UserRole::OWNER->value]) && !$currentUser->hasPermissionTo('delete-users')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus akun staff.');
        }

        if ($id === $currentUser->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!');
        }

        $user = User::where('company_id', $currentUser->company_id)->findOrFail($id);

        if ($user->hasRole([UserRole::SUPER_ADMIN->value, UserRole::OWNER->value])) {
            return back()->with('error', 'Akun Pemilik Toko / Owner Utama dilindungi dan tidak dapat dihapus!');
        }

        $userName = $user->name;
        $deletedUserData = $user->only(['name', 'email']);
        $user->delete();

        AuditLogService::log(
            action: 'USER_DELETE',
            modelType: 'User',
            modelId: $id,
            oldValues: $deletedUserData
        );

        return back()->with('success', "Akun staff {$userName} telah berhasil dihapus dari sistem!");
    }
}
