# Astra-CISO — Multi-stage Dockerfile for Next.js standalone
FROM node:20-alpine AS base

# Install dependencies for native modules (better-sqlite3)
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate (schema at prisma/schema.prisma)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate

# Generate SQL for empty DB (applied at runtime via entrypoint; avoids Prisma CLI deps in image)
RUN DATABASE_URL="file:./dummy.db" npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script -o schema.sql

# Use webpack for production build (Turbopack/WASM unsupported in Alpine)
RUN npx next build --webpack

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Healthcheck + entrypoint: wget, su-exec, sqlite3 (apply schema.sql at runtime)
RUN apk add --no-cache wget su-exec sqlite

# Create non-root user (UID 1001 for volume ownership)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output and static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma client only (app uses it at runtime); schema.sql for DB init (no Prisma CLI at runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/schema.sql ./schema.sql
RUN chown -R nextjs:nodejs ./node_modules/.prisma ./node_modules/@prisma 2>/dev/null || true

# Data dir: volume mount at runtime; entrypoint chowns so nextjs can write
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Entrypoint: fix /app/data permissions, run prisma db push, then start server
COPY --chown=root:root entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/astra-ciso.db"

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
