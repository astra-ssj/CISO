# Changelog

All notable changes to Astra-CISO are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Public semantic versioning starts at `v0.1.0`. Earlier `2.x` / `3.0.0-decision.*` entries document pre-public development history.

---

## [0.1.0] — 2026-10-29

### Community Preview

The first public Astra CISO release.

Astra is an open-source security decision and evidence platform that turns security evidence, vendor assessments, and risk signals into reproducible recommendations and human-approved decisions.

### Added
- PostgreSQL-backed security `Decision` records
- Decision Center with pending, approved, rejected, and deferred state
- Human approval gate for material vendor decisions
- Versioned deterministic security SkillRuns
- Vendor / CAIQ assessment workflow
- Evidence vault and evidence expiry
- 5×5 deterministic risk scoring
- Knowledge repository
- API-level RBAC
- PostgreSQL baseline migration
- Docker Compose Community deployment
- Explicit demo mode
- Optional AI providers
- CodeQL, Gitleaks, and runtime-image Trivy scanning

### Security
- Fixed vendor answer classification ambiguity
- Removed implicit SSO self-provisioning
- Separated connector encryption key from session signing secret
- Removed npm/corepack from the production container
- Updated vulnerable runtime dependencies
- Added explicit write permissions for sensitive APIs

### Changed
- Repositioned Astra from a broad CISO dashboard to security decision and evidence infrastructure
- Experimental modules removed from primary navigation
- AI is advisory and optional
- Vendor recommendations require human approval before execution

### Experimental
The following remain outside the supported v0.1 product surface:
- incident response / War Room
- tabletop exercises
- threat intelligence visualization
- Strategy / OKRs
- executive KPI engine
- OpenNeko
- GraphJin

---

## [3.0.0-decision.2] — 2026-08-17

CISO factory slice: Postgres + OpenNeko sidecar + full skill catalog + UI honesty.

### Added
- Prisma Postgres (`@prisma/adapter-pg`), Docker `postgres:16-alpine`, GraphJin allowlist
- Skills `vendor.goNoGo`, `tabletop.score`, `intel.correlate`, `playbook.nextStep`, `caiq.draft` with golden tests
- `Approval` model; `POST /api/internal/watchers/tick`, `/api/internal/approvals`, `GET /api/internal/skills`
- Command Center Needs-you widget; Decision Center OpenNeko CTA (`OPENNEKO_URL`)
- `ops/openneko/README.md` sidecar runbook
- Help Center + GitHub docs aligned to v3 (value test, skills, sidecar)

### Changed
- Vendor finalize persists score + go/no-go; Shodan writes Observation and `AttackSurfaceScan`
- War Room binds `Incident` or exercise mode; ticker is not fake IOCs
- AppSec and Roadmap hidden from nav
- Trivy / MITRE / vuln feed / events feed / contract mindmap: empty, not SAMPLE_
- Dockerfile and entrypoint wait on Postgres, not SQLite

---

## [3.0.0-decision.1] — 2026-08-17

Honesty + skill runtime expansion. Empty is the product when data is missing.

### Added
- Skills `caiq.score@1.0.0`, `risk.fiveByFive@1.0.0`, `evidence.expiry@1.0.0` with golden tests
- `GET /api/decision-queue`, `GET /api/skills/runs`, `GET /api/incidents`
- `liveOrEmpty()` Observation envelope (ok / stale / empty)
- `HONESTY.md` living inventory and `src/lib/skills/README.md` catalog

### Changed
- CAIQ engine persists `caiq.match` + `caiq.score` SkillRuns
- 5×5 Risk create/update uses `risk.fiveByFive`
- OpenCTI, MISP, OTX, GitHub: live, last Observation, or empty — never `MOCK_*` IOCs
- Decision Center Needs-you queue is real; recorded decisions start empty
- Command Center threats/incidents start empty
- Defense Matrix cells unscored; Incidents MTTR/timeline no longer invented
- World Monitor marker jitter is a hash of threat id

---

## [3.0.0-decision.0] — 2026-08-17

Decision-loop foundation on `release/v3-decision-loop`.

### Added
- Session-gated APIs (public: `/login`, `/api/auth/*`, `/api/health`)
- Prisma `Observation` + `SkillRun`
- Skill `caiq.match@1.0.0` + `POST /api/skills/caiq-match`

### Changed
- Abuse.ch returns empty on failure, never mock IOCs
- Turbopack root pinned to this app directory

---

## [2.0.2] — 2026-04-09

### Open-Source Preparation

