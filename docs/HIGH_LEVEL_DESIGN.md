# High-Level Design — Astra-CISO v2.0

## 1. System Context

```
                    ┌──────────────┐
                    │  CISO / Ops  │
                    │   (Browser)  │
                    └──────┬───────┘
                           │ HTTPS
                    ┌──────▼───────────────────────────┐
                    │         Astra-CISO                │
                    │  Next.js 16 · React 19 · TS 5    │
                    │  Prisma 7 · SQLite · Zustand     │
                    └──┬────┬────┬────┬────┬────┬──────┘
                       │    │    │    │    │    │
              ┌────────┘    │    │    │    │    └────────┐
              ▼             ▼    ▼    ▼    ▼             ▼
        ┌──────────┐  ┌─────┐ ┌────┐ ┌────┐ ┌──────┐ ┌───────┐
        │ Anthropic│  │Gemini│ │OTX │ │USGS│ │GDELT │ │Shodan │
        │  Claude  │  │      │ │    │ │    │ │      │ │       │
        └──────────┘  └─────┘ └────┘ └────┘ └──────┘ └───────┘
                                 │
                          ┌──────┘
                          ▼
                    ┌──────────┐
                    │ Abuse.ch │
                    │ ThreatFox│
                    │ URLhaus  │
                    │ Malware  │
                    │ Bazaar   │
                    └──────────┘
```

---

## 2. Module Architecture

The platform has **8 modules**, each accessible via the sidebar. Modules use tab-based navigation internally.

### 2.1 Command Center

| Tab | Purpose |
|-----|---------|
| Overview | KPI status bar, Global Threat Monitor, active threats, pending actions, compliance posture, recent incidents, AI activity |
| Executive Brief | AI-generated security summary for board reporting |
| Reports & Board Deck | Report generation, PDF/DOCX export |

### 2.2 Decision Center

| Tab | Purpose |
|-----|---------|
| Decisions | AI-prioritized security decision queue |
| Action Queue | Aggregated action items from all modules |

### 2.3 Strategy & OKRs

| Tab | Purpose |
|-----|---------|
| OKRs | Security objectives and key results tracking |
| Defense Matrix | MITRE ATT&CK defense coverage matrix |
| KPI Dashboard | Security metrics and trend analysis |
| Program Tracker | Project portfolio management |

### 2.4 Governance & Risk

| Tab | Purpose |
|-----|---------|
| Compliance | Multi-framework tracking: ISO 27001, SOC 2, NIS2, GDPR, Cyber Essentials, EU AI Act |
| Risk Register | FAIR risk quantification with ALE calculation |
| Policy Engine | Policy lifecycle: draft → review → approved → retired |
| Audit Logs | Immutable audit trail viewer |
| Evidence Vault | Compliance evidence storage and linking |

### 2.5 Vendor Risk

| Tab | Purpose |
|-----|---------|
| Quick Answer | 3-step CAIQ answer flow with confidence matching |
| Knowledge Transfer | Bulk Q&A processing with 4-tier matching |
| Knowledge Base | 1000+ entry repository management, JSON import/export |
| CAIQ Review | Assessment review and approval |
| Vendor Registry | Vendor management with Shodan scanning |

### 2.6 Incidents

| Tab | Purpose |
|-----|---------|
| Active Incidents | Incident tracking with severity and status |
| War Room | Real-time incident collaboration |
| Tabletop Exercises | Scenario-based exercises linked to real threat data |

### 2.7 Intelligence

| Tab | Purpose |
|-----|---------|
| Threat Briefing | AI-generated threat intelligence summary |
| World Monitor | Interactive MapLibre GL map with 25+ data layers |
| Attack Surface | Shodan-powered asset discovery, open ports, CVE detection |
| Signal Intelligence | Signal aggregation, anomaly detection, Country Instability Index |
| Infrastructure | Undersea cables, datacenters, nuclear facilities, pipelines |
| Military & Maritime | Flight tracking (OpenSky), vessel tracking (VesselFinder) |
| Live Feeds | ThreatFox, URLhaus, MalwareBazaar real-time feeds |
| Ransomware | Ransomware group tracking, victim feeds, statistics |

