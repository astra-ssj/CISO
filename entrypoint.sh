#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-postgresql://astra:astra@postgres:5432/astra}"

# Wait for Postgres (compose healthcheck already gates start; this is a safety net)
host=$(echo "$DATABASE_URL" | sed -n 's#.*@\([^:/]*\).*#\1#p')
host="${host:-postgres}"
i=0
while [ "$i" -lt 30 ]; do
  if node -e "const n=require('net');const s=n.connect(5432, process.env.H, ()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1))" H="$host"; then
    break
  fi
  i=$((i + 1))
  sleep 1
done

exec su-exec nextjs env DATABASE_URL="$DATABASE_URL" "$@"
