# Security Policy

## Supported versions

| Version | Status |
|---|---|
| `main` | Active development |
| `v0.1.x` | Supported after the first public release |
| historical preview branches | Unsupported |

## Reporting a vulnerability

Do **not** create a public GitHub issue for a security vulnerability.

Report privately to **security@sristinative.com** with:

1. vulnerability description
2. reproduction steps
3. affected version or commit
4. impact assessment
5. suggested remediation, if available

## Security architecture

The current Community Preview includes:

- NextAuth-based authentication
- role-based API authorization
- Zod validation at key external boundaries
- CSP and security headers
- separate encryption key for integration credentials
- deterministic, versioned security skills
- persisted SkillRuns and external Observations
- Postgres-backed security Decisions
- human approval before allowlisted decision execution
- Approval and AuditLog records

## Important limitations

The Community Preview is not a certified compliance platform.

Current limitations include:

- `AuditLog` is application-level append-only, not cryptographically tamper-evident
- local filesystem evidence storage is the default Community backend
- some older/experimental routes still require further authorization/validation hardening
- rate limiting is in-memory and intended for single-instance Community deployments
- AI output is advisory
- experimental modules are not part of the supported v0.1 product surface
- demo seed credentials must never be exposed to untrusted networks

## Responsible disclosure

Please avoid destructive testing and unrelated data access. We will acknowledge valid reports and coordinate remediation/disclosure as appropriate.
