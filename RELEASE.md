# Astra v3 — Decision Loop (release/v3-decision-loop)

This branch is a **separate release line** from v2.0 on `main`. Do not merge mock UI or silent intel fallbacks back into this line.

**Version:** `3.0.0-decision.0`

## What this release is

Astra is where security decisions get made, evidenced, and remembered.

- **Today:** deterministic `caiq.match` skill + knowledge base + audit trail.
- **Not yet on this slice:** OpenNeko sidecar, Postgres cutover, Decision Center rewrite.

## What shipped in 3.0.0-decision.0

1. APIs are session-gated. Public: `/login`, `/api/auth/*`, `/api/health`.
2. `Observation` and `SkillRun` Prisma models (append-only snapshots + replayable skill outputs).
3. Skill `caiq.match@1.0.0` — pure function, golden tests, `POST /api/skills/caiq-match`.
4. Abuse.ch client returns **empty** on failure, never mock IOCs.
5. Turbopack root pinned to this app directory.

## What is explicitly not in this release

- OpenNeko install / GraphJin
- Remaining intel clients (OpenCTI/MISP/OTX) still have mock fallbacks — next slice
- Decision Center `DEMO_DECISIONS` still present — next slice
- Postgres migration — next slice

## Run

```bash
git checkout release/v3-decision-loop
npx prisma db push
npx prisma db seed
npm test -- tests/unit/caiq-match.skill.test.ts
npm run dev
```
