#!/bin/sh
set -e

# 1. Set DATABASE_URL before any DB commands (compose may override)
export DATABASE_URL="${DATABASE_URL:-file:/app/data/astra-ciso.db}"

# 2. Ensure /app/data exists and is writable by app user (UID 1001 = nextjs)
mkdir -p /app/data
chown -R nextjs:nodejs /app/data 2>/dev/null || true

# 3. Create DB and tables before server starts (schema.sql approach; no Prisma CLI in image)
if [ -f /app/schema.sql ] && [ ! -f /app/data/astra-ciso.db ]; then
  sqlite3 /app/data/astra-ciso.db < /app/schema.sql
  # Seed demo user for login (ciso@astra.ai / password123)
  if [ -f /app/docker-seed-user.sql ]; then
    sqlite3 /app/data/astra-ciso.db < /app/docker-seed-user.sql
  fi
  chown -R nextjs:nodejs /app/data
fi

# 4. Start the server (pass DATABASE_URL so Node/Prisma see it)
exec su-exec nextjs env DATABASE_URL="$DATABASE_URL" "$@"