### 2.8 AppSec

| Tab | Purpose |
|-----|---------|
| Vulnerability Feed | CVE tracking and vulnerability management |
| SAST Scanner | Static analysis with Trivy integration |
| Remediation Tracking | Remediation velocity and SLA monitoring |

---

## 3. ZTAIP Architecture

### 3.1 Zero Trust AI Platform Principles

All AI operations follow ZTAIP principles:

- **Never trust, always verify** — every AI response is validated
- **Least privilege** — AI has read-only access to data by default
- **Assume breach** — circuit breakers prevent cascade failures
- **Immutable audit** — every AI action is logged

### 3.2 Circuit Breaker

```
  CLOSED ──(failure threshold)──► OPEN
     ▲                              │
     │                         (timeout)
     │                              │
     └────(success)──── HALF_OPEN ◄─┘
```

- **CLOSED:** Requests pass through normally. Failures increment counter.
- **OPEN:** All requests immediately fail. Timer starts.
- **HALF_OPEN:** One probe request allowed. Success → CLOSED, failure → OPEN.

Applied per AI provider (Anthropic, Gemini, Ollama) and per intelligence API.

### 3.3 Dynamic Autonomy Router

```
┌────────────────┬──────────────────────────────────────┐
│ Mode           │ Behavior                             │
├────────────────┼──────────────────────────────────────┤
│ AUTONOMOUS     │ AI executes without human approval   │
│ SUPERVISED     │ AI recommends, human approves        │
│ MANUAL         │ Human decides, AI assists on request │
└────────────────┴──────────────────────────────────────┘
```

### 3.4 Immutable Audit Fabric

- Append-only `AuditLog` model — no updates or deletes
- Every significant action logged: CREATE, READ, UPDATE, DELETE, LOGIN, EXPORT, IMPORT, etc.
- Indexed by timestamp, userId, category, and action
- Supports compliance evidence and forensic investigation

---

## 4. Intelligence Architecture

### 4.1 Data Layer System

The World Monitor uses a **layered data architecture**:

| Layer Type | Source | Examples |
|-----------|--------|----------|
| **Static** (local JSON) | Bundled data files | Conflict zones (15), military bases (220), undersea cables (30), nuclear facilities (50), datacenters (111), pipelines (25), office locations (8) |
| **API-fed** (free, no key) | Abuse.ch, USGS, GDELT | ThreatFox IOCs, URLhaus URLs, MalwareBazaar samples, earthquakes, global news events |
| **API-fed** (free account) | Shodan, AlienVault OTX | Attack surface assets, open ports, community IOC pulses |
| **API-fed** (optional) | OpenSky, VesselFinder, NASA FIRMS | Military flights, naval vessels, satellite fire detection |

### 4.2 Abuse.ch Integration

| Service | Endpoint | Data | Protocol |
|---------|----------|------|----------|
| ThreatFox | `threatfox-api.abuse.ch/api/v1/` | IOCs, malware families, C2 | JSON POST |
| URLhaus | `urlhaus-api.abuse.ch/v1/` | Malicious URLs, hosting info | Form-encoded POST |
| MalwareBazaar | `mb-api.abuse.ch/api/v1/` | Malware samples, hashes | JSON POST |

### 4.3 Shodan Integration

- **Attack Surface:** Discover internet-facing assets, detect dangerous services, SSL analysis
- **Enrichment:** Enrich IPs/domains with port, CVE, and technology data
- **Vendor Scan:** Scan vendor infrastructure for security posture assessment
- **Rate Limit:** 1 request/second (free tier)
- **Cache TTL:** 1 hour for search results, 24 hours for host lookups

### 4.4 Country Instability Index (CII)

Aggregated score for each of the 8 office locations based on:

- Active conflict proximity
- Recent earthquake activity
- Cyber threat density (from IOC data)
- GDELT event tone and volume
- Infrastructure proximity (nuclear, pipelines)

### 4.5 Signal Aggregation & Anomaly Detection

- Signals aggregated across all intelligence sources
- Baseline-based anomaly detection with configurable thresholds
- Threat classification pipeline: keyword-based + AI-assisted
- Data freshness monitoring with stale detection

