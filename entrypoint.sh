#!/bin/sh
set -e

# Ensure DATABASE_URL for app (compose may override)
export DATABASE_URL="${DATABASE_URL:-file:/app/data/astra-ciso.db}"

# Ensure /app/data is writable by app user (volume may mount as root)
chown -R nextjs:nodejs /app/data 2>/dev/null || true

# Create DB and tables on first run: apply schema.sql with sqlite3 (no Prisma CLI deps in image)
if [ -f /app/schema.sql ] && [ ! -f /app/data/astra-ciso.db ]; then
  sqlite3 /app/data/astra-ciso.db < /app/schema.sql
  chown nextjs:nodejs /app/data/astra-ciso.db
fi

# Start the server
exec su-exec nextjs "$@"
