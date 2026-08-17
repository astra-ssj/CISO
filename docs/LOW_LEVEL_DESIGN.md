# Low-Level Design — Astra-CISO

> **v3 override (August 2026):** Schema and runtime have moved. See `prisma/schema.prisma` (Postgres, `Observation`, `SkillRun`, `Approval`). This file’s SQLite / 17-model notes are historical. Skill HTTP paths: `src/lib/skills/README.md`. GraphJin allowlist: `ops/graphjin/config.yml`.

## 1. Database Schema

17 Prisma models on SQLite. Full schema in [`prisma/schema.prisma`](../prisma/schema.prisma).

### 1.1 Core Auth

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `User` | id, email, password, role (`CISO`/`SEC_ENGINEER`/`AUDITOR`/`VIEWER`), ssoProvider, mfaEnabled | Core user with RBAC |
| `Account` | userId, provider, providerAccountId, access_token | OAuth provider accounts |
| `Session` | sessionToken, userId, expires | Active sessions |
| `VerificationToken` | identifier, token, expires | Email verification |
| `Authenticator` | credentialID, userId, credentialPublicKey, counter | WebAuthn/passkeys |

### 1.2 Risk Engine

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `RiskScenario` | title, ownerId, status, threatActor, threatEventFreq, vulnerability, primaryLoss, secondaryLoss, controlsEffective, ale, riskScore | FAIR risk quantification |
| `RiskHistory` | riskScenarioId, date, score, ale | Risk score over time |

### 1.3 Governance & Policy

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `Policy` | title, content, version, status (`DRAFT`/`REVIEW`/`APPROVED`/`RETIRED`), type, authorId, frameworks (JSON), controls (JSON), sections (JSON) | Policy lifecycle management |

### 1.4 Incidents

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `Incident` | title, severity, status, commanderId, startedAt, resolvedAt | Incident tracking |
| `IncidentEvent` | incidentId, type, payload (JSON), timestamp | Incident timeline events |

### 1.5 Vendors

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `Vendor` | name, tier (`TIER_1`–`TIER_4`), status, inherentRiskScore, lastAssessmentDate | Simple vendor list |
| `VendorRisk` | name, category, riskTier, riskScore, dataAccess (JSON), complianceCertifications (JSON) | Rich vendor assessments |
| `VendorAssessment` | vendorRiskId, date, score, findings (JSON), assessor | Assessment history |

### 1.6 Evidence Vault

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `Evidence` | title, fileName, fileSize, mimeType, filePath, category, status, expiresAt, frameworks (JSON), tags (JSON) | Compliance evidence |
| `EvidenceLink` | evidenceId, linkType, linkId, linkName | Cross-reference to controls/risks/policies |

### 1.7 Strategy

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `Objective` | title, quarter, year, owner, status, keyResults (JSON), linkedRisks (JSON) | OKR tracking |
| `Project` | title, owner, status, priority, budgetAllocated, budgetSpent, phases (JSON) | Program management |

### 1.8 Notifications

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `Notification` | type, title, message, severity, read, timestamp | User notifications |
| `AlertRule` | name, condition, threshold, enabled, notificationType | Configurable alert rules |

### 1.9 Playbooks

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `Playbook` | title, severity, status, phases (JSON), evidenceLog (JSON) | Incident response playbooks |

### 1.10 Audit Trail

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `AuditLog` | timestamp, userId, action, category, resource, resourceId, description, severity (`INFO`/`WARNING`/`CRITICAL`) | Immutable audit fabric. Indexed on timestamp, userId, category, action |

### 1.11 Knowledge Repository

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `KnowledgeEntry` | questionText, questionNormalized, keywords, domain, category, answerType, answerText, evidence, frameworks (JSON), confidence, usageCount | 1000+ common Q&A entries |
| `Company` | name, legalEntity, jurisdiction, country, industry, certifications (JSON), primaryCloud | Multi-tenant company config |
| `Product` | name, type, dataTypes (JSON), hostingRegions (JSON), complianceScope (JSON), companyId | Product-level config |
| `KnowledgeOverride` | knowledgeEntryId, scope (`COMPANY`/`PRODUCT`), questionText, answerType, answerText | Company/product answer overrides |

### 1.12 Integration Hub

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `Integration` | integrationId (unique slug), category, status, config (AES-256-GCM encrypted JSON) | External integrations |
| `TeamInvite` | email, role, token, status, expiresAt | Team member invitations |

