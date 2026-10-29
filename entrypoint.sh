#!/bin/sh
set -eu

export DATABASE_URL="${DATABASE_URL:-postgresql://astra:astra_local@postgres:5432/astra}"

host=$(echo "$DATABASE_URL" | sed -n 's#.*@\([^:/]*\).*#\1#p')
host="${host:-postgres}"

i=0
until H="$host" node -e "const n=require('net');const s=n.connect(5432, process.env.H,()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1))"; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "Postgres did not become reachable at $host:5432" >&2
    exit 1
  fi
  sleep 1
done

exec su-exec nextjs env DATABASE_URL="$DATABASE_URL" "$@"
