# Tenant subdomain DNS — wildcard for `*.superbackend.my.id`

> **This deployment routes public traffic through a Cloudflare Tunnel.**
> The apex and the `*` wildcard are CNAMEs to the tunnel (`kasirsewa-saas`),
> not A records to an origin IP. See `docs/cloudflare-tunnel.md` for the
> tunnel itself, and use `cloudflared tunnel route dns kasirsewa-saas
> '*.superbackend.my.id'` to (re)create the wildcard in one step. The
> dashboard/API A-record options below remain valid for a non-tunnelled setup.

The application already routes by host (see `App\Support\TenantDomain` and
`App\Http\Middleware\TenantDomainResolver`). Creating a tenant in the dashboard
only writes a `domain` value to the `tenants` table — it does **not** create a
DNS record. Every tenant therefore needs a hostname that resolves.

The base domain points at Cloudflare. The apex resolves today:

```
superbackend.my.id        -> 104.21.2.196 / 172.67.129.152   (proxied)
applikasi-apa-saja.superbackend.my.id -> (no answer)          <-- missing
```

## What to create

One wildcard record covers every tenant, including ones created later. Without
it, `https://<tenant>.superbackend.my.id` fails with `ERR_NAME_NOT_RESOLVED`
and the resolver never gets a chance to run.

| Type | Name | Content          | Proxy  | TTL  |
|------|------|------------------|--------|------|
| A    | `*`  | same origin as apex | Proxied | Auto |

`*` matches a single label only (`toko-a.superbackend.my.id`). That is what
tenant subdomains are, so one wildcard is enough. A tenant using a deeper
hostname would need its own record.

## Option A — Cloudflare dashboard

1. Log in, select the `superbackend.my.id` zone.
2. **DNS → Records → Add record**.
3. Type `A`, name `*`, IPv4 = the same origin IP the apex already uses
   (`104.21.2.196` — confirm the current value on the apex record first).
4. Proxy status: **Proxied** (orange cloud), so Cloudflare terminates TLS for
   every tenant without a per-tenant certificate.
5. Save. Then verify from any machine:

```
getent ahosts tenant-uji.superbackend.my.id | head -1   # should print an IP
```

## Option B — Cloudflare API (scripted)

`scripts/setup_wildcard_dns.sh` creates the wildcard record via the API. It
requires a token with `Zone:DNS:Edit` for this zone and reads it from the
environment — the token is never written to a file or echoed.

```
export CLOUDFLARE_API_TOKEN=...        # never commit this
export CLOUDFLARE_ZONE_ID=...          # zone overview page, right column
export CLOUDFLARE_ORIGIN_IP=104.21.2.196
bash scripts/setup_wildcard_dns.sh
```

The script is idempotent: it lists existing `*` records first and does nothing
if one is already present.

## After the record exists

Nothing in the codebase needs to change. The flow is:

1. Operator sets a tenant's subdomain in the dashboard →
   `TenantDomain::normalize()` validates it (rejects reserved labels, IPs,
   `http://`, ports, paths) and stores it.
2. A request to `https://<sub>.superbackend.my.id` resolves through the
   wildcard, reaches nginx, and `TenantDomainResolver` looks the host up in
   `tenants.domain`, binds `active_tenant_id`, and enforces that the logged-in
   user belongs to that tenant (super-admins excepted).

`tests/Feature/TenantSubdomainRoutingTest.php` locks all of that behaviour
against the `Host` header, so the routing is proven even before the wildcard
record is live.

## Note on the tenant-facing setup page

The main app is served at `https://saas.superbackend.my.id`. Tenant
subdomains are `*.superbackend.my.id`. Both live in the same wildcard's zone;
the reserved labels (`www`, `api`, `admin`, `saas`, …) are blocked by
`TenantDomain::RESERVED_LABELS` so a tenant can never claim a hostname the
platform needs.
