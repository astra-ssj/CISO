# Astra CISO — multi-stage image
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Full toolchain used by migration/demo-seed jobs.
FROM deps AS tools
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate

FROM tools AS builder
# Build-time placeholders satisfy route/module initialization only. Runtime
# values are injected by Compose/Kubernetes and these credentials are never
# used to connect during the image build.
ENV DATABASE_URL="postgresql://astra:build-only@127.0.0.1:5432/astra"
ENV AUTH_SECRET="build-only-auth-secret-not-for-runtime-0000"
ENV NEXTAUTH_SECRET="build-only-auth-secret-not-for-runtime-0000"
ENV AI_PROVIDER="NONE"
ENV ASTRA_ENCRYPTION_KEY="build-only-encryption-secret-not-for-runtime"
RUN npx next build --webpack

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache wget su-exec && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
          /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm /usr/local/bin/pnpx

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/pg ./node_modules/pg
COPY --from=builder /app/node_modules/@prisma/adapter-pg ./node_modules/@prisma/adapter-pg
RUN chown -R nextjs:nodejs ./node_modules/.prisma ./node_modules/@prisma ./node_modules/pg ./node_modules/@prisma/adapter-pg 2>/dev/null || true

COPY --chown=root:root entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
