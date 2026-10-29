#!/bin/sh
set -eu

BASE_URL="${ASTRA_DEMO_BASE_URL:-http://127.0.0.1:3000}"
DEMO_EMAIL="${ASTRA_DEMO_EMAIL:-ciso@astra.ai}"
DEMO_PASSWORD="${ASTRA_DEMO_PASSWORD:-admin123}"

cleanup() {
  docker compose --profile demo down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

authenticate_demo_user() {
  rm -f /tmp/astra-cookies.txt /tmp/astra-session.json /tmp/astra-csrf.json

  curl -fsS \
    -c /tmp/astra-cookies.txt \
    "$BASE_URL/api/auth/csrf" \
    -o /tmp/astra-csrf.json

  CSRF_TOKEN="$(node -e '
const fs=require("fs");
const body=JSON.parse(fs.readFileSync("/tmp/astra-csrf.json","utf8"));
if (!body.csrfToken) process.exit(1);
process.stdout.write(body.csrfToken);
')"

  curl -sS \
    -b /tmp/astra-cookies.txt \
    -c /tmp/astra-cookies.txt \
    -o /tmp/astra-auth-response.txt \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "csrfToken=${CSRF_TOKEN}" \
    --data-urlencode "email=${DEMO_EMAIL}" \
    --data-urlencode "password=${DEMO_PASSWORD}" \
    --data-urlencode "callbackUrl=${BASE_URL}/" \
    "$BASE_URL/api/auth/callback/credentials" >/dev/null

  curl -fsS \
    -b /tmp/astra-cookies.txt \
    "$BASE_URL/api/auth/session" \
    -o /tmp/astra-session.json

  ASTRA_EXPECTED_EMAIL="$DEMO_EMAIL" node -e '
const fs=require("fs");
const session=JSON.parse(fs.readFileSync("/tmp/astra-session.json","utf8"));
if (session?.user?.email !== process.env.ASTRA_EXPECTED_EMAIL) {
  console.error("Credential authentication failed", session);
  process.exit(1);
}
console.log("Demo login OK:", session.user.email, session.user.role || "");
'
}

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

echo "Waiting for explicit demo seed and Auth.js credential login..."
i=0
until authenticate_demo_user >/tmp/astra-login-check.log 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "Demo login did not succeed." >&2
    cat /tmp/astra-login-check.log >&2 || true
    docker compose --profile demo logs --tail=200 >&2 || true
    exit 1
  fi
  sleep 2
done
cat /tmp/astra-login-check.log

echo "Restarting application container to verify persisted database-backed authentication..."
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

authenticate_demo_user

echo "Astra demo acceptance passed."
