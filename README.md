# Astra CISO

**Autonomous Security Operations Platform** — AI-powered compliance, risk management, and threat intelligence for multi-jurisdictional enterprises.

![Version](https://img.shields.io/badge/version-v2.1.0-blue)
[![CI](https://github.com/SristiNative/astra-ciso/actions/workflows/ci.yml/badge.svg)](https://github.com/SristiNative/astra-ciso/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/container-ghcr.io%2Fsristinative%2Fastra--ciso-blue)](https://github.com/SristiNative/astra-ciso/pkgs/container/astra-ciso)

> **Topics:** `ciso` · `security` · `compliance` · `iso27001` · `nist` · `gdpr` · `nis2` · `caiq` · `vendor-risk` · `threat-intelligence` · `sso` · `integrations` · `docker` · `nextjs` · `typescript` · `ai`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Key Modules (9 core + Integration Hub)

| # | Module | Description |
|---|--------|-------------|
| 1 | **Command Center** | Real-time security posture overview with executive briefing |
| 2 | **Risk Quantification** | FAIR methodology with ALE calculations and normalized scoring |
| 3 | **Multi-Framework Compliance** | ISO 27001, NIST CSF, GDPR, NIS2, SOC 2 with evidence tracking |
| 4 | **Policy Lifecycle** | Draft → Review → Approved → Published with version history |
| 5 | **Incident Management** | War Room collaboration, playbooks, and timeline |
| 6 | **Threat Intelligence** | MITRE ATT&CK mapping and ransomware tracking |
| 7 | **AI CISO Assistant** | Multi-provider AI (Gemini + Claude) with circuit breaker pattern |
| 8 | **CAIQ Knowledge Base** | 261-question auto-fill with 4-tier knowledge transfer engine |
| 9 | **AppSec Dashboard** | Container and dependency scanning (Trivy) |
| 🔌 | **Integration Hub** | 24 integrations across 9 categories (SIEM, Cloud, DevOps, etc.) |

### Additional Features

* **SSO / SAML Authentication** — Azure AD, Okta, Google Workspace
* **Team Management** — Invite members, assign roles, RBAC permissions
* **Security Policies** — SSO enforcement, MFA, session timeout
* **Help Center** — 7 sections, 35 articles, search, keyboard shortcuts
* **World Monitor** — Interactive geopolitical intelligence map (Leaflet)
* **Tabletop Exercises** — Scenario-based security exercise runner
* **Dark Hacker Theme** — Glassmorphism, micro-animations, JetBrains Mono

### Sidebar Navigation (13 items)

Command Center · Governance · Intelligence · Incidents · Strategy · AppSec · CAIQ · Integrations · Settings · Help · Roadmap · Tabletop · World Monitor

## Docker

### Quick start with Docker Compose

```bash
# Build and run (app on port 3000, SQLite in named volume)
docker compose up -d

# View logs
docker compose logs -f astra-ciso
```

The app is served at [http://localhost:3000](http://localhost:3000). Data (e.g. SQLite DB) is persisted in the `astra-ciso-data` volume.

### Environment variable reference

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Runtime mode | `production` (in Docker) |
| `DATABASE_URL` | Prisma DB URL (SQLite path in container) | `file:/app/data/astra-ciso.db` |
| `AUTH_SECRET` | Auth/session secret | Set in production |
| `JWT_SECRET` | JWT signing secret | Falls back to `AUTH_SECRET` |
| `AI_PROVIDER` | Primary AI provider | `GEMINI` |
| `GOOGLE_API_KEY` | Gemini API key | — |
| `ANTHROPIC_API_KEY` | Claude API key (fallback) | — |
| `ASTRA_ORG_NAME` | Organization name (CAIQ / branding) | — |
| `ASTRA_INDUSTRY` | Industry (CAIQ context) | — |
| `ASTRA_ORG_SIZE` | Startup / SMB / Enterprise | — |
| `ASTRA_CLOUD_MODEL` | IaaS / PaaS / SaaS / Hybrid | — |
| `ASTRA_JURISDICTION` | Comma-separated jurisdictions | — |
| `VERSION` | App version (health response) | From package.json |

Create a `.env` file next to `docker-compose.yml` for secrets; Compose will substitute `${VAR}`. Never commit `.env` with real keys.

### Data sovereignty configuration

* **Database**: SQLite is stored in the container volume at `/app/data`. Bind-mount a host path if you need the file on a specific disk or region (e.g. `./data:/app/data`).
* **AI**: For air-gapped or in-region-only use, set `AI_PROVIDER` and only configure the provider(s) allowed in your environment (e.g. self-hosted Ollama). The CAIQ semantic matcher runs fully local (TF-IDF); only Tier 3 answers call the configured AI.
* **Secrets**: Keep `AUTH_SECRET`, `JWT_SECRET`, and API keys in env or a secrets manager; do not bake them into the image.

### Health check endpoint

* **URL**: `GET /api/health`
* **Purpose**: Used by Docker (and load balancers) to verify the app is up and optional dependencies are reachable.
* **Response**: JSON with `status` (`healthy` | `degraded` | `unhealthy`), `timestamp`, `version`, `jurisdiction`, `services.database`, `services.ai` (circuit breaker state and provider), and `uptime`.
* **Status**: `200` for healthy/degraded, `503` for unhealthy. Database failure sets unhealthy; AI circuit open sets degraded.

Docker Compose healthcheck runs every 30s: `wget -q --spider http://localhost:3000/api/health`.

## Documentation

For detailed features and usage instructions, please refer to the [User Guide](docs/USER_GUIDE.md).

## Technical Documentation

* [High-Level Design (HLD)](docs/HIGH_LEVEL_DESIGN.md)
* [Low-Level Design (LLD)](docs/LOW_LEVEL_DESIGN.md)
* [Product Roadmap](docs/ROADMAP.md)
* [Security & QA Report](docs/SECURITY_AND_QA_REPORT.md)

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, including:

* Dev environment setup
* Branch naming: `feature/*`, `fix/*`, `refactor/*`, `docs/*`, `security/*`
* Commit format: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `security:`, `test:`)
* PR process and quality gates

### Branch Protection (manual setup in GitHub)

The `main` branch requires:

* ✅ All CI checks pass (`.github/workflows/ci.yml`)
* ✅ At least 1 approved review
* ✅ No direct pushes

### Tag Convention (releases)

Follows [Semantic Versioning](https://semver.org/): `v2.0.0`, `v2.1.0`, etc.  
Docker images are published automatically on tag push via `.github/workflows/docker.yml`.

### Repository Settings (manual setup in GitHub)

* **Description:** Autonomous Security Operations Platform — AI-powered compliance, risk management, and threat intelligence for multi-jurisdictional enterprises
* **Topics:** ciso, security, compliance, iso27001, nist, gdpr, nis2, caiq, vendor-risk, threat-intelligence, docker, nextjs, typescript, ai
* **Disable:** Wiki (use `docs/` instead), Discussions (use Issues)
* **Labels:** See `.github/labels.yml` for the full recommended label set with `gh label create` commands

## Security

See [SECURITY.md](SECURITY.md) for our vulnerability reporting policy and security architecture overview.  
To report a vulnerability: **[security@astralabs.com](mailto:security@astralabs.com)**

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full history of changes.