### 1.13 Attack Surface

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `AttackSurfaceScan` | scanDate, totalAssets, totalVulns, riskScore, results (JSON) | Shodan scan history |

---

## 2. API Routes

95 route files under `src/app/api/`. All routes require authentication unless noted.

### 2.1 Auth

| Method | Path | Description |
|--------|------|-------------|
| * | `/api/auth/[...nextauth]` | NextAuth 5 catch-all |
| POST | `/api/auth/login` | Credentials login |

### 2.2 AI Agent

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/agent/chat` | AI CISO Assistant conversation |
| POST | `/api/agent/analyze` | AI analysis of security data |
| POST | `/api/agent/analyze-policy` | AI policy analysis |
| POST | `/api/agent/generate-policy` | AI policy generation |

### 2.3 CAIQ Engine

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/caiq/parse` | Parse CAIQ Excel files |
| POST | `/api/caiq/enhance` | AI-enhance CAIQ answers |
| POST | `/api/caiq/export` | Export CAIQ assessment |
| GET/POST | `/api/vendors/caiq` | CAIQ answer engine |
| POST | `/api/vendors/caiq/assess` | Run CAIQ assessment |
| POST | `/api/vendors/caiq/parse` | Parse vendor CAIQ |
| GET | `/api/vendors/caiq/metrics` | CAIQ performance metrics |
| GET/PUT | `/api/vendors/caiq/org-context` | Organization context config |
| POST | `/api/vendors/caiq/export` | Export CAIQ results |

### 2.4 Knowledge

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/knowledge` | List / create entries |
| GET/PUT/DELETE | `/api/knowledge/[id]` | Entry CRUD |
| POST | `/api/knowledge/import` | JSON bulk import |
| GET | `/api/knowledge/export` | JSON bulk export |
| POST | `/api/knowledge/ingest` | Ingest from assessment |
| GET/POST | `/api/knowledge-overrides` | Company/product overrides |
| GET/PUT/DELETE | `/api/knowledge-overrides/[id]` | Override CRUD |

### 2.5 Intelligence

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/intelligence/threatfox` | ThreatFox IOC data |
| GET/POST | `/api/intelligence/urlhaus` | URLhaus malicious URLs |
| GET/POST | `/api/intelligence/malware` | MalwareBazaar samples |
| GET/POST | `/api/intelligence/threats` | Unified threat feed |
| POST | `/api/intelligence/threats/classify` | AI threat classification |
| GET | `/api/intelligence/shodan` | Shodan host lookup |
| GET | `/api/intelligence/shodan/health` | Shodan API health |
| POST | `/api/intelligence/shodan/attack-surface` | Attack surface scan |
| POST | `/api/intelligence/shodan/vendor-scan` | Vendor infrastructure scan |
| GET | `/api/intelligence/earthquakes` | USGS earthquake data |
| GET | `/api/intelligence/gdelt` | GDELT news events |
| POST | `/api/intelligence/enrich` | Multi-source IP/domain enrichment |
| GET | `/api/intelligence/instability` | Country Instability Index |
| GET | `/api/intelligence/anomalies` | Anomaly detection results |
| GET | `/api/intelligence/brief` | AI threat briefing |
| GET | `/api/intelligence/dashboard` | Intelligence dashboard stats |
| GET | `/api/intelligence/stats` | Intelligence statistics |
| GET | `/api/intelligence/health` | Intelligence API health |
| GET | `/api/intelligence/feeds` | Feed management |
| GET | `/api/intelligence/actors` | Threat actor profiles |
| GET | `/api/intelligence/campaigns` | Active campaigns |
| GET | `/api/intelligence/convergence` | Threat convergence analysis |
| GET | `/api/intelligence/indicators` | IOC indicators |
| GET | `/api/intelligence/attack-heatmap` | Attack heatmap data |
| GET | `/api/intelligence/news` | Security news aggregation |
| GET | `/api/intelligence/osint` | OSINT search |
| GET | `/api/intelligence/outages` | Service outage monitoring |
| GET | `/api/intelligence/reports` | Intelligence reports |
| GET | `/api/intelligence/search` | Cross-source search |
| GET | `/api/intelligence/video-streams` | OSINT video streams |

