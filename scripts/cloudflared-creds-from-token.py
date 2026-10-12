#!/usr/bin/env python3
"""Reconstruct a cloudflared credentials JSON from a tunnel token.

The token printed by `cloudflared tunnel token <name>` is base64 of
{"a": accountTag, "t": tunnelID, "s": tunnelSecret}. This helper decodes it and
writes the credentials file cloudflared expects, mode 0600.

Usage:
    cloudflared tunnel token kasirsewa-saas | \
        python3 scripts/cloudflared-creds-from-token.py ~/.cloudflared/<id>.json

The token is read from stdin and never echoed.
"""
import base64
import json
import os
import sys

tok = sys.stdin.read().strip()
if not tok:
    print("FAILED: no token on stdin", file=sys.stderr)
    sys.exit(1)

pad = "=" * (-len(tok) % 4)
for decoder in (base64.b64decode, base64.urlsafe_b64decode):
    try:
        d = json.loads(decoder(tok + pad))
        if {"a", "t", "s"} <= set(d):
            break
    except Exception:
        continue
else:
    print("FAILED: could not decode token payload", file=sys.stderr)
    sys.exit(1)

out = sys.argv[1]
cred = {
    "AccountTag": d["a"],
    "TunnelSecret": d["s"],
    "TunnelID": d["t"],
    "Endpoint": "",
}
fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, "w") as f:
    json.dump(cred, f, indent=2)
print(f"OK: wrote {out} (tunnel {d['t']})")
