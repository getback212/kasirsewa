<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Outlet extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'company_id',
        'tenant_id',
        'code',
        'name',
        'phone',
        'address',
        'tax_percentage',
        'enable_ppn',
        'qris_payload',
        'qris_image_url',
        'is_active',
    ];

    /**
     * Token acak untuk pairing layar display pelanggan.
     * Dibuat lazily saat outlet belum punya token (mis. outlet lama / seed).
     * Sengaja TIDAK bisa diubah lewat mass-assignment dari request.
     */
    public function ensureDisplayPairToken(): string
    {
        if (! $this->display_pair_token) {
            do {
                $token = 'DISP-'.mb_strtoupper(Str::random(12));
            } while (Outlet::where('display_pair_token', $token)->exists());

            $this->forceFill(['display_pair_token' => $token])->save();
        }

        return $this->display_pair_token;
    }

    protected static function booted(): void
    {
        static::creating(function (self $outlet) {
            if (! $outlet->display_pair_token) {
                $outlet->display_pair_token = 'DISP-'.mb_strtoupper(Str::random(12));
            }
        });
    }

    protected $casts = [
        'is_active' => 'boolean',
        'enable_ppn' => 'boolean',
        'tax_percentage' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
