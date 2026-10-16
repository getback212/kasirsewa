<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

final class TenantDomain
{
    public const BASE_DOMAIN = 'superbackend.my.id';

    private const RESERVED_LABELS = [
        'www', 'api', 'app', 'admin', 'super-admin', 'saas', 'mail', 'smtp',
        'ftp', 'cdn', 'status', 'support', 'help', 'docs', 'blog', 'static',
    ];

    public static function normalize(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $domain = strtolower(trim($value));
        $domain = preg_replace('#^https?://#', '', $domain);

        // Drop any path/query/fragment — we only care about the host.
        $domain = preg_replace('~[/?#].*$~', '', $domain);
        $domain = rtrim($domain, '.');

        if ($domain === '' || str_contains($domain, '/') || str_contains($domain, ':') || filter_var($domain, FILTER_VALIDATE_IP)) {
            throw ValidationException::withMessages(['domain' => 'Subdomain harus berupa hostname yang valid, tanpa http://, path, port, atau alamat IP.']);
        }

        if (! str_contains($domain, '.')) {
            $domain .= '.'.self::BASE_DOMAIN;
        }

        if (strlen($domain) > 253 || ! preg_match('/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/', $domain)) {
            throw ValidationException::withMessages(['domain' => 'Format subdomain/domain tidak valid. Gunakan huruf kecil, angka, dan tanda hubung.']);
        }

        if ($domain === self::BASE_DOMAIN || str_ends_with($domain, '.'.self::BASE_DOMAIN)) {
            $label = str($domain)->before('.'.self::BASE_DOMAIN)->toString();
            if ($label === '' || str_contains($label, '.') || in_array($label, self::RESERVED_LABELS, true)) {
                throw ValidationException::withMessages(['domain' => 'Nama subdomain tersebut dicadangkan sistem atau tidak valid.']);
            }
        }

        return $domain;
    }

    public static function isMainHost(string $host): bool
    {
        return in_array(strtolower($host), [self::BASE_DOMAIN, 'www.'.self::BASE_DOMAIN, 'saas.'.self::BASE_DOMAIN, 'localhost', '127.0.0.1'], true);
    }

    /**
     * True when the host is our own base domain or a subdomain of it — i.e. the
     * SaaS-provided addresses, which need no certificate of their own.
     */
    public static function isBaseHost(string $host): bool
    {
        $host = strtolower($host);

        return $host === self::BASE_DOMAIN || str_ends_with($host, '.'.self::BASE_DOMAIN);
    }
}
