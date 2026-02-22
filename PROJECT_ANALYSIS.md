# Astra CISO — Comprehensive Project Analysis

**Purpose**: Shareable reference for another AI assistant.  
**Generated**: February 2026.  
**Repo**: CISO (Astra CISO Platform)

---

## 1. Tech Stack

| Layer | Technology | Notes |
|-------|------------|--------|
| **Framework** | Next.js 16.1.6 | App Router, React Server Components |
| **Language** | TypeScript 5.x | Strict mode via tsconfig |
| **UI** | React 19.2.3 | |
| **State** | Zustand 5.x | With `persist` middleware (localStorage) for offline-first |
| **UI Components** | Radix UI + shadcn-style primitives | Button, Card, Dialog, Tabs, etc. in `src/components/ui/` |
| **Styling** | Tailwind CSS 4.x | PostCSS, tailwindcss-animate |
| **Database** | SQLite + Prisma 7.4 | Driver adapters: better-sqlite3, libsql (preview) |
| **Auth** | NextAuth 5 (beta) | Credentials provider; JWT/session; custom middleware + RBAC |
| **AI** | Multi-provider | Google Generative AI (Gemini), Anthropic SDK (Claude), Ollama (local); unified in `src/lib/ai/engine.ts` |
| **Charts / Viz** | Recharts, Mermaid | Dashboards, posture gauges, diagrams |
| **Animation** | Framer Motion | |
| **Icons** | Lucide React | |
| **Docs/Export** | docx, exceljs, jspdf, jspdf-autotable, file-saver | Board decks, reports, CAIQ Excel |
| **Document parsing** | OfficeParser | PPTX/DOCX for KPI extraction |
| **Validation** | Zod 4.x | API and form validation |
| **Drag and drop** | @hello-pangea/dnd | Policy Kanban, etc. |

**Key env vars** (server-side): `JWT_SECRET`, `GOOGLE_API_KEY`, `ANTHROPIC_API_KEY`, `AI_PROVIDER` (GEMINI | ANTHROPIC), `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`, `GITHUB_TOKEN` (optional). No `.env.example` in repo; document these for setup.

---

## 2. Project Structure

