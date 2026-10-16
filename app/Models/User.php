<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $fillable = [
        'company_id',
        'tenant_id',
        'outlet_id',
        'name',
        'email',
        'phone',
        'password',
        'google_id',
        'avatar',
        'is_active',
        'email_verified_at',
        'phone_verified_at',
        'phone_otp',
        'phone_otp_expires_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'phone_otp_expires_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (User $user) {
            if (! $user->isForceDeleting()) {
                return;
            }

            $user->roles()->detach();
            $user->permissions()->detach();
            $user->assertNoBusinessRecords();
        });
    }

    /**
     * A hard delete cascades through most of the business tables
     * (sales, purchases, shifts, expenses, cash_movements, ... — all
     * ON DELETE CASCADE), which destroys sales history. Refuse it while those
     * records exist; the staff account should be deactivated (soft deleted)
     * instead, or the tenant purged intentionally.
     */
    public function assertNoBusinessRecords(): void
    {
        foreach (self::CASCADE_OWNED_TABLES as $table => $column) {
            if (DB::table($table)
                ->where($column, $this->id)
                ->when(method_exists($this, 'trashed') && $this->trashed(), function ($q) {
                    // ignore
                })
                ->exists()) {
                throw new RuntimeException(
                    "Tidak dapat menghapus permanen akun ini: masih ada data pada tabel '{$table}'. "
                    .'Nonaktifkan akun staff (soft delete) agar riwayat transaksi tetap utuh.'
                );
            }
        }
    }

    /**
     * Tables whose rows are destroyed by a hard user delete.
     *
     * @var array<string, string>
     */
    private const CASCADE_OWNED_TABLES = [
        'sales' => 'cashier_id',
        'sales_returns' => 'cashier_id',
        'purchases' => 'user_id',
        'shifts' => 'user_id',
        'cash_movements' => 'user_id',
        'expenses' => 'user_id',
        'held_transactions' => 'cashier_id',
        'stock_opnames' => 'user_id',
        'stock_transfers' => 'user_id',
        'stock_movements' => 'user_id',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}
