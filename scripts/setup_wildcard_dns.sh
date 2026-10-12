#!/usr/bin/env bash
# Create the wildcard DNS record that makes tenant subdomains resolve:
#   *.superbackend.my.id -> <origin IP>, proxied through Cloudflare.
#
# Requires a Cloudflare API token with Zone:DNS:Edit. Read from the
# environment only; never write the token to a file.
#
#   export CLOUDFLARE_API_TOKEN=...
#   export CLOUDFLARE_ZONE_ID=...
#   export CLOUDFLARE_ORIGIN_IP=104.21.2.196
#   bash scripts/setup_wildcard_dns.sh
set -euo pipefail

ZONE_NAME="${CLOUDFLARE_ZONE_NAME:-superbackend.my.id}"
: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN (Zone:DNS:Edit)}"
: "${CLOUDFLARE_ZONE_ID:?set CLOUDFLARE_ZONE_ID}"
ORIGIN_IP="${CLOUDFLARE_ORIGIN_IP:-}"
WILDCARD_NAME="*.${ZONE_NAME}"

API="https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records"
auth=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")

if [[ -z "${ORIGIN_IP}" ]]; then
  echo "CLOUDFLARE_ORIGIN_IP not set; reading the apex A record to reuse its IP..."
  ORIGIN_IP="$(curl -sS "${auth[@]}" "${API}?name=${ZONE_NAME}&type=A" \
    | python3 -c 'import json,sys; d=json.load(sys.stdin)["result"]; print(d[0]["content"] if d else "")')"
  [[ -n "${ORIGIN_IP}" ]] || { echo "Could not determine origin IP; set CLOUDFLARE_ORIGIN_IP."; exit 1; }
  echo "  apex origin IP = ${ORIGIN_IP}"
fi

echo "Checking for an existing ${WILDCARD_NAME} record..."
existing="$(curl -sS "${auth[@]}" "${API}?name=${WILDCARD_NAME}&type=A")"
count="$(printf '%s' "${existing}" | python3 -c 'import json,sys; print(len(json.load(sys.stdin).get("result",[])))')"

if [[ "${count}" != "0" ]]; then
  echo "Wildcard already exists (${count} record(s)). Nothing to do."
  exit 0
fi

echo "Creating ${WILDCARD_NAME} -> ${ORIGIN_IP} (proxied)..."
payload="$(python3 -c 'import json,sys; print(json.dumps({"type":"A","name":sys.argv[1],"content":sys.argv[2],"proxied":True,"ttl":1}))' "${WILDCARD_NAME}" "${ORIGIN_IP}")"

resp="$(curl -sS "${auth[@]}" -X POST "${API}" --data "${payload}")"
printf '%s' "${resp}" | python3 -c '
import json,sys
d=json.load(sys.stdin)
if not d.get("success"):
    print("FAILED:", json.dumps(d.get("errors", d))); sys.exit(1)
r=d["result"]; print("Created:", r["name"], "->", r["content"], "proxied=" + str(r["proxied"]))
'

echo "Verify with: getent ahosts tenant-uji.${ZONE_NAME} | head -1"
