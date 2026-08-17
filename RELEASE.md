# Astra v3 — Decision Loop (release/v3-decision-loop)

This branch is a **separate release line** from v2.0 on `main`. Do not merge mock UI or silent intel fallbacks back into this line.

**Version:** `3.0.0-decision.2`  
**Previous slice:** `3.0.0-decision.1`

See [CHANGELOG.md](CHANGELOG.md), [HONESTY.md](HONESTY.md), and [ops/openneko/README.md](ops/openneko/README.md).

## What this release is

Astra is where security decisions get made, evidenced, and remembered.

- **Today:** deterministic skill catalog, Postgres snapshots, an honest decision queue, OpenNeko as a **sidecar** (watchers + approvals), not a wrapper.
- **Not claimed:** live IR, board-ready KPIs, autonomous vendor reject.

## What shipped in 3.0.0-decision.2

1. Prisma datasource is **Postgres 16** (`docker compose up -d postgres`). GraphJin allowlist in `ops/graphjin/config.yml`.
2. Full v1 skill catalog with golden tests, including `vendor.goNoGo`, `tabletop.score`, `intel.correlate`, `playbook.nextStep`, `caiq.draft`.
3. CAIQ → score → go/no-go → Risk; Shodan persists Observation **and** `AttackSurfaceScan`.
4. OpenNeko sidecar APIs: `/api/internal/watchers/tick`, `/api/internal/approvals`, `/api/internal/skills`. Dual-write `Approval` + `AuditLog`.
5. UI honesty: War Room binds `Incident` or exercise mode; ticker is not fake IOCs; Command Center Needs-you; AppSec/Roadmap hidden; remaining SAMPLE_/Math.random feeds emptied.

## What shipped in 3.0.0-decision.1

1. Skill catalog expanded (`caiq.score`, `risk.fiveByFive`, `evidence.expiry`); golden tests.
2. CAIQ engine persists SkillRuns; 5×5 Risk writes persist `risk.fiveByFive`.
3. OpenCTI / MISP / OTX / GitHub: live, last Observation, or empty — no `MOCK_*` IOCs.
4. Decision Center **Needs you** reads evidence expiry + open risks. Recorded decisions start empty.
5. Command Center threats/incidents, Defense Matrix, Incidents MTTR: empty or unscored.

## What shipped in 3.0.0-decision.0

1. APIs are session-gated. Public: `/login`, `/api/auth/*`, `/api/health`.
2. `Observation` and `SkillRun` Prisma models.
3. Skill `caiq.match@1.0.0` + `POST /api/skills/caiq-match`.
4. Abuse.ch client returns **empty** on failure, never mock IOCs.
5. Turbopack root pinned to this app directory.

## What is explicitly not in this release

- OpenNeko is **not** npm-installed into Next.js. Operator installs it beside the repo (see `ops/openneko/README.md`).
- Board KPI engine still hardcoded
- Compliance heatmap still seeded ISO annex

## Run

```bash
git checkout release/v3-decision-loop
docker compose up -d postgres
# DATABASE_URL=postgresql://astra:astra@localhost:5432/astra
npx prisma generate
npx prisma db push
npx prisma db seed
npx vitest run tests/unit/*.skill.test.ts
npm run dev
```

Set `ASTRA_INTERNAL_SECRET` for OpenNeko watchers. Set `OPENNEKO_URL` to show the briefing CTA.

Login: `ciso@astra.ai` / `admin123` (local seed only).
