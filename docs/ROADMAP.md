# Astra-CISO Product Roadmap

Astra is hardening `main` toward the first public **v0.1.0 Community Preview**. Historical v2/v3 labels describe development iterations, not the public OSS version contract.

## v0.1 — Decision Core

**Release goal:** a security leader can clone Astra, start the demo, complete a vendor assessment, receive a deterministic recommendation, make a human decision, and retrieve the decision/audit history after restart.

### Must ship

- Postgres-backed Decision records
- human approval before material vendor state changes
- vendor / CAIQ / Knowledge workflows
- Evidence Vault + evidence expiry
- 5×5 risk
- versioned SkillRuns and Observations
- write-operation RBAC
- optional AI (`NONE | ANTHROPIC | GOOGLE`)
- reproducible Docker Compose demo
- PostgreSQL CI + security scanning
- honest empty states

### Explicitly not v0.1 product surface

- board-ready KPI engine
- Strategy / OKRs
- incident-response platform / War Room
- tabletop exercises
- world/threat-intelligence visualization
- AppSec suite
- autonomous security decisions
- OpenNeko / GraphJin as required dependencies

## v0.2 — Integration Foundation

- connector SDK
- normalized GitHub and Jira connectors
- Slack/notification actions
- storage adapters
- stronger multi-user authorization
- API documentation

## v0.3 — Compliance Graph

- versioned framework manifests
- canonical controls and mappings
- evidence-to-control relationships
- evidence freshness / drift
- framework contribution model

## Experimental / research

The existing intelligence, incident, exercise, strategy, OpenNeko, and GraphJin code can continue to evolve behind experimental boundaries. It should only return to primary navigation when it passes Astra's value test: real data, a clear decision outcome, and an auditable trail.
