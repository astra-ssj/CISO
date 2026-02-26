# Contributing to Astra-CISO

Thank you for your interest in contributing! This guide covers the development setup and conventions.

---

## Development Setup

### Prerequisites

- **Node.js 22+** (LTS recommended)
- **npm** (included with Node.js)
- Git

### Getting Started

```bash
git clone https://github.com/SristiNative/astra-ciso.git
cd astra-ciso
npm install
cp .env.example .env.local
# Edit .env.local — add at least one AI provider key
npx prisma db push
npm run dev
# Open http://localhost:3000
```

### Verifying Your Setup

```bash
npx tsc --noEmit       # Type check
npx eslint src/        # Lint
npx vitest run         # Tests
npm run build          # Production build
```

---

## Branch Naming

```
feature/  — New features (feature/caiq-export-pdf)
fix/      — Bug fixes (fix/threat-feed-cache)
refactor/ — Code restructuring (refactor/intelligence-client)
docs/     — Documentation only (docs/update-roadmap)
```

---

## Commit Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Shodan vendor scan endpoint
fix: resolve circuit breaker timeout race condition
refactor: extract signal aggregator from intelligence service
docs: update HIGH_LEVEL_DESIGN for v2.0
chore: upgrade Prisma to 7.4
```

---

## Pull Request Process

1. Fork the repository and create your feature branch
2. Make your changes with clear, focused commits
3. Ensure all checks pass (`tsc --noEmit`, `eslint`, `vitest run`, `npm run build`)
4. Open a PR against `main` using the PR template
5. Request review from `@SristiNative`

---

## Code Style

### TypeScript

- **Strict mode** — no `any` types (use `unknown` and narrow)
- **Zod validation** at API boundaries — all request bodies validated
- **Explicit return types** on exported functions
- **Prefer `interface` over `type`** for object shapes

### Imports

- Use `@/` path alias for project imports
- Group imports: externals → internals → types
- No circular imports

### Components

- One component per file
- Use React Server Components by default, `'use client'` only when needed
- JetBrains Mono for metrics/numbers, DM Sans for labels/text

---

## Intelligence Module Conventions

If you're working on the intelligence module (`src/lib/intelligence/`), follow these patterns:

### API Clients

- All API clients use the **circuit breaker** pattern
- **Cache with TTL** — never make uncached API calls
- **Graceful degradation** — return cached data or empty state on failure
- **Rate limiting** — respect provider limits (Shodan: 1 req/sec)

### Abuse.ch APIs

- **ThreatFox & MalwareBazaar:** JSON POST bodies
- **URLhaus:** Form-encoded POST bodies
- All three are free, no API key required

### Shodan

- Free tier: 1 request/second, limited search credits
- Cache host lookups for 24 hours, search results for 1 hour
- All lookups logged to the immutable audit trail

### Data Layers

- Static layers load from `src/data/intelligence/*.json`
- API-fed layers show "Configure in Settings" if key is missing
- All layers support toggle on/off in LayerControlPanel

---

## Dark Theme

The platform uses a dark hacker theme (Bloomberg Terminal aesthetic):

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#050508` | Page background |
| Card BG | `rgba(8,12,24,0.85)` | Card backgrounds |
| Card Border | `rgba(56,189,248,0.06)` | Card borders |
| Primary accent | `#38bdf8` | Primary actions |
| Success | `#4ade80` | Positive metrics |
| Warning | `#fbbf24` | Caution states |
| Critical | `#ef4444` | Alerts, errors |

---

## Questions?

Open an issue or reach out to [@SristiNative](https://github.com/SristiNative).
