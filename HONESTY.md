# Honesty log — Astra v3 decision-loop

Living inventory. If a screen is not in **REAL** or **EMPTY**, it is still lying or mixed.

**Rule:** empty is honest. Silent mock is not.

Last updated: 29 October 2026 (`chore/oss-v0.1-hardening`)

## REAL (this slice)

| Surface | Why |
|---|---|
| Login / session | NextAuth + Prisma `User` |
| Vendor registry, Knowledge Base, CAIQ match | Prisma + `caiq.match` / `caiq.score` SkillRuns |
| Vendor assessment recommendation | `vendor.goNoGo` + last Shodan Observation → PENDING Postgres `Decision`; human approval changes vendor status |
| Policies, Evidence vault, Audit logs | Prisma |
| 5×5 Risk register | Prisma `Risk` + `risk.fiveByFive` |
| Exercises (tabletop engine) | Prisma sessions; `tabletop.score` on finish |
| Abuse.ch / OpenCTI / MISP / OTX / Shodan | Live, last Observation, or empty — no `MOCK_*` IOCs |
| Attack surface | Observation + `AttackSurfaceScan` |
| Decision Center → Needs you | `GET /api/decision-queue` from evidence + open risks + SkillRuns |
| Command Center Needs-you | Same queue |
| Command Center vendor/policy/playbook/evidence counts | APIs |
| Command Center Recent Incidents | `GET /api/incidents` (empty until rows exist) |
| Command Center Active Threats | live Abuse.ch or empty |
| War Room | Bound `Incident` or labeled exercise mode |
| OpenNeko sidecar APIs | Secret-gated watchers, approvals, skill catalog |

## EMPTY (honest, not mocked)

| Surface | What you see |
|---|---|
| Decision Center recorded list | Postgres `Decision`; starts empty until a recommendation or operator creates one |
| Defense Matrix cells | Em dash until a control assessment exists |
| Incidents MTTR / active count | Em dash; demo timeline removed |
| Incidents tabletop tab | Points at `/exercises` |
| GitHub Dependabot | Empty without `GITHUB_TOKEN` |
| OpenCTI/MISP/OTX UI | Empty without keys / when circuit open |
| Trivy route | Empty (`trivy_not_wired`), never sample CVEs |
| MITRE catalog | Unscored reference; no fake detections |
| Vulnerability / security-event feeds | Empty until a scanner/SIEM writes Observations |
| Contract mindmap | Empty until a contract is uploaded |
| AppSec / Roadmap | Hidden from nav (fail the value test) |

## STILL MIXED (do not claim)

Documented so we do not forget.

| Surface | Issue |
|---|---|
| Command Center KPI sparklines / Executive Brief | `computeAllKPIs()` literals |
| Governance Compliance heatmap | `ANNEX_A_SEED` |
| KPI Dashboard tab | hardcoded engine + upload |
| CAIQ review queue | in-memory Zustand |
| Data-source connector | UI handshake only — telemetry is zero |

## Integrations envelope

`liveOrEmpty()` in `src/lib/observations/record.ts`:

1. Live fetch succeeds → append Observation `ok`
2. Live fails + last `ok` snapshot exists → return it, append Observation `stale`
3. Else → append Observation `empty`, return typed empty (never fake IOCs)

## Value test

1. Does this create, evidence, or close a decision?
2. Is the data real (or clearly empty)?
3. Can the CISO show an auditor what happened?
4. Same inputs + same skill version → same output (or a labeled draft)?


## OSS v0.1 hardening

- Recorded decisions are server-side Postgres records; localStorage is not authoritative.
- Vendor assessment finalization creates a recommendation and leaves the vendor `Under Review`.
- Approving a decision is the operation that may execute an allowlisted state change.
- AI can be disabled with `AI_PROVIDER=NONE`.
- Strategy/KPI, Incidents/War Room, Exercises, and Threat Intel remain in the codebase but are not part of the primary v0.1 navigation.
- Historical SQLite migration files are being replaced by a PostgreSQL baseline for clean installs.
