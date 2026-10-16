<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
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
use App\Support\StaffScope;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $currentUser = $request->user();

        if (!$currentUser->hasPermissionTo('view-users')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola data staff pengguna.');
        }

        $tenantId = StaffScope::tenantIdFor($currentUser);

        $query = User::with(['roles', 'outlet'])
            ->when($request->boolean('archived'), fn ($q) => $q->onlyTrashed())
            ->where(fn ($q) => StaffScope::apply($q, $tenantId));

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
                    'is_archived' => $user->trashed(),
                ];
            });

        $outlets = Outlet::where(fn ($q) => StaffScope::apply($q, $tenantId))
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

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $currentUser = $request->user();

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

        $validated = $request->validated();

        $cleanPhone = null;
        if (!empty($validated['phone'])) {
            $cleanPhone = preg_replace('/[^0-9]/', '', $validated['phone']);
            if (str_starts_with($cleanPhone, '0')) {
                $cleanPhone = '62' . substr($cleanPhone, 1);
            }
        }

        $user = User::create([
            'company_id' => $currentUser->company_id ?? 1,
            'tenant_id' => $tenantId,
            'outlet_id' => $validated['outlet_id'],
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $cleanPhone,
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
            'is_active' => true,
        ]);

        $user->syncRoles([$validated['role']]);

        // Send Email & WhatsApp Invitation if enabled
        if ($request->boolean('send_invite', true)) {
            $roleLabel = match($validated['role']) {
                'MANAGER' => 'Manager Toko',
                'CASHIER' => 'Kasir',
                'WAREHOUSE' => 'Staf Gudang',
                default => 'Staf Toko',
            };

            // 1. WhatsApp Invitation via Baileys Gateway
            if (!empty($cleanPhone)) {
                $waGatewayUrl = \App\Models\SaaSSetting::get('wa_gateway_url', 'http://kasirsewa_whatsapp:3001/send');
                $waApiKey = \App\Models\SaaSSetting::get('wa_api_key', 'baileys_free_gateway');
                $waMsg = "👋 *Undangan Bergabung Staf Toko KasirSewa*\\n\\nHalo *{$user->name}*,\\n\\nAnda telah diundang oleh *{$currentUser->name}* untuk bergabung sebagai *{$roleLabel}* di KasirSewa POS.\\n\\nSilakan klik link di bawah untuk langsung masuk menggunakan Google SSO (Gmail: {$user->email}) atau Password:\\nhttps://superbackend.my.id/login";

                try {
                    \Illuminate\Support\Facades\Http::withHeaders([
                        'Authorization' => $waApiKey,
                    ])->timeout(20)->post($waGatewayUrl, [
                        'target' => $cleanPhone,
                        'phone' => $cleanPhone,
                        'message' => $waMsg,
                    ]);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to send staff WA invite: ' . $e->getMessage());
                }
            }

            // 2. Email Invitation
            try {
                \Illuminate\Support\Facades\Mail::raw("Halo {$user->name},\\n\\nAnda telah diundang oleh {$currentUser->name} untuk bergabung sebagai staf {$roleLabel} di KasirSewa POS.\\n\\nSilakan masuk menggunakan akun Gmail ({$user->email}) via Google SSO di:\\nhttps://superbackend.my.id/login", function ($mail) use ($user) {
                    $mail->to($user->email)->subject("✉️ Undangan Bergabung Staf Toko - KasirSewa POS");
                });
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send staff email invite: ' . $e->getMessage());
            }
        }

        AuditLogService::log(
            action: 'USER_CREATE',
            modelType: 'User',
            modelId: $user->id,
            newValues: ['name' => $user->name, 'email' => $user->email, 'role' => $validated['role']]
        );

        return back()->with('success', "Staff pengguna {$user->name} berhasil ditambahkan!");
    }

    public function update(UpdateUserRequest $request, int $id): RedirectResponse
    {
        $currentUser = $request->user();

        $tenantId = StaffScope::tenantIdFor($currentUser);

        $user = User::where(fn ($q) => StaffScope::apply($q, $tenantId))->findOrFail($id);

        $validated = $request->validated();

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

        $tenantId = StaffScope::tenantIdFor($currentUser);

        $user = User::where(fn ($q) => StaffScope::apply($q, $tenantId))->findOrFail($id);
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

        $tenantId = StaffScope::tenantIdFor($currentUser);

        $user = User::withTrashed()
            ->where(fn ($q) => StaffScope::apply($q, $tenantId))
            ->findOrFail($id);

        if ($user->hasRole([UserRole::SUPER_ADMIN->value, UserRole::OWNER->value])) {
            return back()->with('error', 'Akun Pemilik Toko / Owner Utama dilindungi dan tidak dapat dihapus!');
        }

        $userName = $user->name;
        $deletedUserData = $user->only(['name', 'email']);

        try {
            if ($request->boolean('force')) {
                $user->assertNoBusinessRecords();
                $user->forceDelete();
                AuditLogService::log(
                    action: 'USER_FORCE_DELETE',
                    modelType: 'User',
                    modelId: $id,
                    oldValues: $deletedUserData
                );
                return back()->with('success', "Akun staff {$userName} telah dihapus permanen dari sistem!");
            }

            $user->delete();
            return back()->with('success', "Akun staff {$userName} telah dinonaktifkan dari sistem!");
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