```
CISO/
├── prisma/
│   ├── schema.prisma          # DB models (User, Risk, Policy, Incident, etc.)
│   └── seed.ts                # Seed script (tsx)
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Protected routes; layout uses auth() + Shell
│   │   │   ├── page.tsx       # Command center (/)
│   │   │   ├── executive-brief/   # Board bento
│   │   │   ├── strategy/         # OKRs, KPI rows; strategy/matrix = defense matrix
│   │   │   ├── kpis/              # KPI dashboard + file import
│   │   │   ├── projects/         # OKR/project tracking
│   │   │   ├── decisions/        # Decision engine UI
│   │   │   ├── risk/             # Risk register (FAIR)
│   │   │   ├── governance/       # Evidence vault, compliance heatmap
│   │   │   ├── policies/         # Policy Kanban, editor, dependency graph
│   │   │   ├── incidents/        # Timeline + war-room
│   │   │   ├── wargames/         # Scenarios, builder, AI
│   │   │   ├── intelligence/     # Threat intel; intelligence/ransomware
│   │   │   ├── vendors/          # Vendor risk, CAIQ
│   │   │   ├── tickets/          # Jira ticketing
│   │   │   ├── budget/           # Budget dashboard
│   │   │   ├── reporting/        # Board deck generator
│   │   │   ├── appsec/           # AppSec posture, Trivy
│   │   │   ├── infrastructure/  # Infra overview
│   │   │   ├── privacy/         # Privacy controls
│   │   │   ├── settings/        # Config
│   │   │   ├── help/            # Knowledge base
│   │   │   └── layout.tsx       # Shell + ProductTour
│   │   ├── api/                 # API routes (see section 5)
│   │   ├── actions/             # Server actions: ai-ops.ts, legal-ai.ts, war-room-ai.ts
│   │   ├── login/page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/              # Shell.tsx (sidebar, nav)
│   │   ├── dashboard/, executive/, strategy/, decisions/, governance/, incidents/,
│   │   ├── intelligence/, nexus/, policies/, reporting/, risk/, security/, secops/,
│   │   ├── war-room/, notifications/, ia/ (omni-chat)
│   │   └── ui/                  # shadcn primitives (button, card, dialog, etc.)
│   ├── lib/
│   │   ├── ai/                  # engine.ts, osint-engine.ts, verify-ax.ts, utils
│   │   ├── auth/                # rbac.ts, session.ts, audit.ts
│   │   ├── caiq/                # caiq-answer-engine.ts, caiq-knowledge-base.ts, caiq-transfer-engine.ts
│   │   ├── connectors/          # github.ts
│   │   ├── decision-engine/     # types.ts, router.ts (decision store + scoring)
│   │   ├── jira/                # jira-connector.ts, jira-store.ts, jira-templates.ts
│   │   ├── kpi-engine/          # kpi-engine.ts, kpi-extractor.ts, uploaded-kpi-store.ts
│   │   ├── risk-engine/         # fair.ts (FAIR quantitative risk)
│   │   ├── trivy/               # scanner.ts, verify-scanner.ts
│   │   ├── logging/             # sentinel-logger.ts
│   │   ├── store.ts             # Main Zustand store (decisions, OKRs, KPIs, chat, posture)
│   │   ├── prisma.ts            # Prisma client singleton
│   │   ├── auth.ts              # Legacy/custom auth helpers
│   │   ├── compliance-frameworks.ts, compliance-data.ts, compliance-weave.ts
│   │   ├── policy-store.ts, policy-engine.ts, policy-templates.ts, policy-data.ts
│   │   ├── risk-register-store.ts, vendor-risk-store.ts, vendor-store.ts
│   │   ├── evidence-store.ts, notification-store.ts, okr-project-store.ts
│   │   ├── playbook-store.ts, appsec-store.ts, policy-store.ts
│   │   ├── posture-score.ts, threat-engine.ts, intelligence-engine.ts
│   │   ├── sast-engine.ts, config-scanner.ts, pii-scanner.ts
│   │   # Chat uses native /api/agent/chat (CISO AI Assistant)
│   │   ├── ransomware-client.ts # Ransomware feed (mock + optional api.ransomware.live)
│   │   ├── golden-library.ts, governance.ts, export-utils.ts
│   │   └── unification-store.tsx, theme-store.ts, view-engine-store.ts, oob-store.ts
│   ├── stores/                  # view-engine-store, compliance-store (some legacy)
│   ├── types/                   # ransomware.ts, etc.
│   └── middleware.ts            # JWT verify, RBAC (canAccessRoute), security headers
├── docs/
│   ├── USER_GUIDE.md
│   ├── HIGH_LEVEL_DESIGN.md
│   ├── LOW_LEVEL_DESIGN.md
│   └── SECURITY_AND_QA_REPORT.md
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. Major Files and Modules

### 3.1 Application entry and auth

- **`src/auth.ts`** — NextAuth 5 config: Credentials provider, Prisma adapter, `getUser` + bcrypt; exports `handlers`, `auth`, `signIn`, `signOut`. Used by dashboard layout and `api/auth/[...nextauth]`.
- **`src/auth.config.ts`** (if present) — NextAuth config (callbacks, pages, etc.).
- **`src/middleware.ts`** — Runs on every request: verifies `astra-session` JWT, resolves `UserRole`, calls `canAccessRoute(role, path)`. Redirects unauthenticated to `/login`, 403 for forbidden. Sets security headers (X-Frame-Options, CSP, etc.).
- **`src/lib/auth/rbac.ts`** — Roles: `CISO`, `SEC_ENGINEER`, `AUDITOR`, `VIEWER`. `canAccessRoute(role, path)` (e.g. `/settings` for SEC_ENGINEER, `/audit` for AUDITOR).
- **`src/lib/auth/session.ts`** — Session creation (JWT cookie).
- **`src/lib/auth/audit.ts`** — Audit log (user, action, resource); used by API and audit viewer.

### 3.2 Core state and engines

- **`src/lib/store.ts`** — Main Zustand store: systemStatus, complianceScore, decisionQueue, chatHistory, OKRs, KPIs, posture, currentUser; actions for decisions, OKRs, KPIs, chat, login. Persisted; used across dashboard.
- **`src/lib/ai/engine.ts`** — Unified AI: Gemini and Anthropic providers; `createChatSession`, `generateContent`, `generateStructuredContent`. Provider chosen via `AI_PROVIDER` env (default GEMINI).
- **`src/lib/kpi-engine/kpi-engine.ts`** — Computes 20+ KPIs from definitions (RISK, COMPLIANCE, INCIDENT, etc.); health, trend, sparkline, boardTranslation.
- **`src/lib/kpi-engine/kpi-extractor.ts`** — Regex/heuristic extraction from text (e.g. from OfficeParser output); used by KPI upload API.
- **`src/lib/risk-engine/fair.ts`** — FAIR model: LEF, LM, ALE, normalized risk score; `calculateRisk(scenario)`.
- **`src/lib/decision-engine/router.ts`** — Decision store (Zustand): add/resolve/filter decisions; demo data; confidence and impact; pillar/urgency.
- **`src/lib/decision-engine/types.ts`** — Decision, DecisionPillar, Recommendation, ConfidenceScore, etc.

### 3.3 Compliance and policy

- **`src/lib/compliance-frameworks.ts`** — Framework definitions (e.g. GDPR, EU_AI_ACT, NIST_CSF_2_0, ISO_27001_2022, NIS2) and controls with evidence required.
- **`src/lib/policy-store.ts`**, **policy-engine.ts**, **policy-templates.ts**, **policy-data.ts** — Policy state, generation rules, templates.
- **`src/lib/caiq/caiq-answer-engine.ts`** — Parses CAIQ Excel, matches to knowledge base, AI-enhanced answers; coverage stats.
- **`src/lib/caiq/caiq-knowledge-base.ts`** — CAIQ Q&A knowledge base.
- **`src/lib/evidence-store.ts`** — Evidence vault for governance (persisted).

### 3.4 Integrations

- **`src/lib/jira/jira-connector.ts`** — Jira Cloud REST v3: configure, testConnection, createIssue; Basic auth.
- **`src/lib/jira/jira-store.ts`** — Local ticket queue when Jira not configured; persisted.
- **`src/lib/jira/jira-templates.ts`** — CISO ticket templates (incident, risk, vendor, etc.).
- **`src/lib/connectors/github.ts`** — GitHub (e.g. repo security); uses `GITHUB_TOKEN`; audit logging.
- **`src/lib/trivy/scanner.ts`** — Trivy vulnerability scanning wrapper; used by `/api/integrations/trivy` and appsec.
- **`src/lib/ransomware-client.ts`** — Fetches ransomware feed; currently forces mock data (api.ransomware.live commented); types in `src/types/ransomware.ts`.
- **CISO AI Assistant** — Native chat via `POST /api/agent/chat`; uses `src/lib/ai/engine.ts` and circuit breaker; context from store.

### 3.5 UI and layout

- **`src/components/layout/Shell.tsx`** — Dashboard shell: sidebar, nav, theme; wraps all dashboard pages.
- **`src/app/(dashboard)/layout.tsx`** — Server layout: `auth()`; redirect if no session; renders Shell + ProductTour + children.
- **`src/components/ui/*`** — Reusable UI: Button, Card, Dialog, Tabs, Table, Badge, Chat interface, etc.

### 3.6 Other notable libs

- **`src/lib/posture-score.ts`** — Security posture scoring.
- **`src/lib/threat-engine.ts`**, **intelligence-engine.ts** — Threat/intel logic.
- **`src/lib/governance.ts`** — Governance data/helpers.
- **`src/lib/prisma.ts`** — Prisma client singleton (driver adapters for SQLite).

---

## 4. Current Features (by area)

- **Command center** (`/`): Posture gauge, threat pulse, key metrics.
- **Executive brief** (`/executive-brief`): Board bento, investment heatmap, top risks.
- **Strategy** (`/strategy`, `/strategy/matrix`): OKRs, KPI rows, defense matrix (control grid).
- **KPIs** (`/kpis`): 20 auto-computed KPIs + file-imported KPIs (PPTX/DOCX).
- **Projects** (`/projects`): OKR and project tracking.
- **Decisions** (`/decisions`): AI-assisted decision support, scoring, recommendations.
- **Risk** (`/risk`): Risk register with FAIR (ALE, risk score).
- **Governance** (`/governance`): Evidence vault, compliance heatmap, audit.
- **Policies** (`/policies`): Policy editor, Kanban, dependency graph, golden library.
- **Incidents** (`/incidents`, `/incidents/war-room`): Timeline, war room, AI copilot, secure comms.
- **War games** (`/wargames`, builder, AI): Scenarios, MITRE mapping, AAR.
- **Intelligence** (`/intelligence`, `/intelligence/ransomware`): Threat feed, MITRE matrix, ransomware stats (mock/API).
- **Vendors** (`/vendors`): Vendor risk, CAIQ automation.
- **Tickets** (`/tickets`): Jira integration + local queue, CISO templates.
- **Budget** (`/budget`): Security budget and planning.
- **Reporting** (`/reporting`): Board deck generator and export.
- **AppSec** (`/appsec`): SAST/Trivy, posture.
- **Infrastructure** (`/infrastructure`): Infra overview.
- **Privacy** (`/privacy`): Privacy controls (e.g. RoPA, DSAR, breach sim, vendor risk from README).
- **Settings / Help** (`/settings`, `/help`): Config, knowledge base.
- **Auth**: Login (credentials), RBAC (CISO, SEC_ENGINEER, AUDITOR, VIEWER), audit log, session.

---

## 5. APIs and Integrations

### 5.1 API routes (`src/app/api/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/agent/chat` | POST | CISO AI assistant (native AI engine + circuit breaker) |
| `/api/agent/wargame` | POST | War game simulation (narrative, metrics delta) |
| `/api/agent/generate-policy` | POST | AI policy draft (title, type, strictness) |
| `/api/agent/analyze` | POST | Threat/request analysis |
| `/api/agent/analyze-policy` | POST | Policy gap analysis (framework) |
| `/api/notebook/chat` | POST | Notebook-style AI chat |
| `/api/intelligence/osint` | POST | OSINT threat intel (query, sources) |
| `/api/kpi-upload` | POST | Multipart PPTX/DOCX → OfficeParser → KPI extractor |
| `/api/jira` | GET/POST | Connection test (GET), create issue (POST) |
| `/api/vendors/caiq` | POST | CAIQ questionnaire automation |
| `/api/vendors/caiq/transfer` | POST | CAIQ transfer engine |
| `/api/security/scan` | POST | Config/security scan |
| `/api/security/audit` | GET | Audit log retrieval |
| `/api/auth/login` | POST | Credentials login (session creation, audit) |
| `/api/auth/[...nextauth]` | * | NextAuth handlers |
| `/api/risks` | * | Risk API (if present) |
| `/api/integrations/trivy` | GET | Trivy integration |

All protected routes require valid session; RBAC enforced in middleware for path-based access.

### 5.2 External integrations

- **Jira Cloud** — REST API v3; env: `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`.
- **GitHub** — Optional; `GITHUB_TOKEN`; audit logged in connector.
- **Trivy** — CLI/API for vulnerability scanning (appsec, integrations).
- **AI** — Google Gemini (`GOOGLE_API_KEY`), Anthropic (`ANTHROPIC_API_KEY`), or local Ollama (`NEXT_PUBLIC_USE_OLLAMA` / provider selection).
- **Ransomware feed** — Code path for api.ransomware.live; currently disabled in favor of mock data.
- **OfficeParser** — Server-side PPTX/DOCX parsing for KPI upload.

---

## 6. Database Schema (Prisma, SQLite)

- **User** — id, name, email, emailVerified, image, password, role (default VIEWER), createdAt, updatedAt. Relations: Account, Session, Authenticator, authoredPolicies, managedRisks, incidents.
- **Account** — OAuth/credential account (userId, type, provider, providerAccountId, tokens, etc.); unique (provider, providerAccountId).
- **Session** — sessionToken, userId, expires.
- **VerificationToken** — identifier, token, expires.
- **Authenticator** — WebAuthn (credentialID, userId, credentialPublicKey, counter, etc.).
- **RiskScenario** — FAIR fields (threatActor, threatEventFreq, vulnerability, primaryLoss, secondaryLoss, controlsEffective, ale, riskScore), ownerId → User, status, history.
- **RiskHistory** — riskScenarioId, date, score, ale.
- **Policy** — title, content, version, status, authorId → User; frameworks/controls as JSON strings (SQLite workaround).
- **Incident** — title, severity, status, commanderId → User, startedAt, resolvedAt; events.
- **IncidentEvent** — incidentId, type, payload (JSON), timestamp.

Persistence: Many features use Zustand + localStorage (e.g. risk register, vendor risk, evidence, Jira tickets, OKRs, notifications) in addition to or instead of Prisma.

---

## 7. Areas for Improvement

- **Type safety**: Reduce `any` usage (especially in AI and API layers); fix ~142 TypeScript errors and tighten types for prompts and API bodies.
- **Lint and deps**: Address ~273 ESLint warnings (unused vars, hook deps); fix 11 reported dependency vulnerabilities (10 moderate, 1 high).
- **Auth consistency**: Align middleware JWT verification with NextAuth session (e.g. single source of truth for role/session); document cookie vs NextAuth session usage.
- **Env and ops**: Add `.env.example` with all required and optional variables (JWT_SECRET, AI_*, JIRA_*, GITHUB_TOKEN, etc.); document deployment and offline behavior.
- **Ransomware feed**: Either enable and proxy api.ransomware.live via a Next.js route (to avoid CORS) or clearly document mock-only mode.
- **Tests**: Add unit tests for FAIR engine, KPI extractor, decision router, and integration tests for critical API routes and auth.
- **RBAC**: Expand `canAccessRoute` to cover all sensitive routes (e.g. reporting, budget, policies) and align with HLD “Admin, Analyst, Viewer” if that’s the intended model; keep role names consistent (CISO vs Admin).
- **Documentation**: Keep HLD/LLD in sync with code (e.g. Next.js 16, React 19, 22 routes, exact API list); add minimal API examples or OpenAPI for key endpoints.
- **Offline/graceful degradation**: Document which features work without AI/Jira/GitHub and surface “offline” or “integration unavailable” states in UI where relevant.
- **Security**: Harden CSP if possible (e.g. reduce `unsafe-inline`/`unsafe-eval` where feasible); ensure rate limiting and IP blocklist (currently mocked in middleware) are implemented for production.

---

## 8. Quick reference for another AI

- **Start dev**: `npm run dev` (port 3000).
- **DB**: SQLite + Prisma; run migrations and `prisma db seed` as needed.
- **Auth**: NextAuth Credentials + Prisma User; middleware expects `astra-session` JWT and uses `lib/auth/rbac.ts` for route access.
- **State**: Main app state in `src/lib/store.ts`; many domain stores in `lib/*-store.ts` with persist.
- **AI**: All agent endpoints use `src/lib/ai/engine.ts`; provider set by `AI_PROVIDER`; no keys → graceful errors or mock behavior.
- **Docs**: `docs/USER_GUIDE.md`, `docs/HIGH_LEVEL_DESIGN.md`, `docs/LOW_LEVEL_DESIGN.md`, `docs/SECURITY_AND_QA_REPORT.md`.

Use this document as the single handoff for context, structure, and improvement areas when working on the Astra CISO codebase.
