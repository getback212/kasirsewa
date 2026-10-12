# Performance

Runtime tuning for the KasirSewa web tier. Both changes here are about the
*request path*; neither touches the domain/tunnel setup.

## Root cause: sequence heal on every request

`AppServiceProvider::boot()` used to run a PostgreSQL sequence heal loop on
every single request — 25 tables × (`Schema::hasTable` + `pg_get_serial_sequence`
+ `max(id)`) ≈ **75 queries plus a `setval` write per page load**. On top of the
per-request cost, concurrent workers racing `setval` is unsafe.

The heal only matters after a restore/import (where `max(id)` is ahead of the
sequence), so it now lives on the console path only:

- `App\Support\PostgresSequenceHealer::heal()` — the logic, guarded to `pgsql`.
- `php artisan db:heal-sequences` — run this after restoring a dump.
- `AppServiceProvider::boot()` calls the healer only when `runningInConsole()`,
  so `artisan`/queue/scheduler still self-heal, but web requests never pay for it.

### Measured impact (direct to nginx :8087, bypassing the tunnel)

| | before | after |
|---|---|---|
| `GET /login` (avg of 20) | ~0.49s | **~0.034s** (p50 0.031s, p95 0.046s) |

~**14× faster**; the remaining time is a normal Laravel boot (~30ms), not DB
maintenance.

## PHP-FPM pool + opcache

Config lives in-repo and is bind-mounted into `kasirsewa_app` (and baked into the
image via `docker/php/Dockerfile`):

- `docker/php/php-fpm.d/zz-kasirsewa.conf` — `zz-` prefix so it is included
  after `www.conf` and overrides it. `pm.max_children=6` (was 5),
  `pm.start_servers=2`, `pm.max_requests=500` to recycle workers.
  **Keep `listen` on TCP 9000**: nginx runs in a *separate* container, so a unix
  socket under `/run` would not be reachable.
- `docker/php/opcache.ini` — `max_accelerated_files=20000` (codebase is ~9.8k
  PHP files; the stock 10000 sat at the edge and caused evictions),
  `interned_strings_buffer=16`, `memory_consumption=192`.

Verify the merged config inside the container:

```bash
sg docker -c "docker compose exec -T kasirsewa_app php-fpm -tt 2>&1 | grep -A2 '\[www\]'"
```

## Log rotation

`LOG_CHANNEL=stack` with the stock `LOG_STACK=single` appended to one file with
no rotation — that is how `laravel.log` reached ~5MB. The stack default is now
`daily` (14 days kept), and `LOG_STACK=daily` is set in `.env.example`.
