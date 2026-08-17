# Astra-CISO Codebase Analysis

**Date:** 17 August 2026 (inventory) · **v3 progress:** 17 August 2026 (`3.0.0-decision.2` on `release/v3-decision-loop`)  
**Repo root:** `CISO/CISO`  
**Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Prisma 7, Postgres 16, Zustand, NextAuth 5  

> **v3 note:** Sections below are the original read-only inventory. They are **historical**. For what is true on this branch now, read [HONESTY.md](HONESTY.md), [RELEASE.md](RELEASE.md), and [CHANGELOG.md](CHANGELOG.md). In particular: `/api` is no longer public; `caiq.match` is a skill; OpenCTI/MISP/OTX no longer return `MOCK_*`; Decision Center no longer seeds `DEMO_TICKETS`.

### v3 progress vs this inventory

| Inventory claim (Aug 17 snapshot) | Status on 3.0.0-decision.2 |
|---|---|
| All `/api/*` public | Fixed in 3.0.0-decision.0 |
| `DEMO_DECISIONS` / `DEMO_TICKETS` | Removed; Needs-you queue is real |
| Intel `MOCK_*` fallbacks | Removed (Abuse.ch, OpenCTI, MISP, OTX) |
| Command Center `SAMPLE_*` | Removed for incidents + threats |
| Defense Matrix `Math.random()` | Unscored cells |
| No Observation / SkillRun | Added; CAIQ, 5×5, go/no-go persist runs |
| SQLite only | Postgres 16 + GraphJin allowlist |
| OpenNeko | Sidecar APIs + runbook; not merged into Next.js |
| War Room / board KPIs / compliance heatmap | War Room exercise-or-bound; board KPIs still mixed — see HONESTY.md |

This is a read-only inventory. No application code was changed as part of **this report**. Application changes live on the v3 branch and are listed in CHANGELOG.

**Method:** static review of 21 `page.tsx` files, 96 `route.ts` API files, `prisma/schema.prisma`, local `./dev.db`, `src/components/layout/Shell.tsx`, auth/middleware, and import graphs. TypeScript (`tsc --noEmit`) and ESLint were reported clean at analysis time.

**Caveat:** Docker uses a separate database (`file:/app/data/astra-ciso.db` on volume `astra-ciso-data`). Row counts below are from local `./dev.db` only. That Docker DB was not inspected.

---

## 1. Scope and architecture notes

`.cursorrules` describes **8 modules** and **11 sidebar items**. The running app has **13 sidebar items** (adds **Exercises** and **Integrations**) and tabletop content in both Incidents (demo tab) and Exercises (Prisma-backed engine).

There is a nested duplicate project: parent `CISO/` and this app `CISO/CISO/`, each with `package.json`, `package-lock.json`, and a `dev.db`. Next.js Turbopack warns that it inferred the parent as workspace root. Vitest unit tests fail for the same reason.

Auth is JWT (NextAuth 5). Dashboard pages are session-gated via middleware. **All `/api/*` paths are treated as public** in `src/auth.config.ts`.

---

## 2. Page and feature map

Classification:

- **REAL** — Prisma, NextAuth, or a live external API with no hardcoded fallback in the UI path
- **MIXED** — some real persistence/APIs plus hardcoded arrays, mock clients, or localStorage
- **MOCKED** — hardcoded data, `Math.random()`, static JSON/TS content, or demo seeds with no DB write

### 2.1 Sidebar (`src/components/layout/Shell.tsx`)

| # | Label | Route |
|---|---|---|
| 1 | Command Center | `/` |
| 2 | Decision Center | `/decisions` |
| 3 | Strategy & OKRs | `/strategy` |
| 4 | Governance & Risk | `/governance` |
| 5 | Vendor Risk | `/vendors` |
| 6 | Incidents | `/incidents` |
| 7 | Exercises | `/exercises` |
| 8 | Threat Intel | `/intelligence` |
| 9 | AppSec | `/appsec` |
| 10 | Integrations | `/integrations` |
| 11 | Settings | `/settings` |
| 12 | Help Center | `/help` |
| 13 | Roadmap | `/roadmap` |

**Not in sidebar (reachable):** `/login`, `/incidents/war-room`, `/vendors/caiq-review`, `/exercises/guide`, `/exercises/history`, `/exercises/[sessionId]`, `/intelligence/ransomware` (also an Intelligence tab).

**Global chrome (every dashboard page):** `GlobalThreatPulse` (MOCKED ticker), `NotificationCenter`, `ChatInterface`, `ProductTour`.

---

### 2.2 Login

#### `/login` — REAL (cosmetic MOCKED)