### 4.6 Graceful Degradation

When APIs are unavailable:

- Static layers always available (bundled JSON)
- API layers show "Configure in Settings" if key missing
- Failed API calls return cached data (if available) or empty state
- Circuit breaker prevents repeated calls to failing endpoints
- Data freshness indicators go amber/red for stale data

---

## 5. Data Architecture

### 5.1 Database

- **Engine:** SQLite via Prisma 7
- **17 models** covering: users, auth, risks, policies, incidents, vendors, evidence, OKRs, projects, notifications, playbooks, audit logs, knowledge, companies, products, knowledge overrides, integrations, team invites, attack surface scans

### 5.2 State Management

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Persistent | SQLite (Prisma) | All domain data, auth, audit trail |
| Client UI | Zustand | Ephemeral UI state only (no business data in client stores) |

### 5.3 Knowledge Repository

```
┌──────────────────────┐
│   KnowledgeEntry     │ ← 1000+ common entries
│   (global answers)   │
└──────────┬───────────┘
           │
    ┌──────▼──────┐
    │   Company   │ ← Company-specific overrides
    │ (overrides) │
    └──────┬──────┘
           │
     ┌─────▼─────┐
     │  Product   │ ← Product-specific overrides
     │ (overrides)│
     └───────────┘
```

Three-layer hierarchy: KnowledgeEntry → Company → Product (via KnowledgeOverride).

---

## 6. AI Architecture

### 6.1 Multi-Provider Support

| Provider | Use Cases | Config |
|----------|----------|--------|
| Anthropic Claude | CAIQ enhancement, threat briefings, policy generation | `ANTHROPIC_API_KEY` |
| Google Gemini | Alternative AI provider | `GOOGLE_API_KEY` |
| Ollama | Local/self-hosted inference | `OLLAMA_BASE_URL` |

### 6.2 AI CISO Assistant (Astra)

- Native AI assistant (replaced OpenClaw dependency)
- Multi-turn conversational interface
- Context-aware: has access to policies, risks, compliance state
- Uses Dynamic Autonomy Router for action permissions

### 6.3 AI Economics

- Token usage tracking per provider
- Cost calculation per query
- Provider health monitoring (circuit breaker state)
- Query history and analytics

---

## 7. Security Architecture

### 7.1 Authentication

- **NextAuth 5** with credentials provider
- Session-based authentication with JWT tokens
- SSO-ready architecture (Azure AD, Okta, Google — v2.1)

### 7.2 Authorization (RBAC)

| Role | Permissions |
|------|-------------|
| `CISO` | Full access, admin operations |
| `SEC_ENGINEER` | Create/edit resources, run scans |
| `AUDITOR` | Read-only access, audit log viewer |
| `VIEWER` | Read-only dashboard access |

### 7.3 Security Measures

- CSP headers via middleware
- Rate limiting on API routes
- Encrypted integration credentials (AES-256-GCM)
- Shodan lookups logged to immutable audit trail
- Input validation with Zod at API boundaries

---

## 8. Deployment

### Docker Multi-Stage Build

```
Stage 1: deps      → Install dependencies
Stage 2: builder   → Build Next.js application
Stage 3: runner    → Minimal production image
```

- Non-root container user (`nextjs:nodejs`)
- Health check endpoint: `GET /api/health`
- Volume mount for SQLite persistence: `./dev.db:/app/dev.db`
- Evidence data stored in `./data/evidence/`

### 8.2 QA & Quality Gates

The Astra-CISO platform enforces strict quality checks to ensure application survivability during updates:

- **Strict Typing (`tsc --noEmit`)**: All database mocks, API handlers, and AI provider integrations undergo enforced static typing (0 `any` implicit cast allowance for core engines).
- **Unit & Integration (`vitest`)**: Extensive suite covering `CAIQEngine` (matching logic, validation), `CircuitBreaker` states, and Next.js dynamic API routes.
- **Dependency Management**: Native `npm audit fix` automation integrated post-merge to catch malicious peer-injections.
- **Bundle Optimization**: Verified via regular `next build` telemetry passing.
