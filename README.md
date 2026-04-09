# Astra-CISO v2.0

**Autonomous Security Operations Platform** — AI-powered compliance, risk management, and threat intelligence for multi-jurisdictional enterprises.

---

## Overview

Astra-CISO is a CISO command center built on **ZTAIP (Zero Trust AI Platform)** architecture. It manages security operations across **8 countries** (DE, UK, TH, AU, NZ, ES, AT, US) and provides unified visibility into compliance posture, threat landscape, vendor risk, and incident response.

**Key differentiator:** CAIQ Knowledge Transfer engine with **1,000+ pre-validated Q&A pairs** — reducing vendor risk assessments from days to hours.

---

## Core Modules

| Module | Description |
|--------|-------------|
| **Command Center** | Real-time security posture dashboard with Global Threat Monitor, KPI metrics, active threats feed, compliance overview, and AI activity monitoring. |
| **Decision Center** | AI-assisted security decision queue with prioritized action items aggregated from across the platform. |
| **Strategy & OKRs** | Security strategy management with OKRs, defense matrix, KPI dashboards, and program tracking. |
| **Governance & Risk** | Multi-framework compliance tracking (ISO 27001, SOC 2, NIS2, GDPR, Cyber Essentials, EU AI Act), FAIR risk quantification, and policy lifecycle management. |
| **Vendor Risk** | CAIQ v4 automation with Knowledge Transfer engine (4-tier confidence matching), 1,000+ entry knowledge base, multi-company/product configuration, and Shodan-powered vendor scanning. |
| **Incidents** | Incident management with war room collaboration, tabletop exercises linked to real threat data, and after-action reporting. |
| **Threat Intelligence** | World Monitor with interactive map (25+ data layers), attack surface monitoring via Shodan, live threat feeds from Abuse.ch (ThreatFox, URLhaus, MalwareBazaar), signal intelligence with anomaly detection, infrastructure monitoring, and ransomware tracking. |
| **AppSec** | Vulnerability feed, SAST scanning, Trivy integration, and remediation velocity tracking. |

---

## Threat Intelligence Stack

| Source | Data | API Key | Cost |
|--------|------|---------|------|
| Abuse.ch ThreatFox | IOCs, malware families, C2 servers | None needed | Free |
| Abuse.ch URLhaus | Malicious URLs, hosting info | None needed | Free |
| Abuse.ch MalwareBazaar | Malware samples, hashes, signatures | None needed | Free |
| Shodan | Attack surface, open ports, CVEs, SSL | Free account | Free tier |
| AlienVault OTX | 100k+ IOCs, community pulses | Free account | Free |
| USGS | Earthquake data (BCDR) | None needed | Free |
| GDELT | Global news events, geolocation | None needed | Free |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Astra-CISO                         │
│                                                         │
│  Next.js 16 · React 19 · TypeScript 5 · Prisma 7       │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐     │
│  │ Zustand  │  │ NextAuth │  │ Circuit Breaker   │     │
│  │ UI State │  │ 5 Auth   │  │ AI Resilience     │     │
│  └──────────┘  └──────────┘  └───────────────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Intelligence API Layer                 │   │
│  │  Abuse.ch · Shodan · OTX · USGS · GDELT         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │         AI Providers (multi-provider)            │   │
│  │  Anthropic Claude · Google Gemini · Ollama       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐     │
│  │ SQLite   │  │ MapLibre │  │ Immutable Audit   │     │
│  │ (Prisma) │  │ GL Maps  │  │ Fabric            │     │
│  └──────────┘  └──────────┘  └───────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

**Patterns:** ZTAIP · Circuit Breaker · Dynamic Autonomy Router · Immutable Audit Fabric

---

## Quick Start

### With Docker

```bash
git clone https://github.com/SristiNative/CISO.git
cd CISO
cp .env.example .env.local
# Edit .env.local — add AI provider key (minimum)
docker compose build
docker compose up -d
# Open http://localhost:3000
```

### Without Docker

```bash
npm install
cp .env.example .env.local
# Edit .env.local
npx prisma db push
npm run dev
# Open http://localhost:3000
```

> [!WARNING]
> By default, the database seed (`npx prisma db push` via `prisma/seed.ts`) will create a demo user with the credentials **`ciso@astra.ai` / `admin123`**. Ensure you change this or drop the mock users before deploying to production. Never commit `.env.local` or `.db` files.

### Testing & QA (Local)

All integration and unit paths have been strictly typed and patched for Next.js 16 Edge runtime compatibility.

```bash
# Run strict TypeScript environment validation
npx tsc --noEmit

# Run unit and integration Vitest suites
npm run test

# Run vulnerability package audit
npm audit
```

---

## Environment Variables

### Core

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite path | `file:./dev.db` |
| `NEXTAUTH_SECRET` | Random 32+ char string | — |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |

### AI Providers (configure at least one)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `GOOGLE_API_KEY` | Gemini API key |
| `OLLAMA_BASE_URL` | Local Ollama endpoint |

### Threat Intelligence (all optional, all free)

| Variable | Description |
|----------|-------------|
| `SHODAN_API_KEY` | [account.shodan.io](https://account.shodan.io) |
| `ALIENVAULT_OTX_KEY` | [otx.alienvault.com](https://otx.alienvault.com) |
| `ABUSECH_ENABLED` | `true` (no key needed) |
| `USGS_ENABLED` | `true` (no key needed) |
| `GDELT_ENABLED` | `true` (no key needed) |

### Intelligence (optional, for advanced features)

| Variable | Description |
|----------|-------------|
| `OPENSKY_USERNAME` / `OPENSKY_PASSWORD` | Military flight tracking |
| `VESSELFINDER_API_KEY` | Naval vessel tracking |
| `NASA_FIRMS_API_KEY` | Satellite fire detection |
| `GROQ_API_KEY` | AI threat classification |

---

## CAIQ Knowledge Transfer

The flagship feature for vendor risk automation:

- **1,000+ pre-validated** security Q&A entries
- **Multi-company, multi-product** configuration
- **4-tier confidence matching:** Direct → Semantic → AI Adapted → Manual
- **JSON import/export** for knowledge portability
- **Learning loop** — gets smarter with each assessment
- Reduces vendor risk assessments from **days to hours**

---

## Compliance Frameworks

ISO 27001:2022 · NIST CSF 2.0 · SOC 2 Type II · GDPR · NIS2 · EU AI Act · Cyber Essentials

---

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full product roadmap.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

---

## Acknowledgments

Astra-CISO is built on the shoulders of giants. We express our profound gratitude to the open-source communities powering this platform:

- **[Next.js](https://nextjs.org/) & [React](https://react.dev/)** — Core application frameworks
- **[Radix UI](https://www.radix-ui.com/) & [Tailwind CSS](https://tailwindcss.com/)** — Accessible interface primitives and styling
- **[Zustand](https://zustand-demo.pmnd.rs/)** — Lightweight UI state management
- **[Prisma](https://www.prisma.io/)** — Next-generation ORM
- **[MapLibre GL](https://maplibre.org/)** — Open-source 3D mapping engine powering the World Monitor
- **[Abuse.ch](https://abuse.ch/)** — Incredible community threat intelligence feeds (ThreatFox, URLhaus, MalwareBazaar)
- **[USGS](https://www.usgs.gov/) & [GDELT Project](https://www.gdeltproject.org/)** — Free APIs for earth science and global news event data

---

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## License

[MIT](LICENSE)

---

## Author

Built by [@SristiNative](https://github.com/SristiNative)
