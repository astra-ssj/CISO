# Honesty log — Astra v3 decision-loop

Living inventory. If a screen is not in **REAL** or **EMPTY**, it is still lying or mixed.

**Rule:** empty is honest. Silent mock is not.

Last updated: 17 August 2026 (`3.0.0-decision.1`)

## REAL (this slice)

| Surface | Why |
|---|---|
| Login / session | NextAuth + Prisma `User` |
| Vendor registry, Knowledge Base, CAIQ match | Prisma + `caiq.match` / `caiq.score` SkillRuns |
| Policies, Evidence vault, Audit logs | Prisma |
| 5×5 Risk register | Prisma `Risk` + `risk.fiveByFive` |
| Exercises (tabletop engine) | Prisma sessions; scenario library is static content (labeled as library, not live IR) |
| Abuse.ch / OpenCTI / MISP / OTX clients | Live, last Observation, or empty — no `MOCK_*` IOCs |
| Decision Center → Needs you | `GET /api/decision-queue` from evidence + open risks + SkillRuns |
| Command Center vendor/policy/playbook/evidence counts | APIs |
| Command Center Recent Incidents | `GET /api/incidents` (empty until rows exist) |
| Command Center Active Threats | live Abuse.ch or empty |

## EMPTY (honest, not mocked)

| Surface | What you see |
|---|---|
| Decision Center recorded list | Starts empty (persist key `astra-v3-decision-store`) |
| Defense Matrix cells | Em dash until a control assessment exists |
| Incidents MTTR / active count | Em dash; demo timeline removed |
| Incidents tabletop tab | Points at `/exercises` |
| GitHub Dependabot | Empty without `GITHUB_TOKEN` |
| OpenCTI/MISP/OTX UI | Empty without keys / when circuit open |

## STILL MIXED or MOCKED (do not claim)

Documented so we do not forget. Next slices.

| Surface | Issue |
|---|---|
| Command Center CompliancePosture | Hardcoded `FRAMEWORKS` |
| Command Center KPI sparklines / Executive Brief | `computeAllKPIs()` literals |
| Reports & Board Deck | `REPORT_TEMPLATES` / `RECENT_REPORTS` |
| Governance Compliance heatmap | `ANNEX_A_SEED` |
| KPI Dashboard tab | hardcoded engine + upload |
| War Room (`/incidents/war-room`) | `MOCK_INCIDENT` |
| GlobalThreatPulse | hardcoded ticker |
| MITRE matrix widget | `Math.random()` technique flips |
| Trivy API route | `MOCK_TRIVY_OUTPUT` |
| Contract analysis | `MOCK_NODES` |
| Vulnerability feed widget | `MOCK_VULNS` |
| Security events feed | `SAMPLE_EVENTS` |
| CAIQ review queue | in-memory Zustand |
| Incident Prisma model | unused by War Room |

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
