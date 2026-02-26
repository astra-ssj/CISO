# Changelog

All notable changes to **Astra CISO** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [v2.1.1] — In Progress

### Added

- **Help Center redesign** — 7 sections, 35 articles, search, expandable cards, keyboard shortcuts
- **Google Workspace SSO integration** (OAuth 2.0)
- **Integration Hub** — 24 integrations across 9 categories
- **Team Management** with invite flow and RBAC
- **Security Policies** — SSO enforcement, MFA, session timeout

### Fixed

- **MiniWorldMap `useState` crash** — moved dynamic import to `useEffect`
- **Integration page crash** — fixed during QA

### In Progress

- Google SSO end-to-end testing
- Slack webhook testing
- Sprint 2: Audit Log Viewer + Evidence Vault

---

## [v2.0.0] — 2026-02-24

### Added

- **ZTAIP architecture alignment** — Zero-Trust AI Platform design principles across the stack
- **Docker deployment support** — Production-ready `Dockerfile`, `docker-compose.yml`, `entrypoint.sh`, and health-check endpoint (`/api/health`)
- **CAIQ Knowledge Transfer Engine** — 4-tier matching pipeline: Exact → TF-IDF Semantic → AI Semantic → AI Context Generation
- **Knowledge Repository** — 1,000+ pre-validated Q&A pairs; JSON import/export; multi-layer view (Common / Company / Product)
- **Multi-company, multi-product CAIQ configuration** — Environment-driven org and product context for tailored questionnaire responses
- **Quick Answer 3-step flow** — Upload questionnaire → Knowledge Base match → AI enhancement → Export
- **JSON import/export** for knowledge base (full and incremental)
- **World Monitor intelligence dashboard** — Interactive map via MapLibre GL with real data points
- **Country Instability Index** — Risk scoring for office locations with live indicator overlays
- **Signal intelligence & anomaly detection** — Geopolitical, cyber, and infrastructure signals
- **Infrastructure monitoring** — Undersea cables, data centres, nuclear facility tracking
- **AI CISO Assistant** — Native multi-provider AI (Gemini + Claude fallback) with circuit breaker pattern; replaces OpenClaw
- **Circuit breaker pattern** — Resilient AI calls with automatic fallback and degraded-mode handling
- **Tabletop Exercises** — Scenario-based security exercise runner (replaced Wargames module)
- **Dark hacker theme** — Cohesive dark UI with neon accent system throughout
- **Interactive Product Roadmap page** — `/roadmap` with release cards, status indicators, priority badges, and effort estimates
- **Comprehensive Help Centre** — Module-level documentation with working deep-links

### Changed

- **Sidebar reduced** from 20 items to 11 — focused to core CISO workflows
- **Routes merged** into tab-based navigation to eliminate shallow pages
- **Auth consolidated** to NextAuth v5 with edge-compatible middleware
- **Storage migrating** from `localStorage` to Prisma / SQLite for persistence
- **README** rewritten — added Docker, environment reference, data sovereignty, and health-check documentation

### Removed

- **Wargames module** — replaced by Tabletop Exercises
- **Budget module** — removed (100% mock data, no real data pipeline)
- **Infrastructure placeholder** — consolidated into World Monitor
- **Privacy placeholder** — removed pending full reimplementation
- **Network telemetry widget** — removed (generated fake data)
- **OpenClaw agent dependency** — replaced by native AI CISO Assistant
- **75 KB hardcoded wargames data file** — removed with the module

### Security

- Middleware rewritten for Edge runtime compatibility (replaced Node.js `fs` and `crypto.randomBytes`)
- All external data boundaries validated with Zod schemas
- `AUTH_SECRET` and `JWT_SECRET` required as runtime environment variables; build fails if missing in production
- Docker image runs as non-root user

---

## [v1.x] — Legacy

> Prior versions were internal prototypes. Public release history begins at v2.0.0.

[v2.1.1]: https://github.com/SristiNative/astra-ciso/compare/v2.0.0...HEAD
[v2.0.0]: https://github.com/SristiNative/astra-ciso/releases/tag/v2.0.0