### 2.6 Governance

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/risks` | Risk scenarios |
| GET/PUT/DELETE | `/api/risks/[id]` | Risk CRUD |
| GET/POST | `/api/policies` | Policy management |
| GET/PUT/DELETE | `/api/policies/[id]` | Policy CRUD |
| GET/POST | `/api/audit-logs` | Audit trail |
| GET | `/api/audit-logs/stats` | Audit statistics |
| POST | `/api/audit-logs/export` | Audit log export |

### 2.7 Evidence

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/evidence` | Evidence list / upload |
| GET/PUT/DELETE | `/api/evidence/[id]` | Evidence CRUD |
| GET | `/api/evidence/[id]/download` | File download |
| POST | `/api/evidence/[id]/link` | Link evidence to resource |
| DELETE | `/api/evidence/[id]/link/[linkId]` | Remove link |
| GET | `/api/evidence/stats` | Evidence statistics |

### 2.8 Vendors

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/vendor-list` | Simple vendor list |
| GET/PUT/DELETE | `/api/vendor-list/[id]` | Vendor CRUD |
| GET/POST | `/api/vendor-risk` | Rich vendor risk |
| GET/PUT/DELETE | `/api/vendor-risk/[id]` | Vendor risk CRUD |
| POST | `/api/vendor-risk/[id]/assessments` | Add assessment |

### 2.9 Strategy

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/okr` | List OKRs and projects |
| GET/PUT/DELETE | `/api/okr/objectives/[id]` | Objective CRUD |
| GET/PUT/DELETE | `/api/okr/projects/[id]` | Project CRUD |

### 2.10 Organizations

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/companies` | Company management |
| GET/PUT/DELETE | `/api/companies/[id]` | Company CRUD |
| GET/POST | `/api/products` | Product management |
| GET/PUT/DELETE | `/api/products/[id]` | Product CRUD |

### 2.11 Integrations & System

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/integrations` | Integration registry |
| GET/PUT | `/api/integrations/[id]` | Integration CRUD |
| POST | `/api/integrations/[id]/connect` | Connect integration |
| POST | `/api/integrations/[id]/disconnect` | Disconnect integration |
| POST | `/api/integrations/[id]/test` | Test integration |
| POST | `/api/integrations/trivy` | Trivy scan trigger |
| GET | `/api/health` | Application health check |
| GET | `/api/admin/metrics` | Admin metrics dashboard |
| GET/POST | `/api/notifications` | Notifications |
| GET/PUT/DELETE | `/api/notifications/[id]` | Notification CRUD |
| POST | `/api/notifications/alert-rules/[id]` | Alert rule management |
| POST | `/api/security/audit` | Security audit trigger |
| POST | `/api/security/scan` | Security scan |
| GET/POST | `/api/playbooks` | Playbook management |
| GET/PUT/DELETE | `/api/playbooks/[id]` | Playbook CRUD |
| GET/POST | `/api/team/users` | Team user management |
| POST | `/api/team/invite` | Send team invite |
| POST | `/api/jira/route` | Jira sync |
| POST | `/api/notebook/chat` | Notebook AI chat |
| POST | `/api/kpi-upload` | KPI data upload |

---

## 3. Intelligence Clients

### 3.1 `src/lib/intelligence/clients/abusech-client.ts`

| Method | Endpoint | Description | Cache TTL |
|--------|----------|-------------|-----------|
| `getRecentThreats()` | ThreatFox `/api/v1/` | Latest IOCs (last 24h) | 15 min |
| `searchIOC(term)` | ThreatFox `/api/v1/` | Search by hash, IP, domain | 30 min |
| `getRecentURLs()` | URLhaus `/v1/urls/recent/` | Recent malicious URLs | 15 min |
| `lookupURL(url)` | URLhaus `/v1/url/` | URL reputation lookup | 1 hour |
| `getRecentMalware()` | MalwareBazaar `/api/v1/` | Recent malware samples | 15 min |
| `lookupHash(hash)` | MalwareBazaar `/api/v1/` | Hash lookup (SHA256/MD5) | 1 hour |

### 3.2 `src/lib/intelligence/clients/shodan-client.ts`

| Method | Description | Rate Limit | Cache TTL |
|--------|-------------|------------|-----------|
| `hostLookup(ip)` | Full host info (ports, CVEs, SSL) | 1 req/sec | 24 hours |
| `search(query)` | Shodan search query | 1 req/sec | 1 hour |
| `attackSurface(targets)` | Scan multiple targets | 1 req/sec | 1 hour |
| `vendorScan(domain)` | Domain infrastructure scan | 1 req/sec | 1 hour |
| `resolve(hostnames)` | DNS resolution | 1 req/sec | 24 hours |
| `getApiInfo()` | API key info, credits | — | 5 min |

