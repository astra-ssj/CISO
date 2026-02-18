# Astra CISO — Complete Project Documentation

**Version**: 2.0  
**Date**: February 18, 2026  
**Platform**: AI-Powered GRC Command Center for CISOs

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Getting Started](#2-getting-started)
3. [Architecture Overview](#3-architecture-overview)
4. [Module Reference](#4-module-reference)
5. [API Reference](#5-api-reference)
6. [State Management](#6-state-management)
7. [Security Model](#7-security-model)
8. [External Integrations](#8-external-integrations)
9. [AI Engine](#9-ai-engine)
10. [File Structure](#10-file-structure)
11. [Configuration](#11-configuration)
12. [Deployment](#12-deployment)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Project Overview

### What is Astra CISO?

Astra CISO is a comprehensive security command center designed for Chief Information Security Officers. It consolidates governance, risk, compliance, threat intelligence, vendor management, and strategic planning into a single platform powered by AI.

### Key Capabilities

| Capability | Description |
|-----------|-------------|
| **Executive Dashboard** | Board-ready metrics with posture gauges, threat maps, investment heatmaps |
| **KPI Command Center** | 20 auto-computed security KPIs + file import from PPTX/DOCX |
| **War Games** | 10 red-team scenarios with MITRE ATT&CK mapping and after-action reports |
| **Jira Integration** | 15 pre-populated CISO ticket templates with offline queuing |
| **Vendor Risk** | Third-party risk scoring with automated CSA CAIQ questionnaire responses |
| **Decision Engine** | AI-assisted decision support with rule-based scoring |
| **Governance** | Policy lifecycle management with evidence vault and audit trails |
| **Threat Intelligence** | OSINT engine, ransomware monitoring, technique cards |
| **Compliance** | SOC 2, ISO 27001, NIST, GDPR framework tracking |
| **Risk Quantification** | FAIR-model analysis (ALE, SLE, ARO calculations) |

### Tech Stack

- **Framework**: Next.js 14 (App Router, React Server Components)
- **Language**: TypeScript 5
- **State**: Zustand with localStorage persistence
- **UI**: Radix UI + shadcn/ui + Tailwind CSS
- **AI**: Google Gemini, Anthropic Claude, Ollama (local)
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

---

## 2. Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- (Optional) Ollama for local AI

### Installation

```bash
# Clone the repository
git clone https://github.com/SristiNative/CISO.git
cd CISO

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys (see Configuration section)

# Start development server
npm run dev
```

### Environment Variables

```env
# AI Providers (at least one required for AI features)
GOOGLE_API_KEY=your-google-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
NEXT_PUBLIC_USE_OLLAMA=false

# Jira Integration (optional)
JIRA_BASE_URL=https://your-org.atlassian.net
JIRA_API_TOKEN=your-jira-api-token
JIRA_EMAIL=your-email@company.com
JIRA_PROJECT_KEY=SEC

# Trivy (optional, for vulnerability scanning)
# Requires trivy CLI installed locally
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 3. Architecture Overview

### Layer Architecture

```
┌─────────────────────────────────────────────────┐
│                 Client Layer                     │
│  Dashboard Shell (22 pages) + Zustand Stores     │
├─────────────────────────────────────────────────┤
│              Middleware Layer                     │
│  Authentication + RBAC + Security Headers        │
├─────────────────────────────────────────────────┤
│                 API Layer                        │
│  14 API Routes + 3 Server Actions                │
├─────────────────────────────────────────────────┤
│             Intelligence Layer                   │
│  AI Engine + KPI Engine + Risk Engine            │
│  Decision Engine + CAIQ Engine + OSINT Engine    │
├─────────────────────────────────────────────────┤
│            Integration Layer                     │
│  Jira + GitHub + Trivy + OfficeParser            │
└─────────────────────────────────────────────────┘
```

### Design Principles

1. **Offline-First**: All core features work without external APIs. Zustand stores persist to localStorage. AI features degrade gracefully.
2. **Privacy-First**: Supports local AI (Ollama) for air-gapped environments. No telemetry. All secrets server-side.
3. **Enterprise-Ready**: RBAC, audit logging, session management, security headers.
4. **Modular**: Each feature is self-contained with its own store, API route, and UI components.

---

## 4. Module Reference

### 4.1 Command Center (`/`)

The main dashboard providing an at-a-glance security overview.

**Components**: Posture gauge, active threats counter, threat map, traffic flow visualization, quick actions.

**Data Sources**: Main store, GitHub connector, posture score calculator.

---

### 4.2 Executive Brief (`/executive-brief`)

Board-ready bento grid layout for executive stakeholders.

**Components**: Investment heatmap, revenue velocity gauge, top risks card, board export button.

**Key Feature**: One-click PDF export for board presentations.

---

### 4.3 KPI Dashboard (`/kpis`)

20 auto-computed security KPIs across 8 categories with file import capability.

**Categories**: Risk, Compliance, Incident, Vulnerability, Vendor, People, Budget, Posture.

**Features**:

- Auto-computed metrics with sparklines and industry benchmarks
- File upload (.pptx/.docx) with regex-based KPI extraction
- Imported KPIs marked with 📎 badge
- Category filtering and health indicators (Green/Amber/Red)

**Data Flow**:

1. `computeAllKPIs()` generates computed metrics
2. File upload → `/api/kpi-upload` → OfficeParser → KPI extractor
3. Imported KPIs stored in `useUploadedKPIStore`
4. Both types merged in the dashboard grid

---

### 4.4 War Games (`/wargames`)

10 red-team attack scenarios with 5-7 decision steps each.

**Scenarios Include**: Ransomware attack, supply chain compromise, insider threat, zero-day exploit, cloud misconfiguration, phishing campaign, DDoS attack, data exfiltration, APT persistence, social engineering.

**Features**:

- MITRE ATT&CK technique mapping per scenario
- Budget/trust/morale metric tracking during simulation
- After-Action Report (AAR) generation with scoring
- AI-powered scenario builder

---

### 4.5 Tickets (`/tickets`)

Jira-integrated ticketing system with pre-populated CISO templates.

**Templates (15 across 5 categories)**:

- **Incident Response**: Security incident report, breach notification, forensic investigation
- **Risk & Compliance**: Risk assessment request, compliance gap analysis, audit remediation
- **Infrastructure**: Firewall change, access review, patch deployment
- **Vendor Management**: Vendor assessment, SLA review, contract security
- **Strategic**: Security budget proposal, program maturity assessment, board report

**Features**:

- Offline queue — tickets saved locally if Jira unavailable
- Two-way sync when Jira connection restored
- Full CRUD on local tickets

---

### 4.6 Vendor Risk (`/vendors`)

Third-party vendor risk management with automated CAIQ responses.

**Features**:

- Vendor risk scoring (0-100) with criticality classification
- CSA CAIQ v4 automated questionnaire engine
- Pre-built knowledge base of security control answers
- Assessment tracking with due dates and findings

---

### 4.7 Decision Engine (`/decisions`)

AI-assisted decision support for security investments and strategic choices.

**Scoring Dimensions**: Impact (1-100), Confidence (1-100), Priority, Cost/Benefit analysis.

**Output**: Ranked recommendations with alternatives and risk assessments.

---

### 4.8 Governance (`/governance`)

Policy lifecycle management with compliance evidence tracking.

**Components**:

- Policy lifecycle view (Draft → Review → Active → Archived)
- Evidence Vault — document upload and artifact tracking for audits
- Framework mapping (NIST, ISO 27001, SOC 2, GDPR)

---

### 4.9 Intelligence (`/intelligence`)

Threat intelligence feed with MITRE ATT&CK visualization.

**Features**:

- MITRE ATT&CK technique matrix
- Threat ticker (live feed)
- System health monitoring
- Group activity charts (APT tracking)
- Ransomware-specific intelligence (`/intelligence/ransomware`)

---

### 4.10 Risk (`/risk`)

Risk register with FAIR-model quantitative analysis.

**Calculations**:

- **SLE** (Single Loss Expectancy) = Asset Value × Exposure Factor
- **ALE** (Annualized Loss Expectancy) = SLE × ARO (Annual Rate of Occurrence)
- **Normalized Risk Score** = ALE / Asset Value × 100

---

### 4.11 Strategy (`/strategy`)

Security strategy alignment with OKR tracking and Defense Matrix.

**Sub-pages**:

- `/strategy` — Strategy pyramid with OKR tracking and KPI rows
- `/strategy/matrix` — Defense Matrix: high-density compliance control grid with sticky columns, status pills, and interactive filters

---

### 4.12 Projects (`/projects`)

OKR and project tracking with milestones, progress bars, and team assignments.

**Data**: Zustand persist store with objectives, key results, projects, and task breakdowns.

---

## 5. API Reference

### AI Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:------------:|
| POST | `/api/agent/chat` | General CISO AI assistant | ✅ |
| POST | `/api/agent/wargame` | War game simulation step | ✅ |
| POST | `/api/agent/generate-policy` | Draft a security policy | ✅ |
| POST | `/api/agent/analyze` | Analyze a threat or request | ✅ |
| POST | `/api/agent/analyze-policy` | Policy gap analysis | ✅ |
| POST | `/api/notebook/chat` | Notebook AI conversation | ✅ |

### Integration Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:------------:|
| POST | `/api/kpi-upload` | Upload PPTX/DOCX → extract KPIs | ✅ |
| GET | `/api/jira` | Check Jira connection | ✅ |
| POST | `/api/jira` | Create Jira ticket | ✅ |
| POST | `/api/vendors/caiq` | Automate CAIQ responses | ✅ |
| POST | `/api/intelligence/osint` | OSINT intelligence | ✅ |
| GET | `/api/integrations/trivy` | Vulnerability scan results | ✅ |

### Security Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:------------:|
| POST | `/api/auth/login` | User authentication | ❌ |
| GET | `/api/security/audit` | Retrieve audit logs | ✅ |
| POST | `/api/security/scan` | Run security config scan | ✅ |

---

## 6. State Management

All application state is managed through **Zustand** stores with `persist` middleware for localStorage.

### Store Map

| Store | Key | Purpose |
|-------|-----|---------|
| `useAstraStore` | `astra-store` | Main application state, user preferences, policies |
| `useJiraStore` | `astra-jira-tickets` | Local Jira ticket queue and sync state |
| `useUploadedKPIStore` | `astra-uploaded-kpis` | KPIs imported from file uploads |
| `useOKRProjectStore` | `astra-okr-projects` | OKR objectives, key results, projects |
| `useNotificationStore` | `astra-notifications` | Notifications with priority levels |
| `useRiskRegisterStore` | `astra-risk-register` | Risk items with FAIR model data |
| `useVendorRiskStore` | `astra-vendor-risk` | Vendor assessments and risk scores |
| `useEvidenceStore` | `astra-evidence` | Compliance evidence and artifacts |

### Clearing Data

To reset all platform data, clear localStorage keys prefixed with `astra-`:

```javascript
Object.keys(localStorage)
    .filter(k => k.startsWith('astra-'))
    .forEach(k => localStorage.removeItem(k));
location.reload();
```

---

## 7. Security Model

### Authentication Flow

1. User navigates to any protected route
2. Middleware (`src/middleware.ts`) checks `astra-session` cookie
3. If missing/invalid → redirect to `/login`
4. If valid → request proceeds with security headers applied

### Role-Based Access Control

| Role | Dashboard | Reports | Policies | Admin |
|------|:---------:|:-------:|:--------:|:-----:|
| Admin | ✅ | ✅ | ✅ (CRUD) | ✅ |
| Analyst | ✅ | ✅ | ✅ (Read/Write) | ❌ |
| Viewer | ✅ | ✅ | ✅ (Read) | ❌ |

### Security Headers

Applied by middleware on every response:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## 8. External Integrations

### Jira Cloud

- **Library**: `src/lib/jira/jira-connector.ts`
- **API**: Jira Cloud REST API v3
- **Features**: Connection testing, issue creation, offline queue with sync
- **Config**: `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_EMAIL`, `JIRA_PROJECT_KEY`
- **Fallback**: Full local operation if Jira not configured

### GitHub

- **Library**: `src/lib/connectors/github.ts`
- **Features**: Repository security scanning, code analysis
- **Config**: Uses GitHub API (optional auth)

### Trivy

- **Library**: `src/lib/trivy/scanner.ts`
- **Features**: Container/filesystem vulnerability scanning
- **Output**: CVE reports with severity classification
- **Config**: Requires `trivy` CLI installed locally

### OfficeParser

- **Library**: `officeparser` npm package
- **Features**: PPTX and DOCX text extraction
- **Usage**: KPI file upload pipeline in `/api/kpi-upload`

---

## 9. AI Engine

### Provider Support

| Provider | Model | Use Case | Config |
|----------|-------|----------|--------|
| **Google Gemini** | gemini-pro | Default cloud AI | `GOOGLE_API_KEY` |
| **Anthropic Claude** | claude-3-haiku | Alternative cloud AI | `ANTHROPIC_API_KEY` |
| **Ollama** | llama3 | Local/air-gapped AI | `NEXT_PUBLIC_USE_OLLAMA=true` |

### AI Features

- **Policy Drafting**: Generates NIST-compliant security policies
- **Threat Analysis**: Analyzes security requests and vulnerability reports
- **War Game Simulation**: Powers red-team scenario narratives
- **OSINT Intelligence**: Gathers open-source threat intelligence
- **Chat Assistant**: General-purpose CISO advisor
- **CAIQ Automation**: Assists with CSA questionnaire completion

### Graceful Degradation

If no AI provider is configured, all AI endpoints return informative fallback responses explaining the feature requires API key configuration. Core dashboards, KPIs, tickets, and risk management continue to function fully.

---

## 10. File Structure

```
CISO/
├── docs/                         # Documentation
│   ├── HIGH_LEVEL_DESIGN.md     # System architecture (this doc)
│   ├── LOW_LEVEL_DESIGN.md      # API specs, data models, internals
│   ├── SECURITY_AND_QA_REPORT.md # Security audit and QA results
│   ├── PROJECT_DOCUMENTATION.md  # This comprehensive guide
│   └── ...                       # Additional docs
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (dashboard)/          # 22 protected dashboard pages
│   │   ├── api/                  # 14 API routes
│   │   ├── actions/              # 3 server actions
│   │   └── login/                # Auth page
│   ├── components/               # 24 component directories, 90+ files
│   ├── lib/                      # 56 library files (engines, stores, utils)
│   └── middleware.ts             # Auth + security middleware
├── public/                       # Static assets
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── next.config.mjs               # Next.js configuration
```

---

## 11. Configuration

### TypeScript (`tsconfig.json`)

- Uses `@/` path alias for imports
- Strict mode compatible (some `any` types remain)
- JSX: `preserve` for Next.js

### Tailwind CSS

- Custom color palette with CSS variables
- Dark mode by default (`class` strategy)
- Custom animations for micro-interactions

### Next.js

- App Router with server components
- API routes use Node.js runtime where needed (file I/O)
- Static generation for dashboard pages, dynamic for APIs

---

## 12. Deployment

### Development

```bash
npm run dev
# Opens http://localhost:3000
```

### Production Build

```bash
npm run build  # Compile and optimize
npm start      # Start production server
```

### Vercel Deployment

The project is Vercel-compatible. Set environment variables in the Vercel dashboard and deploy via Git push.

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 13. Troubleshooting

| Issue | Solution |
|-------|----------|
| AI features return errors | Check `GOOGLE_API_KEY` or `ANTHROPIC_API_KEY` in `.env.local` |
| Jira tickets fail to submit | Verify `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_EMAIL` env vars |
| KPI upload shows "no metrics found" | Upload files containing numeric security metrics with keywords (e.g., "compliance: 92%") |
| Build fails with type errors | Run `npx next build` — check for missing imports or `any` types |
| Pages show blank after refresh | Check browser localStorage — clear `astra-*` keys if data is corrupted |
| Trivy integration not working | Ensure `trivy` CLI is installed: `brew install aquasecurity/trivy/trivy` |
| 429 errors from AI provider | Rate limit exceeded — wait 60 seconds or switch provider |

---

## Appendix: Document Map

| Document | Location | Purpose |
|----------|----------|---------|
| This Guide | `docs/PROJECT_DOCUMENTATION.md` | Complete project reference |
| High-Level Design | `docs/HIGH_LEVEL_DESIGN.md` | System architecture and module map |
| Low-Level Design | `docs/LOW_LEVEL_DESIGN.md` | API specs, data models, internals |
| Security & QA Report | `docs/SECURITY_AND_QA_REPORT.md` | Security audit and QA results |
| User Guide | `docs/USER_GUIDE.md` | End-user usage instructions |
| README | `README.md` | Quick start and overview |
| Security Policy | `SECURITY.md` | Vulnerability reporting |
