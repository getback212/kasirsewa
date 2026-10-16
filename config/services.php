<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', rtrim(env('APP_URL'), '/').'/auth/google/callback'),
    ],

    'qris' => [
        'webhook_secret' => env('QRIS_WEBHOOK_SECRET'),
    ],

    /*
    | Cloudflare for SaaS — lets a tenant's own domain get a certificate and
    | route into the tunnel. Without api_token + zone_id the app still saves
    | the domain, but marks it `pending_dns` instead of faking success.
    */
    'cloudflare' => [
        'api_token' => env('CLOUDFLARE_API_TOKEN'),
        'zone_id' => env('CLOUDFLARE_ZONE_ID'),
        'api_base' => env('CLOUDFLARE_API_BASE', 'https://api.cloudflare.com/client/v4'),
        // CNAME target tenants point their custom domain at, e.g.
        // `customers.superbackend.my.id` (the SaaS fallback origin).
        'custom_domain_target' => env('CLOUDFLARE_CUSTOM_DOMAIN_TARGET'),
    ],

    'wa' => [
        'api_key' => env('WA_API_KEY'),
        'gateway_url' => env('WA_GATEWAY_URL', 'http://kasirsewa_whatsapp:3001/send'),
    ],

];