### 3.3 `src/lib/intelligence/clients/otx-client.ts`

| Method | Description | Cache TTL |
|--------|-------------|-----------|
| `getSubscribedPulses()` | User-subscribed OTX pulses | 30 min |
| `getIndicator(type, value)` | IOC lookup (IP, domain, hash) | 1 hour |

---

## 4. Key Libraries

### 4.1 CAIQ (`src/lib/caiq/`)

| File | Purpose |
|------|---------|
| `caiq-answer-engine.ts` | Core answer matching with 4-tier confidence |
| `caiq-semantic-matcher.ts` | Semantic similarity matching for Q&A |
| `caiq-validator.ts` | Answer validation and confidence scoring |
| `caiq-org-context.ts` | Organization context resolution (Company → Product) |
| `caiq-excel-parser.ts` | CAIQ Excel file parsing |
| `caiq-export.ts` | CAIQ assessment export (Excel/JSON) |
| `caiq-knowledge-base.ts` | Knowledge base CRUD operations |
| `caiq-metrics.ts` | CAIQ performance metrics |
| `caiq-legacy.ts` | Legacy CAIQ compatibility |
| `types.ts` | Type definitions |

### 4.2 AI (`src/lib/ai/`)

| File | Purpose |
|------|---------|
| `engine.ts` | Multi-provider AI engine (Anthropic, Gemini, Ollama) |
| `circuit-breaker.ts` | Circuit breaker pattern for AI resilience |

### 4.3 Intelligence (`src/lib/intelligence/`)

| File | Purpose |
|------|---------|
| `data-layers.ts` | Layer definitions (static + API-fed layers) |
| `threat-classifier.ts` | Keyword + AI threat classification |
| `signal-aggregator.ts` | Cross-source signal aggregation |
| `anomaly-detector.ts` | Baseline anomaly detection |
| `proximity-analyzer.ts` | Geographic proximity analysis |
| `instability-index.ts` | Country Instability Index calculation |
| `data-freshness.ts` | API data freshness monitoring |
| `country-coords.ts` | Country coordinate mappings |
| `cache.ts` | Intelligence caching layer |
| `intelligence-service.ts` | Unified intelligence service |
| `clients/abusech-client.ts` | Abuse.ch API client |
| `clients/shodan-client.ts` | Shodan API client |
| `clients/otx-client.ts` | AlienVault OTX client |
| `types/unified-types.ts` | Unified threat types |
| `types/abusech-types.ts` | Abuse.ch types |
| `types/shodan-types.ts` | Shodan types |
| `types/otx-types.ts` | OTX types |

### 4.4 Auth (`src/lib/`)

| File | Purpose |
|------|---------|
| `rbac.ts` | Role-based access control |
| `audit.ts` | Audit logging helpers |

### 4.5 Testing Architecture (`tests/`)

| File | Purpose |
|------|---------|
| `setup.ts` | Global vitest setup, `@testing-library/jest-dom/vitest` integrations, environment stubs |
| `test-utils.tsx` | Mock `NextRequest`, `Response` parsing, and wrapper render providers for integration testing |
| `vitest.*.config.ts` | Separated runner configs for `unit`, `smoke`, and `integration` execution targets |

---

## 5. Component Tree

### 5.1 Command Center (`src/components/command/`)

| Component | Purpose |
|-----------|---------|
| `KPIStatusBar.tsx` | Top KPI metrics bar with sparklines |
| `ThreatMonitorWidget.tsx` | Global Threat Monitor (mini world map) |
| `ActiveThreats.tsx` | Live threat feed from Abuse.ch |
| `PendingActions.tsx` | Pending security actions queue |
| `CompliancePosture.tsx` | Framework compliance radial charts |
| `RecentIncidents.tsx` | Recent incident cards |
| `AIActivity.tsx` | AI provider health and activity |
| `MiniLeafletMap.tsx` | Miniature world map for threat overview |

### 5.2 Intelligence (`src/components/intelligence/`)

