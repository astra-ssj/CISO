# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.0.x   | ✅ Active |
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
4. **Affected version(s)**
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

## Security Architecture

Astra-CISO implements multiple security layers:

- **Authentication:** NextAuth 5 with credentials provider
- **Authorization:** RBAC with 4 roles (CISO, SEC_ENGINEER, AUDITOR, VIEWER)
- **API Security:** Zod validation, rate limiting, CSP headers
- **Data Protection:** Encrypted integration credentials (AES-256-GCM)
- **Audit Trail:** Immutable append-only audit log
- **AI Safety:** Circuit breaker pattern, Dynamic Autonomy Router

For architecture details, see [docs/HIGH_LEVEL_DESIGN.md](docs/HIGH_LEVEL_DESIGN.md).
