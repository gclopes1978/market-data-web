#!/usr/bin/env bash
# Smoke test for the production image.
#
# Why: the unit tests mock `fetch`, so they cannot prove that the *container* works.
# The things that can silently break are exactly the ones in the image: the Nginx template
# (envsubst of API_UPSTREAM), the /api and /health proxy, the SPA fallback and asset caching.
#
# How: start a fake API on the host, run the image pointing API_UPSTREAM at it, then probe it with curl.
# Usage: ./smoke/smoke-test.sh <image>      e.g. ./smoke/smoke-test.sh market-data-web:smoke
set -euo pipefail

IMAGE="${1:?usage: smoke-test.sh <image>}"
MOCK_PORT="${MOCK_PORT:-9999}"
WEB_PORT="${WEB_PORT:-8081}"
BASE="http://localhost:${WEB_PORT}"
MOCK_PID=""

# Always remove the container and stop the mock, even when a check fails.
cleanup() {
  docker rm -f smoke-web >/dev/null 2>&1 || true
  [[ -n "$MOCK_PID" ]] && kill "$MOCK_PID" 2>/dev/null || true
}
trap cleanup EXIT

node "$(dirname "$0")/mock-api.mjs" "$MOCK_PORT" &
MOCK_PID=$!

# host.docker.internal lets the container reach the mock on the host (same mechanism as docker-compose.yml).
docker run -d --name smoke-web -p "${WEB_PORT}:80" \
  --add-host host.docker.internal:host-gateway \
  -e API_UPSTREAM="http://host.docker.internal:${MOCK_PORT}" \
  "$IMAGE" >/dev/null

# Wait for Nginx; if it never starts, print its logs (typically a broken config template).
for i in $(seq 1 30); do
  curl -fs "$BASE/" >/dev/null 2>&1 && break
  if [[ "$i" == 30 ]]; then
    echo "FAIL nginx did not start"; docker logs smoke-web; exit 1
  fi
  sleep 1
done

failures=0
pass() { echo "PASS $1"; }
fail() { echo "FAIL $1"; failures=$((failures + 1)); }

# check <name> <path> <expected substring in body>
check() {
  local body
  if body=$(curl -fsS "$BASE$2" 2>/dev/null) && grep -q -- "$3" <<<"$body"; then pass "$1"; else fail "$1"; fi
}

check "index.html is served"            "/"                    '<div id="root">'
check "SPA fallback on unknown route"   "/some/deep/route"     '<div id="root">'
check "/health is proxied"              "/health"              'Healthy'
check "FX endpoint is proxied"          "/api/fx/EUR/USD"      '"rate":1.1188'
check "stock endpoint is proxied"       "/api/stocks/AAPL"     'Apple Inc.'

# Upstream errors must reach the browser unchanged so the UI can show its error state.
status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/fx/XXX/YYY")
[[ "$status" == "404" ]] && pass "upstream 404 is passed through" || fail "upstream 404 is passed through (got $status)"

# Hashed build assets must be cacheable forever (see location /assets/ in the Nginx template).
asset=$(curl -s "$BASE/" | grep -oE '/assets/[^"]+\.js' | head -1)
if [[ -n "$asset" ]] && curl -sI "$BASE$asset" | grep -qi 'immutable'; then pass "assets are cached as immutable"; else fail "assets are cached as immutable"; fi

echo "---"; [[ "$failures" == 0 ]] && echo "smoke test OK" || echo "$failures check(s) failed"
exit "$failures"
