# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 3.0.x-decision.* (`release/v3-decision-loop`) | ✅ Active |
| 2.0.x (`main`) | ⚠️ Maintenance only — do not merge v3 mock-stripping back |
| < 2.0   | ❌ No     |

---

## Reporting a Vulnerability

If you discover a security vulnerability in Astra-CISO, please report it responsibly.

### How to Report

**Email:** [security@sristinative.com](mailto:security@sristinative.com)

Please include:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Impact assessment** — what could an attacker achieve?
4. **Affected version(s)** and branch
5. **Suggested fix** (if you have one)

### What to Expect

| Timeframe | Action |
|-----------|--------|
| **24 hours** | Acknowledgment of your report |
| **72 hours** | Initial assessment and severity classification |
| **7 days** | Status update with remediation plan |
| **30 days** | Fix released (critical) or scheduled (moderate/low) |

### Responsible Disclosure

- **Do not** open public GitHub issues for security vulnerabilities
- **Do not** exploit the vulnerability beyond what's needed to demonstrate it
- **Do** give us reasonable time to fix the issue before disclosure
- We will credit you in the release notes (unless you prefer anonymity)

---

## Security Architecture (v3)

- **Authentication:** NextAuth 5 (JWT). Public paths: `/login`, `/api/auth/*`, `/api/health`. `/api/internal/*` requires `x-astra-internal-secret`.
- **Authorization:** RBAC (CISO, SEC_ENGINEER, AUDITOR, VIEWER)
- **API Security:** Zod, rate limiting, CSP
- **Data:** Postgres 16. GraphJin is **read** allowlist only — no `password`, no Integration `config`
- **Audit Trail:** append-only `AuditLog`; skill runs in `SkillRun`
- **AI Safety:** circuit breaker; LLM is `ai_draft`; default autonomy SUPERVISED
- **OpenNeko:** sidecar. Do not embed the agent with API keys in Next.js serverless

## Default / Mock Credentials

> [!WARNING]
> Seed creates **`ciso@astra.ai` / `admin123`**. Rotate or drop before any shared environment. Never commit `.env.local`.

For what the product **honestly** claims, see [HONESTY.md](HONESTY.md). Architecture notes: [docs/HIGH_LEVEL_DESIGN.md](docs/HIGH_LEVEL_DESIGN.md) (v2 inventory — v3 overrides in [RELEASE.md](RELEASE.md)).
