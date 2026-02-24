# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| v2.0.x  | ✅ Active |
| < v2.0  | ❌ End of life |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in Astra CISO, please disclose it responsibly by emailing our security team:

📧 **[security@astralabs.com](mailto:security@astralabs.com)**

Include as much of the following information as possible to help us understand and reproduce the issue:

- **Description** — clear explanation of the vulnerability and its impact
- **Steps to reproduce** — exact steps, commands, or payloads
- **Affected versions** — which version(s) are affected
- **Proof of Concept** — PoC code, screenshots, or logs (if available)
- **Suggested fix** — if you have ideas for remediation

We aim to acknowledge all reports **within 48 hours** and provide a resolution timeline **within 7 days** for critical issues.

---

## Responsible Disclosure Policy

We follow a coordinated disclosure process:

1. You report the vulnerability to us privately.
2. We acknowledge receipt and begin investigation.
3. We develop and test a fix.
4. We release the fix and notify you.
5. You may publicly disclose after 90 days, or sooner if we mutually agree.

We will credit researchers who report valid vulnerabilities in our release notes unless they prefer to remain anonymous.

---

## Security Architecture

Astra CISO is designed with security in mind:

- **Authentication** — NextAuth v5 with JWT sessions; secrets stored in environment variables, never in source.
- **Database** — SQLite via Prisma; all queries use parameterised statements (no raw SQL interpolation).
- **AI API Keys** — Provider keys are runtime secrets; the circuit breaker pattern protects against provider failures.
- **Transport** — Production deployments should be served exclusively over HTTPS/TLS.
- **Cryptography** — Web Crypto API (`crypto.getRandomValues`) for all random operations in Edge contexts; no custom cryptographic implementations.
- **Input Validation** — All external data boundaries validated with [Zod](https://zod.dev/) schemas before processing.

---

## Security Updates

Security patches are released as patch versions (e.g. `v2.0.1`) and will be tagged `security` and `priority:critical` in GitHub releases.

Subscribe to [GitHub Security Advisories](../../security/advisories) for this repository to be notified of new advisories.

---

## PGP Key

If you would prefer to encrypt your report, please request our PGP key at the email address above.