| Component | Purpose |
|-----------|---------|
| `ThreatBriefing.tsx` | AI-generated threat intelligence report |
| `AttackSurface.tsx` | Shodan attack surface monitor |
| `EnrichmentTool.tsx` | Multi-source IP/domain enrichment |
| `FeedManager.tsx` | Intelligence feed configuration |
| `IOCExplorer.tsx` | IOC search and exploration |
| `CampaignsView.tsx` | Active threat campaign tracking |
| `AttackHeatmap.tsx` | Geographic attack visualization |
| `ThreatIntelWidget.tsx` | Threat intelligence summary widget |

#### World Monitor (`src/components/intelligence/world-monitor/`)

| Component | Purpose |
|-----------|---------|
| `WorldMonitorMap.tsx` | Main MapLibre GL interactive map |
| `LayerControlPanel.tsx` | 25+ data layer toggles |
| `DataFreshnessBar.tsx` | API data freshness status |
| `DetailPanel.tsx` | Selected feature detail view |
| `MapLegend.tsx` | Dynamic map legend |
| `RegionPresets.tsx` | Quick region navigation |
| `TimeFilter.tsx` | Temporal data filtering |

#### Intelligence Tabs (`src/components/intelligence/tabs/`)

| Component | Purpose |
|-----------|---------|
| `ThreatBriefingTab.tsx` | Threat briefing tab wrapper |
| `SignalIntelligenceTab.tsx` | Signal intelligence dashboard |
| `InfrastructureTab.tsx` | Infrastructure monitoring |
| `LiveFeedsTab.tsx` | Live threat feed viewers |

---

## 6. Static Data Files

All files in `src/data/intelligence/`:

| File | Entries | Description |
|------|---------|-------------|
| `conflict-zones.json` | 15 | Active conflict regions worldwide |
| `military-bases.json` | 220 | Known military installations |
| `undersea-cables.json` | 30 | Submarine cable landing points |
| `nuclear-facilities.json` | 50 | Nuclear power plants and facilities |
| `datacenters.json` | 111 | Major datacenter locations |
| `pipelines.json` | 25 | Critical pipeline infrastructure |
| `office-locations.json` | 8 | Company office locations (DE, UK, TH, AU, NZ, ES, AT, US) |
| `strategic-locations.json` | 74 | Strategic geopolitical locations |
| `video-streams.json` | 15 | OSINT video stream sources |

---

## 7. State Management

| Store | Technology | Data |
|-------|-----------|------|
| **Persistent** | SQLite via Prisma | All domain data (17 models) |
| **UI State** | Zustand | Sidebar collapse, theme, active tab, filter selections, modal open/close |
| **Server State** | React `fetch` + `useEffect` | API data with client-side caching |

**Rule:** No business data in Zustand. All persistent business data flows through Prisma.

---

## 8. Environment Variables

| Variable | Type | Default | Used By |
|----------|------|---------|---------|
| `DATABASE_URL` | string | `file:./dev.db` | Prisma |
| `NEXTAUTH_SECRET` | string | — | NextAuth 5 |
| `NEXTAUTH_URL` | string | `http://localhost:3000` | NextAuth 5 |
| `AI_PROVIDER` | enum | `MOCK` | AI engine |
| `ANTHROPIC_API_KEY` | string | — | AI (Claude) |
| `GOOGLE_API_KEY` | string | — | AI (Gemini) |
| `OLLAMA_BASE_URL` | string | — | AI (Ollama) |
| `SHODAN_API_KEY` | string | — | Intelligence (Shodan) |
| `ALIENVAULT_OTX_KEY` | string | — | Intelligence (OTX) |
| `ABUSECH_ENABLED` | boolean | `true` | Intelligence (Abuse.ch) |
| `USGS_ENABLED` | boolean | `true` | Intelligence (USGS) |
| `GDELT_ENABLED` | boolean | `true` | Intelligence (GDELT) |
| `OPENSKY_USERNAME` | string | — | Intelligence (flights) |
| `OPENSKY_PASSWORD` | string | — | Intelligence (flights) |
| `VESSELFINDER_API_KEY` | string | — | Intelligence (vessels) |
| `NASA_FIRMS_API_KEY` | string | — | Intelligence (fires) |
| `GROQ_API_KEY` | string | — | Intelligence (AI classify) |
| `UPSTASH_REDIS_REST_URL` | string | — | Caching |
| `UPSTASH_REDIS_REST_TOKEN` | string | — | Caching |
| `NEXT_PUBLIC_ADMIN_USER` | string | `admin` | Demo auth |
| `NEXT_PUBLIC_ADMIN_PASS` | string | `changeme` | Demo auth |
