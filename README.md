This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Key Modules

### 1. Privacy Operations Center

A comprehensive GDPR/CCPA command center featuring:

* **RoPA Data Mapper**: Visualize cross-border data flows.
* **DSAR Manager**: Handle subject access requests.
* **Breach Simulator**: Gamified 72-hour incident response training.
* **Vendor Risk Radar**: AI-driven third-party risk assessment.

### 2. CISO Board Presentation Mode

Transform your security data into a full-screen executive slide deck (`/reporting`).

* **Interactive Slides**: Risk Scorecards, Budget Analysis, and Strategic Roadmaps.
* **Live Data**: Slides are powered by real-time application state.

### 3. Strategic Intelligence

AI-powered analysis of your security posture (`/intelligence`).

* **Initiative Generator**: Auto-suggests projects based on vulnerability data.
* **Context Analysis**: Connects threat feeds to your specific architecture.

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

- **Database**: SQLite is stored in the container volume at `/app/data`. Bind-mount a host path if you need the file on a specific disk or region (e.g. `./data:/app/data`).
- **AI**: For air-gapped or in-region-only use, set `AI_PROVIDER` and only configure the provider(s) allowed in your environment (e.g. self-hosted Ollama). The CAIQ semantic matcher runs fully local (TF-IDF); only Tier 3 answers call the configured AI.
- **Secrets**: Keep `AUTH_SECRET`, `JWT_SECRET`, and API keys in env or a secrets manager; do not bake them into the image.

### Health check endpoint

- **URL**: `GET /api/health`
- **Purpose**: Used by Docker (and load balancers) to verify the app is up and optional dependencies are reachable.
- **Response**: JSON with `status` (`healthy` | `degraded` | `unhealthy`), `timestamp`, `version`, `jurisdiction`, `services.database`, `services.ai` (circuit breaker state and provider), and `uptime`.
- **Status**: `200` for healthy/degraded, `503` for unhealthy. Database failure sets unhealthy; AI circuit open sets degraded.

Docker Compose healthcheck runs every 30s: `wget -q --spider http://localhost:3000/api/health`.

## Documentation

For detailed features and usage instructions, please refer to the [User Guide](docs/USER_GUIDE.md).

## Technical Documentation

- [High-Level Design (HLD)](docs/HIGH_LEVEL_DESIGN.md)
* [Low-Level Design (LLD)](docs/LOW_LEVEL_DESIGN.md)
* [Security & QA Report](docs/SECURITY_AND_QA_REPORT.md)

## Learn More

To learn more about Next.js, take a look at the following resources:

* [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
* [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