- **Documentation Overhaul**: Updated clone targets and Git references across `README.md` and `CONTRIBUTING.md` to map onto `https://github.com/SristiNative/CISO.git`.
- **Metadata Tagging**: Inserted required explicit licensing (`MIT`), description headers, and remote registry tracking parameters within `package.json`.
- **Security Checkpoints**: Extracted the default local database (`dev.db`) from tracked Git history. Inserted explicit `[WARNING]` documentation concerning the rotation of Mock Credentials (`ciso@astra.ai` / `admin123`) prior to localized environment deployments.

---

## [2.0.1] — 2026-03-08

### Fixed & Audited

- **Dependency Security**: Ran extensive `npm audit fix` to squash 5 High/Moderate vulnerabilities in root modules (`minimatch`, `rollup`, `braces`). Remaining transitive issues are constrained to dev-dependencies and build-time parsing packages that do not affect the Production runtime.
- **TypeScript & Build Stability**: Hardened module type enforcement across all Next.js API route test mocks (`tests/integration/*`).
- **QA Pipeline Integrity**: Fixed `@testing-library/jest-dom` Vitest resolver incompatibility that was crashing `next build`.
- **Test Payload Strictness**: Injected missing properties (`latitude`, `region`, `expectedAnswerType`) into Unit Test mock objects to fulfill strict interface constraints without resorting to `@ts-ignore`.
- **Zero-Regression CI**: Audited the entire CI/CD path. Results: 0 Lint Errors, 100% TS Compilation, 47/47 Vitest passes, and optimized Next.js Production Build success.

---

## [2.0.0] — 2026-02-26

### Added

- **ZTAIP architecture** alignment (Zero Trust AI Platform)
- **Docker deployment** with single-command setup (`docker compose up`)
- **CAIQ Knowledge Transfer Engine** with 4-tier confidence matching (Direct → Semantic → AI Adapted → Manual)
- **Knowledge Repository** with 1,000+ pre-validated security Q&A entries
- **Multi-company, multi-product** CAIQ configuration with 3-layer override hierarchy
- **Quick Answer** 3-step flow for rapid vendor risk assessment
- **JSON import/export** for knowledge base portability
- **World Monitor** intelligence dashboard — MapLibre GL interactive map with 25+ data layers
- **Country Instability Index** for 8 office locations (DE, UK, TH, AU, NZ, ES, AT, US)
- **Signal intelligence** and anomaly detection with baseline tracking
- **Infrastructure monitoring** — undersea cables, datacenters, nuclear facilities, pipelines
- **Abuse.ch integration** — ThreatFox (IOCs), URLhaus (malicious URLs), MalwareBazaar (malware samples)
- **Shodan integration** — attack surface monitoring, enrichment, vendor scanning
- **Attack Surface Monitor** with dangerous service detection and CVE exposure
- **AI CISO Assistant** (Astra persona) — native, multi-provider conversational AI
- **Circuit breaker pattern** for AI provider resilience (CLOSED → OPEN → HALF_OPEN)
- **Dynamic Autonomy Router** — AUTONOMOUS / SUPERVISED / MANUAL modes
- **Immutable Audit Fabric** — append-only audit trail with indexed queries
- **Tabletop exercises** for incident response training
- **Dark hacker theme** — Bloomberg Terminal aesthetic with JetBrains Mono metrics
- **Command Center** with KPI status bar, threat monitor, compliance posture, AI activity
- **Interactive product roadmap** page
- **Help center** with searchable module documentation
- **AI Economics tracking** — token usage, cost per query, provider health monitoring
- **Evidence Vault** — compliance evidence storage with framework linking
- **Policy Engine** — full lifecycle management (Draft → Review → Approved → Retired)
- **FAIR risk quantification** with Annual Loss Expectancy calculation
- **Team management** with role-based invitations

### Changed

- Sidebar reduced from **20 to 11 items**
- Routes merged into **tab-based navigation** (8 modules with internal tabs)
- Auth consolidated to **NextAuth 5** (from custom implementation)
- Threat intelligence: **Docker stack → free cloud APIs** (Abuse.ch, Shodan, USGS, GDELT)
- Storage migrated from **localStorage to Prisma** (SQLite)
- AI architecture: **single-provider → multi-provider** (Anthropic, Gemini, Ollama)

### Removed

- Wargames module (replaced by Tabletop Exercises)
- Budget module (100% mock data, no real value)
- Infrastructure placeholder page (empty shell)
- Privacy placeholder page (empty shell)
- Network telemetry widget (fake data)
- OpenClaw agent dependency (replaced by native AI assistant)
- MISP integration (replaced by Abuse.ch free APIs)
- 75KB hardcoded wargames data file
