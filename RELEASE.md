# Astra v3 — Decision Loop (release/v3-decision-loop)

This branch is a **separate release line** from v2.0 on `main`. Do not merge mock UI or silent intel fallbacks back into this line.

**Version:** `3.0.0-decision.1`  
**Previous slice:** `3.0.0-decision.0`

See [CHANGELOG.md](CHANGELOG.md) and [HONESTY.md](HONESTY.md).

## What this release is

Astra is where security decisions get made, evidenced, and remembered.

- **Today:** deterministic skills (`caiq.match`, `caiq.score`, `risk.fiveByFive`, `evidence.expiry`) + knowledge base + audit trail + an honest decision queue.
- **Not yet:** OpenNeko sidecar, Postgres cutover, War Room as live IR.

## What shipped in 3.0.0-decision.1

1. Skill catalog expanded; golden tests for each new skill.
2. CAIQ engine persists SkillRuns; 5×5 Risk writes persist `risk.fiveByFive`.
3. OpenCTI / MISP / OTX / GitHub: live, last Observation, or empty — no `MOCK_*` IOCs.
4. Decision Center **Needs you** reads evidence expiry + open risks. Recorded decisions start empty.
5. Command Center threats/incidents, Defense Matrix, Incidents MTTR: empty or unscored, never SAMPLE_/Math.random theater.
6. `GET /api/decision-queue`, `GET /api/skills/runs`, `GET /api/incidents`.
7. Living docs: `HONESTY.md`, `src/lib/skills/README.md`.

## What shipped in 3.0.0-decision.0

1. APIs are session-gated. Public: `/login`, `/api/auth/*`, `/api/health`.
2. `Observation` and `SkillRun` Prisma models.
3. Skill `caiq.match@1.0.0` + `POST /api/skills/caiq-match`.
4. Abuse.ch client returns **empty** on failure, never mock IOCs.
5. Turbopack root pinned to this app directory.

## What is explicitly not in this release

- OpenNeko install / GraphJin / Postgres
- War Room still uses `MOCK_INCIDENT` (see HONESTY.md)
- Board KPI engine still hardcoded
- Compliance heatmap still seeded ISO annex

## Run

```bash
git checkout release/v3-decision-loop
npx prisma db push
npx prisma db seed
npx vitest run tests/unit/caiq-match.skill.test.ts tests/unit/caiq-score.skill.test.ts tests/unit/risk-five-by-five.skill.test.ts tests/unit/evidence-expiry.skill.test.ts
npm run dev
```

Login: `ciso@astra.ai` / `admin123` (local seed only).
