#!/bin/sh
set -eu

BASE_URL="${ASTRA_DEMO_BASE_URL:-http://127.0.0.1:3000}"
DEMO_EMAIL="${ASTRA_DEMO_EMAIL:-ciso@astra.ai}"
DEMO_PASSWORD="${ASTRA_DEMO_PASSWORD:-admin123}"

cleanup() {
  docker compose --profile demo down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

cp .env.example .env

docker compose --profile demo up -d --build

echo "Waiting for Astra health endpoint..."
i=0
until curl -fsS "$BASE_URL/api/health" >/tmp/astra-health.json 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "Astra did not become healthy." >&2
    docker compose --profile demo ps >&2 || true
    docker compose --profile demo logs --tail=200 >&2 || true
    exit 1
  fi
  sleep 2
done

node -e '
const fs=require("fs");
const health=JSON.parse(fs.readFileSync("/tmp/astra-health.json","utf8"));
if (health.status !== "healthy" || health.services?.database !== true) {
  console.error("Unexpected health response", health);
  process.exit(1);
}
console.log("Health OK:", health.status, "version:", health.version);
'

echo "Waiting for explicit demo seed and credential login..."
i=0
while :; do
  http_code=$(curl -sS -o /tmp/astra-login.json -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${DEMO_EMAIL}\",\"password\":\"${DEMO_PASSWORD}\"}" \
    "$BASE_URL/api/auth/login" || true)

  if [ "$http_code" = "200" ]; then
    break
  fi

  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "Demo login did not succeed. Last HTTP status: $http_code" >&2
    cat /tmp/astra-login.json >&2 || true
    docker compose --profile demo logs --tail=200 >&2 || true
    exit 1
  fi
  sleep 2
done

node -e '
const fs=require("fs");
const body=JSON.parse(fs.readFileSync("/tmp/astra-login.json","utf8"));
if (body.success !== true || body.user?.email !== process.env.ASTRA_DEMO_EMAIL && body.user?.email !== "ciso@astra.ai") {
  console.error("Unexpected login response", body);
  process.exit(1);
}
console.log("Demo login OK:", body.user.email, body.user.role);
'

echo "Restarting application container to verify persisted database state..."
docker compose restart astra-ciso >/dev/null

i=0
until curl -fsS "$BASE_URL/api/health" >/tmp/astra-health-after-restart.json 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "Astra did not recover after restart." >&2
    docker compose --profile demo logs --tail=200 >&2 || true
    exit 1
  fi
  sleep 2
done

http_code=$(curl -sS -o /tmp/astra-login-after-restart.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${DEMO_EMAIL}\",\"password\":\"${DEMO_PASSWORD}\"}" \
  "$BASE_URL/api/auth/login")

if [ "$http_code" != "200" ]; then
  echo "Demo login failed after restart." >&2
  cat /tmp/astra-login-after-restart.json >&2 || true
  exit 1
fi

echo "Astra demo acceptance passed."
