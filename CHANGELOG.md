# Changelog

All notable changes to Astra-CISO are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
