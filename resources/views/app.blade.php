<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ config('app.name', 'KasirSewa SaaS Platform') }}</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
    @inertiaHead
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased font-sans">
    @inertia
  </body>
</html>
