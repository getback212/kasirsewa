<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class BulkUserImportService
{
    /**
     * Parse CSV and import users in batch
     * 
     * @param UploadedFile $file
     * @param int $tenantId
     * @param int $companyId
     * @return array ['success' => int, 'errors' => [...], 'users' => [...]]
     */
    public static function import(UploadedFile $file, int $tenantId, int $companyId): array
    {
        $results = [
            'success' => 0,
            'errors' => [],
            'users' => [],
        ];

        // Check max users quota
        $tenant = Tenant::with('subscription.plan')->find($tenantId);
        if (!$tenant || !$tenant->subscription) {
            $results['errors'][] = 'Tenant atau subscription tidak valid.';
            return $results;
        }

        $maxUsers = $tenant->subscription->plan->max_users ?? 0;
        $currentCount = User::where('tenant_id', $tenantId)->count();

        $path = $file->store('temp', 'local');
        $lines = file(storage_path("app/{$path}"));
        
        if (count($lines) < 2) {
            $results['errors'][] = 'File CSV kosong atau hanya header.';
            unlink(storage_path("app/{$path}"));
            return $results;
        }

        // Parse header
        $header = str_getcsv(trim($lines[0]));
        $header = array_map('strtolower', array_map('trim', $header));
        
        $requiredCols = ['name', 'email', 'phone', 'role', 'outlet_id', 'password'];
        $missingCols = array_diff($requiredCols, $header);
        if (!empty($missingCols)) {
            $results['errors'][] = 'Kolom CSV tidak lengkap. Dibutuhkan: '.implode(', ', $requiredCols);
            unlink(storage_path("app/{$path}"));
            return $results;
        }

        // Process rows
        foreach (array_slice($lines, 1) as $rowNum => $line) {
            $rowNum += 2; // Start from row 2 (after header)
            $data = str_getcsv(trim($line));
            
            if (count($data) < count($header)) {
                $results['errors'][] = "Row {$rowNum}: Jumlah kolom tidak sesuai.";
                continue;
            }

            $row = array_combine($header, array_slice($data, 0, count($header)));
            $row = array_map('trim', $row);

            // Validate row
            $validation = self::validateRow($row, $rowNum, $tenantId, $maxUsers, $currentCount + $results['success']);
            if ($validation['error']) {
                $results['errors'][] = $validation['error'];
                continue;
            }

            // Create user
            try {
                $cleanPhone = self::formatPhone($row['phone']);
                
                $user = User::create([
                    'company_id' => $companyId,
                    'tenant_id' => $tenantId,
                    'outlet_id' => (int)$row['outlet_id'],
                    'name' => $row['name'],
                    'email' => strtolower($row['email']),
                    'phone' => $cleanPhone,
                    'password' => Hash::make($row['password']),
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]);

                $user->syncRoles([$row['role']]);

                $results['success']++;
                $results['users'][] = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $row['role'],
                ];
            } catch (\Throwable $e) {
                $results['errors'][] = "Row {$rowNum}: Gagal membuat user — {$e->getMessage()}";
                Log::error("Bulk import error row {$rowNum}: ".$e->getMessage());
            }
        }

        unlink(storage_path("app/{$path}"));
        return $results;
    }

    /**
     * Validate single row
     */
    private static function validateRow(array $row, int $rowNum, int $tenantId, int $maxUsers, int $currentCount): array
    {
        // Check quota
        if ($currentCount >= $maxUsers) {
            return [
                'error' => "Row {$rowNum}: Batas pengguna ({$maxUsers}) sudah tercapai.",
            ];
        }

        // Validate name
        if (empty($row['name']) || strlen($row['name']) > 255) {
            return ['error' => "Row {$rowNum}: Nama harus diisi dan max 255 karakter."];
        }

        // Validate email
        if (empty($row['email']) || !filter_var($row['email'], FILTER_VALIDATE_EMAIL)) {
            return ['error' => "Row {$rowNum}: Email tidak valid."];
        }
        if (User::where('email', strtolower($row['email']))->exists()) {
            return ['error' => "Row {$rowNum}: Email '{$row['email']}' sudah digunakan."];
        }

        // Validate phone
        if (empty($row['phone'])) {
            return ['error' => "Row {$rowNum}: Nomor telepon harus diisi."];
        }

        // Validate password
        if (empty($row['password']) || strlen($row['password']) < 6) {
            return ['error' => "Row {$rowNum}: Password minimal 6 karakter."];
        }

        // Validate role
        $validRoles = ['OWNER', 'MANAGER', 'CASHIER', 'WAREHOUSE'];
        if (!in_array(strtoupper($row['role']), $validRoles)) {
            return ['error' => "Row {$rowNum}: Role harus: ".implode(', ', $validRoles)."."];
        }

        // Check OWNER limit
        if (strtoupper($row['role']) === 'OWNER') {
            $existingOwner = User::where('tenant_id', $tenantId)
                ->whereHas('roles', fn ($q) => $q->where('name', 'OWNER'))
                ->first();
            if ($existingOwner) {
                return ['error' => "Row {$rowNum}: Tenant sudah memiliki 1 Owner ({$existingOwner->name})."];
            }
        }

        // Validate outlet_id
        if (empty($row['outlet_id']) || !is_numeric($row['outlet_id'])) {
            return ['error' => "Row {$rowNum}: Outlet ID harus angka."];
        }

        return ['error' => null];
    }

    /**
     * Format phone number to international format
     */
    private static function formatPhone(string $phone): string
    {
        $clean = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($clean, '0')) {
            $clean = '62'.substr($clean, 1);
        }
        return $clean;
    }
}
