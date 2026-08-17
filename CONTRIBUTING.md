# Contributing to Astra-CISO

Thank you for your interest in contributing. This line is **v3 decision-loop** on branch `release/v3-decision-loop`.

**Value test** (fail any → do not ship in the nav):

1. Does this create, evidence, or close a decision?
2. Is the data real (or clearly empty), never silently mocked?
3. Can the CISO show an auditor what happened?
4. Same inputs + same skill version → same output (or a labeled `ai_draft`)?

Skills compute. LLM drafts only. OpenNeko is a sidecar — do not `npm install` it into this Next.js app.

---

## Development Setup

### Prerequisites

- **Node.js 20+** (22 LTS recommended)
- **Docker** (Postgres 16)
- **npm**
- Git

### Getting Started

```bash
git clone https://github.com/astra-ssj/CISO.git
cd CISO
git checkout release/v3-decision-loop
cp .env.example .env.local
# AUTH_SECRET + DATABASE_URL=postgresql://astra:astra@localhost:5432/astra
docker compose up -d postgres
npm install
npx prisma generate && npx prisma db push && npx prisma db seed
npx vitest run tests/unit/*.skill.test.ts
npm run dev
# http://localhost:3000  —  ciso@astra.ai / admin123 (local seed only)
```

If host port 5432 is taken: `ASTRA_PG_PORT=5433 docker compose up -d postgres` and point `DATABASE_URL` at 5433.

### Verifying Your Setup

```bash
npx tsc --noEmit
npx eslint src/
npx vitest run
```

Golden tests for skills live in `tests/unit/*.skill.test.ts`.

---

## Branch Naming

```
release/  — Release lines (release/v3-decision-loop)
feature/  — New features (feature/caiq-export-pdf)
fix/      — Bug fixes (fix/threat-feed-cache)
docs/     — Documentation only
```

Do not merge silent `MOCK_*` intel or SAMPLE_ UI back onto this line.

---

## Commit Format

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat: persist vendor.goNoGo on finalize
fix: Notification.timestamp BigInt for Postgres
docs: Help Center matches HONESTY.md
```

---

## Pull Request Process

1. Branch from `release/v3-decision-loop` (v3 work) — do not target `main` with mock-stripping reverts
2. Pass `vitest`, `tsc --noEmit`, value test
3. Update `HONESTY.md` if a screen changes REAL / EMPTY / MIXED
4. Open a PR using the template

---

## Code Style

### TypeScript

- Strict mode — no `any`
- Zod at API boundaries
- Skills: no `fetch`, no `Math.random`, no `Date.now()` except as `asOf` input

### Data

- Prisma for business data (Postgres)
- Observation = append-only snapshots
- SkillRun = replayable compute
- Zustand for UI chrome only

### Intelligence

- Circuit breaker per client
- Cache **is** Observation (Shodan host 24h / search 1h)
- Failure: last Observation or empty — never `MOCK_*`

### OpenNeko

- Watchers: `POST /api/internal/watchers/tick` with `x-astra-internal-secret`
- Approvals dual-write `Approval` + `AuditLog`
- GraphJin allowlist: `ops/graphjin/config.yml`

---

## Dark Theme

| Token | Value |
|-------|-------|
| Background | `#050508` |
| Card BG | `rgba(8,12,24,0.85)` |
| Primary accent | `#38bdf8` |

---

## Questions?

Open an issue. See [HONESTY.md](HONESTY.md), [RELEASE.md](RELEASE.md), [src/lib/skills/README.md](src/lib/skills/README.md).
