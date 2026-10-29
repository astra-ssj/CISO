# Astra CISO v0.1.0 — Community Preview

Astra CISO is an open-source security decision and evidence platform.

This release focuses on one core loop:

```text
Evidence / risk / vendor context
        ↓
Deterministic skill
        ↓
Recommendation
        ↓
Human decision
        ↓
Action
        ↓
Audit trail
```

## Supported in v0.1.0

- Command Center / Needs You
- Decision Center
- Vendor registry
- CAIQ / Knowledge workflow
- Evidence Vault and evidence expiry
- Risk register and deterministic 5×5 scoring
- Policies where they support decision context
- Versioned SkillRuns and Observations
- Human approvals
- Audit history
- Docker Compose Community deployment
- Optional Anthropic or Google AI drafting

## Experimental / not supported as v0.1 product surface

- incident response / War Room
- tabletop exercises
- threat-intelligence visualization
- attack-surface UI
- Strategy / OKRs
- executive KPI engine
- FAIR as a decision authority
- OpenNeko
- GraphJin

These modules may remain in the repository while they are progressively isolated.

## Quickstart

```bash
git clone https://github.com/astra-ssj/CISO.git
cd CISO
cp .env.example .env
docker compose --profile demo up -d --build
```

Open:

```text
http://localhost:3000
```

Demo credentials:

```text
ciso@astra.ai
admin123
```

Demo credentials are created only when `ASTRA_MODE=demo`. Do not expose a demo deployment to untrusted networks.

## Security model

- authentication via NextAuth
- role-based API authorization
- versioned deterministic skills
- Postgres-backed Decision records
- human approval before allowlisted material state changes
- separate integration encryption key
- application-level append-only AuditLog
- CodeQL, Gitleaks, and runtime-image Trivy in CI
- AI output is advisory

## Important limitations

v0.1.0 is a Community Preview, not a certified GRC or compliance platform.

Known limitations include:

- API/schema contracts may change before v1.0
- AuditLog is not yet cryptographically tamper-evident
- local filesystem evidence storage is the default Community backend
- rate limiting is currently suited to single-instance Community deployments
- experimental modules are not part of the supported release surface
- historical pre-public migration history was replaced by a PostgreSQL baseline; old development databases should be recreated for this release

## Upgrade note

Public semantic versioning begins with `v0.1.0`.

Earlier `2.x` and `3.0.0-decision.*` versions are historical development iterations and should not be interpreted as public stable releases.

## Release verification

Before tagging, the release branch must pass:

- PostgreSQL migration
- TypeScript
- ESLint on supported v0.1 surface
- unit tests
- integration tests
- smoke tests
- production build
- CodeQL
- Gitleaks
- runtime image Trivy
- Docker demo acceptance

## Container

The tag workflow publishes:

```text
ghcr.io/astra-ssj/astra-ciso:0.1.0
ghcr.io/astra-ssj/astra-ciso:0.1
ghcr.io/astra-ssj/astra-ciso:latest
```

## License

MIT.