- **Files:** `src/app/login/page.tsx`, `src/app/login/login-client.tsx`
- **What:** Credentials login via NextAuth; Google SSO button only if `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.
- **REAL:** `signIn('credentials')`, Prisma `User`.
- **MOCKED:** terminal “decrypting keys” animation after a successful login.
- **Demo fill buttons:** `ciso@astra.ai` / `admin123`, `analyst@astra.ai` / `user123`.

---

### 2.3 Command Center — `/`

**File:** `src/app/(dashboard)/page.tsx`  
**Tabs:** Overview | Executive Brief | Reports & Board Deck

| Tab / widget | Classification | Evidence |
|---|---|---|
| Overview — vendor/policy/playbook/evidence counts | REAL | Zustand stores → `/api/vendor-risk`, `/api/policies`, `/api/playbooks`, `/api/evidence` |
| Overview — `PendingActions` | REAL | `getRisks()` Prisma server actions |
| Overview — `ActiveThreats` | MIXED | `/api/intelligence/threats` (Abuse.ch) with `SAMPLE_THREATS` fallback |
| Overview — `AIActivity` | MIXED | `/api/health` plus static presentation |
| Overview — `CompliancePosture` | MOCKED | `FRAMEWORKS` hardcoded in `CompliancePosture.tsx` |
| Overview — `RecentIncidents` | MOCKED | `SAMPLE_INCIDENTS` |
| Overview — `KPIStatusBar` | MIXED | Prisma risks + static sparklines |
| Header — `GlobalThreatPulse` | MOCKED | `EVENTS`, `LEADERBOARD` constants |
| Executive Brief | MIXED | `useDecisionStore` demo seed + `computeAllKPIs()` literals + real OKRs |
| Reports & Board Deck | MOCKED | `REPORT_TEMPLATES`, `RECENT_REPORTS` in `reports-tab.tsx` |

---

### 2.4 Decision Center — `/decisions`

**Tabs:** Decisions | Action Queue

| Tab | Classification | Evidence |
|---|---|---|
| Decisions | MOCKED | `DEMO_DECISIONS` in `src/lib/decision-engine/router.ts`, persisted in Zustand localStorage |
| Action Queue | MOCKED | `DEMO_TICKETS` array in `decisions/page.tsx` |

No Prisma model backs this module.

---

### 2.5 Strategy & OKRs — `/strategy`

**Tabs:** OKRs | Defense Matrix | KPI Dashboard | Program Tracker

| Tab | Classification | Evidence |
|---|---|---|
| OKRs | REAL | `useOKRProjectStore` → `/api/okr` → `Objective` |
| Program Tracker | REAL | `/api/okr` → `Project` |
| KPI Dashboard | MOCKED + optional upload | `computeAllKPIs()` hardcoded in `src/lib/kpi-engine/kpi-engine.ts`; uploads via `/api/kpi-upload` + localStorage |
| Defense Matrix | MOCKED | `Math.floor(Math.random() * 100)` per cell in `strategy/page.tsx` |

---

### 2.6 Governance & Risk — `/governance`

**Tabs:** Compliance | Risk Register | Policy Engine | Audit Logs | Evidence Vault

| Tab | Classification | Evidence |
|---|---|---|
| Compliance | MOCKED | `ANNEX_A_SEED` ISO controls in `compliance-heatmap.tsx` |
| Risk Register | REAL (empty locally) | `getRisks()` / `Risk` model — 0 rows in `dev.db` |
| Policy Engine | REAL | `/api/policies` + `POLICY_TEMPLATES` for create UX |
| Audit Logs | REAL | `/api/audit-logs`, stats, export |
| Evidence Vault | REAL | `EvidenceVaultV2` → `/api/evidence/*` |

---

### 2.7 Vendor Risk

#### `/vendors`

**Tabs:** Quick Answer | Knowledge Transfer | Knowledge Base | Review Queue | Vendor Registry

| Tab | Classification | Evidence |
|---|---|---|
| Vendor Registry | REAL | `/api/vendor-risk` (Prisma); Shodan vendor scan if keyed |
| Knowledge Base | REAL | `/api/knowledge*` → `KnowledgeEntry` (1,129 rows) |
| Quick Answer / Knowledge Transfer | MIXED | `/api/caiq/*`, `/api/vendors/caiq/*`, AI enhance; hardcoded KB fallback in `caiq-answer-engine.ts` |
| Review Queue | MIXED | in-memory `useCAIQReviewStore` + assess/finalize APIs |

#### `/vendors/caiq` — MIXED, orphaned

Standalone CAIQ wizard. **No inbound `href` / `router.push` found.** Vendor Risk already embeds `CAIQWizard` / `QuickAnswerWidget` on `/vendors`.

#### `/vendors/caiq-review` — MIXED

Deep-link wrapper around `CAIQReviewQueueTab`. Also available as the Review Queue tab on `/vendors`.

---

### 2.8 Incidents

#### `/incidents`

**Tabs:** Incident Response | Tabletop Exercises

| Piece | Classification | Evidence |
|---|---|---|
| Playbooks | REAL | `usePlaybookStore` → `/api/playbooks` |
| Timeline / SLA / MTTR | MOCKED | `DEMO_TIMELINE`, `DEMO_SLA`, hardcoded “45m”, “Active Incidents: 0” |
| Tabletop tab on this page | MOCKED | `DEMO_EXERCISES` in `incidents/page.tsx` (real engine lives under `/exercises`) |

`Incident` and `IncidentEvent` Prisma models are unused by this UI.

#### `/incidents/war-room` — MIXED

- **MOCKED:** `MOCK_INCIDENT`, `PLAYBOOK_ITEMS`
- **REAL (when AI configured):** `consultCommandCenter` in `src/app/actions/war-room-ai.ts`

---

### 2.9 Exercises (tabletop)

| Route | Classification | Notes |
|---|---|---|
| `/exercises` | MIXED | Scenario library is static TS (`src/lib/exercises/scenarios/*`); last-run timestamps from Prisma |
| `/exercises/[sessionId]` | REAL sessions | `getSession()` Prisma; scenario content still static |
| `/exercises/guide` | MOCKED | Static facilitator/auditor docs |
| `/exercises/history` | REAL | `getSessionHistory()`, `getExercisePatterns()` — weakly linked (from guide, not home) |

Runtime seed: `ensureScenariosSeeded()` creates 3 `TabletopScenario` rows (supply-chain, insider, ransomware).

---

### 2.10 Intelligence — `/intelligence`

**Tabs:** Threat Briefing | Campaigns | IOC Explorer | ATT&CK Heatmap | Feed Manager | Enrichment | World Monitor | Ransomware | Attack Surface

Overall: **MIXED**. Live clients fall back to `MOCK_*` constants when keys are missing or APIs fail (`abusech-client.ts`, `opencti-client.ts`, `misp-client.ts`, `otx-client.ts`).

| Tab | Classification | Notes |
|---|---|---|
| Threat Briefing | MIXED | `/api/intelligence/dashboard`; CII scores hardcoded in `ThreatBriefing.tsx` |
| Campaigns | MIXED | `/api/intelligence/campaigns` |
| IOC Explorer | MIXED | `/api/intelligence/indicators` |
| ATT&CK Heatmap | MIXED | API + `STATIC_TECHNIQUES` |
| Feed Manager | MIXED | `/api/intelligence/feeds` |
| Enrichment | MIXED | OpenCTI, MISP, Abuse.ch, Shodan |
| World Monitor | MIXED | Geo layers from `src/data/intelligence/*.json`; cyber layer from `/api/intelligence/threats` with `Math.random()` jitter |
| Ransomware | MIXED | UI labels ransomware; data mapped from MalwareBazaar via `/api/intelligence/malware` |
| Attack Surface | REAL if keyed | `/api/intelligence/shodan/attack-surface`; empty/error states if no `SHODAN_API_KEY`. Scans are **not** written to `AttackSurfaceScan`. |

`.cursorrules` still lists Signal Intelligence, Infrastructure, Military & Maritime, Live Feeds as Intelligence tabs. Those wrappers exist under `src/components/intelligence/tabs/` but are **not rendered**. Current page uses the nine tabs above.

`/intelligence/ransomware` exists as a page and is also dynamically imported as the Ransomware tab.

---

### 2.11 AppSec — `/appsec`

**MIXED.** Findings become real when the user uploads Semgrep/Trivy/Gitleaks JSON or syncs GitHub Dependabot/secret scanning (`GITHUB_PAT`). Persistence is **localStorage** (`useAppSecStore`), not Prisma. Pipeline widget (`PIPELINE_DATA`) and “98.2% Uptime” / `mttf: '24h'` are MOCKED. No Vulnerability model.

---

### 2.12 Integrations — `/integrations`

**MIXED.** Catalog is static (`INTEGRATIONS_REGISTRY`). Connection status is Prisma `Integration`. Non-phase-1 items show “Coming in v2.2”.

---

### 2.13 Settings — `/settings`

**Tabs:** AI Provider | Team | Security Policies | Preferences | AI Economics | Companies & Products | Integrations

| Tab | Classification |
|---|---|
| Team | REAL — `/api/team/users`, `/api/team/invite` |
| Companies & Products | REAL APIs, **empty DB** |
| AI Economics | REAL — `/api/admin/metrics` |
| Integrations (Shodan test) | REAL if keyed |
| AI Provider | MIXED — `/api/agent/analyze`; keys described as session-memory only |
| Security Policies | MOCKED — local React state, no API |
| Preferences / notification toggles | MOCKED — local state |

---

### 2.14 Help — `/help` — MOCKED

Static articles in `src/lib/help/help-content.ts`.

### 2.15 Roadmap — `/roadmap` — MOCKED

Hardcoded `ROADMAP` in `src/lib/roadmap-data.ts`.

---

### 2.16 Feature summary

| Feature | Data |
|---|---|
| Login / auth | REAL |
| Command Overview | MIXED |
| Executive Brief | MIXED |
| Reports & Board Deck | MOCKED |
| Decisions feed | MOCKED |
| Action Queue | MOCKED |
| OKRs / Projects | REAL |
| Defense Matrix | MOCKED |
| KPI Dashboard (computed) | MOCKED |
| KPI file upload | REAL (file + localStorage) |
| Risk Register | REAL (empty) |
| Compliance Heatmap | MOCKED |
| Policies | REAL |
| Audit Logs | REAL |
| Evidence Vault | REAL |
| Vendor Registry | REAL |
| Knowledge Base | REAL |
| CAIQ workflows | MIXED |
| Incident Playbooks | REAL |
| Incident timeline / metrics | MOCKED |
| Incidents tabletop tab | MOCKED |
| War Room | MIXED |
| Exercise engine | REAL sessions |
| Exercise scenarios | MOCKED (static TS) |
| Intelligence (overall) | MIXED |
| World Monitor geo | MOCKED/static JSON |
| Attack Surface / Shodan | REAL if keyed |
| Ransomware tab | MIXED |
| AppSec findings | MIXED |
| Integrations page | MIXED |
| Settings team/companies | REAL |
| Settings policies/notifications | MOCKED |
| Help Center | MOCKED |
| Roadmap | MOCKED |
| Global Threat Pulse | MOCKED |
| Global Chat | MIXED (provider-dependent; MOCK provider exists) |

---

## 3. Prisma models and local DB state

**Inspected:** `./dev.db` (`DATABASE_URL=file:./dev.db`). All 34 tables exist.

Docker: `DATABASE_URL=file:/app/data/astra-ciso.db` — independent of local `dev.db`.

### 3.1 Inventory

| # | Model | Purpose | Seeded? | Rows (`dev.db`) | State | Issues |
|---|---|---|---|---|---|---|
| 1 | User | Auth, RBAC | Yes (3) | 3 | Has data | `mfaEnabled` never enrolled; `emailVerified` unused (JWT) |
| 2 | Account | OAuth linking | No | 0 | Empty / orphaned | JWT strategy; `@auth/prisma-adapter` unused |
| 3 | Session | DB sessions | No | 0 | Empty / orphaned | JWT — unused |
| 4 | VerificationToken | Email verify | No | 0 | Empty / orphaned | No magic-link flow |
| 5 | Authenticator | WebAuthn | No | 0 | Empty / orphaned | No passkey UI |
| 6 | RiskScenario | FAIR quantitative risk | Yes (1) | 1 | Has data | **No UI** — API `/api/risks` only; name clash with `Risk` |
| 7 | RiskScenarioHistory | FAIR timeline | No | 0 | Empty | Written only on FAIR API update |
| 8 | Risk | 5×5 register (Governance UI) | No | 0 | Empty | Not seeded; UI is empty until CAIQ finalize or manual add |
| 9 | RiskHistory | Risk field audit | No | 0 | Empty | |
| 10 | Policy | ISMS documents | Yes (1) | 2 | Has data | JSON blobs; no `createdAt`; `owner` vs `authorId` |
| 11 | Incident | Active incidents | No | 0 | Empty / orphaned | UI uses mocks |
| 12 | IncidentEvent | Incident timeline | No | 0 | Empty / orphaned | |
| 13 | Vendor | Third-party registry | Yes (2) | 2 | Has data | Certs as JSON string |
| 14 | VendorAssessment | Vendor scores | Yes (1) | 1 | Has data | `assessedBy` not a User FK |
| 15 | Evidence | Evidence vault | Yes (2) | 2 | Has data | Seed `filePath` often empty; `companyId` has no Company relation |
| 16 | EvidenceLink | Polymorphic links | No | 0 | Empty | No FK integrity |
| 17 | Objective | OKRs | Yes (1) | 1 | Has data | `owner` / `linkedRisks` as strings/JSON |
| 18 | Project | Program tracker | Yes (1) | 1 | Has data | Same JSON pattern |
| 19 | Notification | In-app alerts | Yes (2) | 2 | Has data | Dual `timestamp` (Int) + `createdAt` |
| 20 | AlertRule | Alert config | Yes (2) | 2 | Has data | No evaluator engine wired to DB |
| 21 | Playbook | IR playbooks | Yes (2) | 2 | Has data | Not linked to `Incident` |
| 22 | AuditLog | Immutable audit | Runtime | 4 | Has data | Correct append-only usage |
| 23 | KnowledgeEntry | CAIQ / vendor Q&A | Yes | 1,129 | Has data | Keywords/frameworks as strings |
| 24 | Company | Org profile | No | 0 | Empty | Needed for product-scoped CAIQ overrides |
| 25 | Product | Product CAIQ context | No | 0 | Empty | |
| 26 | KnowledgeOverride | Answer overrides | No | 0 | Empty | `companyId` lacks Company FK |
| 27 | Integration | Integration Hub | Runtime | 0 | Empty locally | Populated on connect / Google SSO |
| 28 | TeamInvite | Invites | No | 0 | Empty | `invitedBy` not User FK |
| 29 | AttackSurfaceScan | Persist Shodan scans | No | 0 | Empty / orphaned | API never writes this model |
| 30 | TabletopScenario | Exercise defs | Runtime | 3 | Has data | Seeded on first Exercises visit, not `seed.ts` |
| 31 | TabletopSession | Exercise runs | Runtime | 1 | Has data | |
| 32 | TabletopDecision | Decision-mode choices | Runtime | 2 | Has data | |
| 33 | TabletopResponse | Discussion-mode Q&A | No | 0 | Empty | |
| 34 | TabletopCommsDraft | Comms drafts | No | 0 | Empty | |

**KnowledgeEntry by source (local):** Technical Controls 640, Framework Standards 241, Baseline 194, CAIQ v4 Baseline 54.

### 3.2 Seed coverage (`prisma/seed.ts` + `prisma/seeds/`)

Seeded: User, RiskScenario (1), Policy (1), Vendor (AWS, Slack), VendorAssessment, Evidence (2), Objective, Project, Notification, AlertRule, Playbook, KnowledgeEntry (~1,129 via child scripts).

Not seeded: Account, Session, VerificationToken, Authenticator, Risk, RiskHistory, RiskScenarioHistory, Incident, IncidentEvent, Company, Product, KnowledgeOverride, Integration, TeamInvite, AttackSurfaceScan, AuditLog, EvidenceLink, Tabletop* (runtime).

Users upsert. Risks, policies, vendors, objectives use `.create()` — **re-running seed is not idempotent**.

### 3.3 Cross-cutting schema issues

1. Dual risk systems: `RiskScenario` (FAIR, API-only, seeded) vs `Risk` (5×5 UI, empty).
2. Incident schema exists; UI is mock + playbooks.
3. Attack surface scans are ephemeral; model unused.
4. JSON-as-relations: policy sections, OKR key results, project phases, vendor certs, evidence tags, tabletop steps.
5. String owners instead of User FKs: `Risk.owner`, `Objective.owner`, `Project.owner`, `Evidence.uploadedBy`, `VendorAssessment.assessedBy`.
6. Five auth models; only `User` is used.
7. Company/Product/KnowledgeOverride empty — Vendor Risk override pickers are empty until created in Settings.
8. No AppSec/Vulnerability model.
9. `.cursorrules` says “17 models”; schema has **34**.

---

## 4. Dead code

Confidence: **high** unless noted.

### 4.1 Deleted Budget module (still on disk)

- `src/components/budget/budget-controls.tsx`
- `src/components/budget/budget-simulator-layout.tsx`
- `src/components/budget/risk-projection-chart.tsx`
- `src/components/budget/simulation-metrics.tsx`

### 4.2 Old dashboard / executive / reporting widgets (never mounted)

- `src/components/dashboard/data-source-connector.tsx`
- `src/components/dashboard/posture-gauge.tsx`
- `src/components/dashboard/remediation-velocity.tsx`
- `src/components/dashboard/security-feed.tsx`
- `src/components/dashboard/threat-map.tsx`
- `src/components/dashboard/vulnerability-feed.tsx`
- `src/components/executive/investment-heatmap.tsx`
- `src/components/executive/revenue-velocity-gauge.tsx`
- `src/components/executive/top-risks-card.tsx`
- `src/components/reporting/board-deck-generator.tsx`
- `src/components/reporting/board-export-btn.tsx`

Live Command Center uses `executive-brief-tab.tsx` and `reports-tab.tsx`.

### 4.3 Old governance / policy UI

- `src/components/governance/evidence-vault.tsx` (v1; v2 is used)
- `src/components/governance/audit-manager.tsx`
- `src/components/governance/contract-analysis.tsx`
- `src/components/governance/decision-console.tsx`
- `src/components/governance/clause-inspector.tsx` (only used by dead contract-analysis)
- `src/components/policies/policy-editor.tsx`
- `src/components/policies/policy-kanban.tsx`
- `src/components/policies/visual-mapper.tsx`
- `src/components/policies/acknowledgment-tracker.tsx`
- `src/components/policies/policy-dependency-graph.tsx`
- `src/components/policies/golden-library-panel.tsx`

### 4.4 Intelligence tab wrappers (page does not import them)

- `src/components/intelligence/tabs/InfrastructureTab.tsx`
- `src/components/intelligence/tabs/LiveFeedsTab.tsx`
- `src/components/intelligence/tabs/SignalIntelligenceTab.tsx`
- `src/components/intelligence/tabs/ThreatBriefingTab.tsx`
- `src/components/intelligence/ThreatIntelWidget.tsx`
- `src/components/intelligence/mitre-matrix.tsx`
- `src/components/intelligence/security-events-feed.tsx`
- `src/components/intelligence/system-health.tsx`

### 4.5 Other unreferenced components

- `src/components/active-defense/remediation-modal.tsx`
- `src/components/active-defense/two-key-modal.tsx`
- `src/components/strategy/strategy-pyramid.tsx`
- `src/components/strategy/matrix/threat-matrix.tsx`
- `src/components/strategy/kpi-row.tsx`
- `src/components/strategy/okr-card.tsx` (strategy page inlines `OKRCard`)
- `src/components/risk/add-vendor-dialog.tsx`
- `src/components/visualizations/access-graph.tsx`
- `src/components/ui/theme-switcher.tsx`
- `src/components/ui/agent-thinking.tsx`
- `src/components/ui/decision-card.tsx` (live card is `decisions/decision-card.tsx`)

### 4.6 Unreferenced lib modules

- `src/lib/auth.ts` — deprecated; production uses `@/auth` (tests still import it)
- `src/lib/intelligence/intelligence-service.ts`
- `src/lib/intelligence/anomaly-detector.ts`
- `src/lib/intelligence/threat-classifier.ts`
- `src/lib/policy-data.ts`
- `src/lib/export-utils.ts`
- `src/lib/sanitize.ts`
- `src/lib/logging/sentinel-logger.ts`
- `src/lib/ai/verify-ax.ts`
- `src/lib/trivy/verify-scanner.ts`
- `src/lib/knowledge/resolution.ts`
- `src/lib/integrations/hooks.ts`
- `src/lib/connectors/github.ts` (AppSec uses `src/lib/appsec/github.ts`)
- `src/lib/jira/jira-store.ts`
- `src/lib/jira/jira-templates.ts`
- `src/lib/caiq/caiq-legacy.ts`
- `src/lib/caiq/caiq-semantic-matcher.ts` — tests only
- `src/app/actions/ai-ops.ts` — only dead `security-feed.tsx`
- `src/app/actions/legal-ai.ts` — only dead `clause-inspector.tsx`

### 4.7 Unreferenced data

- `src/data/intelligence/strategic-locations.json` — no imports (~990 lines)

Other JSON under `src/data/intelligence/` is used by World Monitor.

### 4.8 Orphaned / weakly linked routes

| Route | Status |
|---|---|
| `/vendors/caiq` | **High** — no inbound navigation |
| `/exercises/history` | **Medium** — linked from guide, not exercises home |
| `/api/auth/login` | **Medium** — login UI uses `signIn('credentials')`, not this route |

### 4.9 API routes with no live UI caller

Likely only reachable from dead tabs, tests, or manual curl:

- `/api/intelligence/earthquakes`
- `/api/intelligence/gdelt`
- `/api/intelligence/instability`
- `/api/intelligence/brief`
- `/api/intelligence/anomalies`
- `/api/intelligence/convergence`
- `/api/intelligence/outages`
- `/api/intelligence/news`
- `/api/intelligence/video-streams`
- `/api/intelligence/osint`
- `/api/intelligence/reports` (medium)
- `/api/intelligence/threats/classify`
- `/api/security/scan`
- `/api/security/audit` (Governance uses `/api/audit-logs`)
- `/api/jira`

These may still be used by external clients; this audit only traced in-repo UI usage.

### 4.10 Duplicate auth paths

| Path | Status |
|---|---|
| `src/auth.ts` | Live canonical NextAuth |
| `src/auth.config.ts` | Live edge config |
| `src/app/api/auth/[...nextauth]/route.ts` | Live |
| `src/app/login/login-client.tsx` | Live UI |
| `src/app/api/auth/login/route.ts` | Duplicate; unused by UI |
| `src/lib/auth.ts` | Dead in production |
| `src/lib/auth/session.ts` | Live internally |
| `src/lib/audit/audit-service.ts` | Live Prisma audit |

`hasPermission` / `canAccessRoute` in `src/lib/auth/rbac.ts` are unused (types only).

### 4.11 Stale tests

- `tests/smoke/sidebar.smoke.test.tsx` — expects 11 items with wrong labels; Shell has 13
- `tests/smoke/routes.smoke.test.tsx` — mocks missing `@/lib/risk-register-store`; wrong component paths; missing `/exercises`, war-room, etc.
- `tests/integration/auth.test.ts` — tests deprecated `@/lib/auth`
- `tests/unit/caiq-matching.test.ts` / `tests/integration/caiq.test.ts` — test unused `caiq-semantic-matcher.ts`

### 4.12 `.cursorrules` drift

| Rule says | Code does |
|---|---|
| 11 sidebar items | 13 items |
| 17 Prisma models | 34 models |
| MISP replaced by Abuse.ch | MISP client, APIs, Integration Hub still present |
| Budget deleted | `src/components/budget/*` still present |
| Light/purple theme deleted | `theme-store.ts` + unused `theme-switcher.tsx` remain |
| Docker intel stack deleted | Comments still reference missing `docker-compose.intel.yml` |
| Wargames replaced by Tabletop | Copy leftover in exercises guide / audit script |

---

## 5. CISO day-one critical path

What a CISO actually needs on day one, limited to what **works with seeded `dev.db`** and optional API keys.

### Must have (functional)

1. **Login** — `ciso@astra.ai` / `admin123` (NextAuth credentials). Google OAuth is optional and not required.
2. **Vendor Risk** — registry (AWS, Slack) + Knowledge Base (1,129 entries). This is the product differentiator and the only large real dataset.
3. **Governance — Policies, Evidence Vault, Audit Logs** — seeded policy/evidence; audit fabric writes on login and mutations.
4. **Incidents — Playbooks** — two seeded playbooks (ransomware, DDoS). Do not treat Active Incidents / MTTR as real.
5. **Exercises** — three scenarios, Prisma-backed sessions. Use `/exercises`, not the Incidents tabletop tab.
6. **Settings — AI Provider + Team** — required to make chat / CAIQ enhance / war-room copilot real. Create Company/Product here before CAIQ overrides work.
7. **Threat Intel — Attack Surface** — only if `SHODAN_API_KEY` is set. Abuse.ch feeds work without a key; OpenCTI/MISP will silently mock.

### Useful but mixed (orientation, not source of truth)

8. **Command Center Overview** — mixes real counts with `SAMPLE_*` widgets. Fine for a demo tour; do not brief a board from it.

### Defer until data is real

- Decision Center (demo queue)
- Defense Matrix (`Math.random`)
- KPI Dashboard (`computeAllKPIs` literals)
- Reports & Board Deck (templates)
- Risk Register (real UI, **zero rows** until someone adds risks or finalizes a CAIQ)
- Compliance heatmap (static Annex A)
- War Room incident context (hardcoded)
- AppSec pipeline widget
- Help / Roadmap (static product docs)

### Day-one setup checklist

1. `.env.local` with `AUTH_SECRET` / `NEXTAUTH_SECRET` and `DATABASE_URL=file:./dev.db`
2. `npx prisma db push && npx prisma db seed`
3. Optional: `ANTHROPIC_API_KEY` or `GOOGLE_API_KEY`; `SHODAN_API_KEY`
4. Sign in, open Vendor Risk → Knowledge Base, Governance → Policies, Exercises → start a scenario

---

## 6. Bugs, type errors, and console warnings

`npx tsc --noEmit` — clean. `npm run lint` — clean. No `@ts-ignore` / `@ts-expect-error` in application source. No `TODO` / `FIXME` / `HACK` in `.ts`/`.tsx`.

`npm test` (Vitest) — **4/4 suites fail** before tests run: setup resolves to parent `CISO/tests/setup.ts` because of nested lockfiles.

### Critical

| ID | Location | Issue |
|---|---|---|
| C1 | `src/auth.config.ts` | `publicPaths` includes `'/api'`. Every API path is public at the edge. |
| C2 | Most of `src/app/api/**` | ~70 of 96 routes never call `auth()`. Unauthenticated read/write if the URL is known. Routes that **do** check session include evidence, integrations, team, audit-logs, and some intelligence/Shodan handlers. Unprotected examples: `risks`, `knowledge` (incl. import), `agent/chat`, `caiq/enhance`, `policies`, `playbooks`, `companies`, `vendor-risk`, `admin/metrics`. |
| C3 | Parent `CISO/` vs `CISO/CISO/` | Duplicate projects, two `dev.db` files, two lockfiles. Easy to seed one DB and run the other. |

`/api/health` is intentionally public (probes) but also discloses DB/AI circuit state.

### High

| ID | Location | Issue |
|---|---|---|
| H1 | `.env.example` / Auth.js | Empty `AUTH_SECRET` / `NEXTAUTH_SECRET` on a fresh clone → `MissingSecret` / `ClientFetchError`. |
| H2 | `src/lib/prisma.ts`, seeds, Docker | Default URL mismatch: runtime/seed fallback `file:dev.db`, example `file:./dev.db`, Docker `file:/app/data/astra-ciso.db`. |
| H3 | `vitest.config.ts` | Unit tests cannot resolve setup because Turbopack/Vitest pick the parent workspace. |
| H4 | `prisma/seed.ts` | Not idempotent — `.create()` for RiskScenario, Policy, Vendor, Objective, etc. |
| H5 | `src/auth.ts` `getUser()` | Prisma errors return `null` → UI shows “invalid credentials” instead of a DB error. |
| H6 | Next.js / lockfiles | Turbopack warning: multiple lockfiles; inferred root is parent `CISO/`. No `turbopack.root` in Next config. |

### Medium

| ID | Location | Issue |
|---|---|---|
| M1 | `src/lib/crypto.ts` vs `auth.config.ts` | Auth accepts `AUTH_SECRET` **or** `NEXTAUTH_SECRET`. Integration encryption **only** reads `NEXTAUTH_SECRET`. |
| M2 | `.env.example` `AUTH_TRUST_HOST` | Unused; `trustHost: true` is hardcoded. |
| M3 | `package.json` | `@auth/prisma-adapter` installed, never used. |
| M4 | `src/lib/rate-limit.ts` | In-memory `Map` — resets on restart; useless across multiple instances. |
| M5 | `middleware.ts` | Comment says `/api/auth` is excluded from the matcher; it is not. |
| M6 | `login-client.tsx` | Demo credentials one-click filled in the UI — must not ship to production. |
| M7 | `caiq-answer-engine.ts` | `(prisma as any).knowledgeEntry` and other `as any` casts. |
| M8 | Intel clients | `console.warn('[MISP] … falling back to mock data')` (and OpenCTI/OTX/Abuse.ch equivalents) — UI looks live while serving mocks. |
| M9 | AI routes | Silent fallback to mock/heuristic when provider missing or quota exceeded. |
| M10 | Governance Risk Register | Real UI over an empty `Risk` table; seeded FAIR `RiskScenario` is invisible in the UI. |
| M11 | Incident module | Prisma `Incident` unused; War Room and timeline are fake while playbooks are real. |

### Low

| ID | Location | Issue |
|---|---|---|
| L1 | `login-client.tsx` | Local `AlertTriangle` SVG instead of lucide-react (works). |
| L2 | `WorldMonitorMap.tsx` | `(window as any).L` for Leaflet. |
| L3 | Prisma client init | `{ adapter } as never` in `prisma.ts` and seeds. |
| L4 | Deleted-feature leftovers | Budget components, MISP stack vs `.cursorrules`. |
| L5 | Login decrypt sequence | Cosmetic only; not a security issue. |
| L6 | `Shell.tsx` | Unused `Zap` import (eslint-disabled); empty `useAstraStore()` destructure. |

### Console warnings observed in development

- Auth.js `MissingSecret` when `.env.local` is absent (fixed locally by copying env into this app root).
- Turbopack: multiple lockfiles / inferred workspace root.
- Node: `module.register()` deprecation; `localStorage is not available` ExperimentalWarning on the server.
- Intel/AI: mock-fallback `console.warn` when keys missing.
- Prisma P2021 `The table main.User does not exist` if the app is started against an un-migrated DB (then swallowed as bad credentials after `getUser` was hardened).

---

## 7. Appendix

### 7.1 Zustand stores

| Store | Path | Persistence |
|---|---|---|
| `useAstraStore` | `src/lib/store.ts` | localStorage |
| `useViewEngine` | `src/stores/view-engine-store.ts` | localStorage |
| `useDecisionStore` | `src/lib/decision-engine/router.ts` | localStorage + `DEMO_DECISIONS` |
| `useVendorRiskStore` | `src/lib/vendor-risk-store.ts` | API → Prisma |
| `usePlaybookStore` | `src/lib/playbook-store.ts` | API → Prisma |
| `usePolicyStore` | `src/lib/policy-store.ts` | API → Prisma |
| `useEvidenceStore` | `src/lib/evidence-store.ts` | API → Prisma |
| `useOKRProjectStore` | `src/lib/okr-project-store.ts` | API → Prisma |
| `useCompanyProductStore` | `src/lib/company-product-store.ts` | sessionStorage + `/api/companies` |
| `useUploadedKPIStore` | `src/lib/kpi-engine/uploaded-kpi-store.ts` | localStorage |
| `useAppSecStore` | `src/lib/appsec-store.ts` | localStorage |
| `useCAIQReviewStore` | `src/stores/caiq-review-store.ts` | In-memory |
| `useThemeStore` | `src/lib/theme-store.ts` | localStorage |
| `useNotificationStore` | `src/lib/notification-store.ts` | Check implementation |

`.cursorrules` says Zustand is UI-only. Several stores persist **business** data (decisions, AppSec findings, uploaded KPIs) in localStorage.

### 7.2 API routes (96) by area

**Auth:** `/api/auth/[...nextauth]`, `/api/auth/login`

**Agent / AI:** `/api/agent/analyze`, `/api/agent/analyze-policy`, `/api/agent/chat`, `/api/agent/generate-policy`, `/api/notebook/chat`, `/api/admin/metrics`

**Platform:** `/api/health`, `/api/notifications`, `/api/notifications/[id]`, `/api/notifications/alert-rules/[id]`, `/api/kpi-upload`, `/api/jira`

**Strategy:** `/api/okr`, `/api/okr/objectives/[id]`, `/api/okr/projects/[id]`

**Governance:** `/api/risks`, `/api/risks/[id]`, `/api/policies`, `/api/policies/[id]`, `/api/audit-logs`, `/api/audit-logs/stats`, `/api/audit-logs/export`, `/api/evidence`, `/api/evidence/stats`, `/api/evidence/[id]/*`, `/api/playbooks`, `/api/playbooks/[id]`

**Vendor / CAIQ / knowledge:** `/api/vendor-risk`, `/api/vendor-risk/[id]`, `/api/vendor-risk/[id]/assessments`, `/api/vendors/[id]/finalize-assessment`, `/api/vendors/caiq/*`, `/api/caiq/parse|enhance|export`, `/api/knowledge*`, `/api/knowledge-overrides*`, `/api/companies*`, `/api/products*`

**Intelligence:** threats, threatfox, urlhaus, malware, shodan/*, enrich, dashboard, campaigns, actors, indicators, attack-heatmap, brief, reports, search, feeds, gdelt, news, osint, earthquakes, outages, instability, convergence, anomalies, video-streams, stats, health, threats/classify

**Integrations / AppSec / team / security:** `/api/integrations*`, `/api/integrations/trivy`, `/api/security/scan`, `/api/security/audit`, `/api/team/users`, `/api/team/invite`

### 7.3 All 21 pages

1. `/` — Command Center  
2. `/decisions` — Decision Center  
3. `/strategy` — Strategy & OKRs  
4. `/governance` — Governance & Risk  
5. `/vendors` — Vendor Risk  
6. `/vendors/caiq` — Standalone CAIQ wizard (orphaned)  
7. `/vendors/caiq-review` — CAIQ review deep link  
8. `/incidents` — Incidents  
9. `/incidents/war-room` — War Room  
10. `/exercises` — Tabletop library  
11. `/exercises/[sessionId]` — Active exercise  
12. `/exercises/guide` — Exercise guide  
13. `/exercises/history` — Exercise history  
14. `/intelligence` — Intelligence Center  
15. `/intelligence/ransomware` — Ransomware (also a tab)  
16. `/appsec` — AppSec  
17. `/integrations` — Integrations  
18. `/settings` — Settings  
19. `/help` — Help Center  
20. `/roadmap` — Roadmap  
21. `/login` — Login  

### 7.4 Highest-impact follow-ups (not done in this report)

1. Stop treating `/api` as public; require `auth()` on mutating and sensitive GETs.  
2. Collapse to one project root (or set `turbopack.root` + Vitest root).  
3. Align `DATABASE_URL` defaults and make seed idempotent.  
4. Wire Governance UI to seeded risk data, or seed `Risk` rows.  
5. Delete or quarantine confirmed-dead Budget, intelligence `tabs/*`, and unused lib modules.  
6. Align `.cursorrules` with 13 nav items, 34 models, and the actual Intelligence tabs.
