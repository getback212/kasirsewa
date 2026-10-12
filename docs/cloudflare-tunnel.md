# Cloudflare Tunnel — public access for KasirSewa

KasirSewa is reached from the internet **only** through a Cloudflare Tunnel
(`cloudflared`). Nothing on the host listens on ports 80/443 — the containers
publish the webserver on `127.0.0.1:8087` (well, `0.0.0.0:8087`) and the tunnel
forwards public traffic to it.

```
Internet ──► Cloudflare edge ──► cloudflared (user service)
                                   └─► http://127.0.0.1:8087 (kasirsewa_webserver)
```

## Components

| Piece | Location |
|-------|----------|
| Tunnel name | `kasirsewa-saas` (`f5c56fe3-dd7a-4f74-ac94-296a39db69d0`) |
| cloudflared config | `~/.cloudflared/config.yml` |
| Tunnel credentials | `~/.cloudflared/f5c56fe3-….json` (0600, **never commit**) |
| Account cert | `~/.cloudflared/cert.pem` |
| systemd user unit | `~/.config/systemd/user/cloudflared-kasirsewa.service` |
| Binary | `~/.local/bin/cloudflared` |

`config.yml` ingress:

```yaml
tunnel: f5c56fe3-dd7a-4f74-ac94-296a39db69d0
credentials-file: /home/lenori/.cloudflared/f5c56fe3-dd7a-4f74-ac94-296a39db69d0.json
ingress:
  - hostname: superbackend.my.id
    service: http://127.0.0.1:8087
  - hostname: "*.superbackend.my.id"
    service: http://127.0.0.1:8087
  - service: http_status:404
```

## Symptom: "site tidak bisa diakses" / HTTP 530

Cloudflare returns **530** (error 1033/1016) whenever the tunnel has no active
connection — the origin is unreachable. The two historical causes were:

1. **cloudflared was not running** (it was started by hand, not supervised).
2. **The credentials file was missing**, so `config.yml` could not start the
   tunnel at all.

Fix, in order:

```bash
# 1. Is it running?
systemctl --user status cloudflared-kasirsewa

# 2. Reconstruct the credentials file if it is missing
cloudflared tunnel token kasirsewa-saas | \
  python3 scripts/cloudflared-creds-from-token.py \
    ~/.cloudflared/f5c56fe3-dd7a-4f74-ac94-296a39db69d0.json

# 3. Start / restart and verify
systemctl --user restart cloudflared-kasirsewa
curl -s -o /dev/null -w '%{http_code}\n' https://superbackend.my.id/
```

The token printed by `cloudflared tunnel token` is a **secret** — pipe it
straight into the helper, never echo it or write it to git.

## Tenant subdomains

Routing a hostname to the tunnel creates the proxied DNS record in one step:

```bash
cloudflared tunnel route dns kasirsewa-saas '*.superbackend.my.id'   # once
cloudflared tunnel route dns kasirsewa-saas saas.superbackend.my.id  # app host
```

The wildcard CNAME makes every `*.superbackend.my.id` resolve to Cloudflare;
the tunnel's `*.superbackend.my.id` ingress then forwards it to nginx, where
`TenantDomainResolver` looks the host up in `tenants.domain`. A hostname with
no matching tenant is answered with **404** by the app — that is correct.

## Persistence

The unit is a **systemd user** service. `loginctl` has `Linger=yes`, so it
auto-starts at boot even without an interactive login and restarts on failure
(`Restart=always`). Reinstalling it:

```bash
mkdir -p ~/.config/systemd/user
cp infra/systemd/cloudflared-kasirsewa.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now cloudflared-kasirsewa
```

> The unit must **not** set `Group=` — systemd user services cannot switch to
> another group (`Group=docker` fails with status `216/GROUP`).
