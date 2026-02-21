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

# Use webpack for production build (Turbopack/WASM unsupported in Alpine)
RUN npx next build --webpack

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Healthcheck needs wget (Alpine)
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output and static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Persist SQLite DB (set DATABASE_URL in compose to file:/app/data/dev.db)
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
