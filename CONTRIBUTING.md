# Contributing to Astra CISO

Astra is an open-source security decision and evidence platform. Contributions should strengthen real, auditable security workflows rather than add decorative dashboard surface.

## Development

```bash
git clone https://github.com/astra-ssj/CISO.git
cd CISO
cp .env.example .env
docker compose up -d postgres
npm ci
npx prisma migrate deploy
npm run dev
```

## Before opening a pull request

```bash
npm run lint
npx tsc --noEmit
npm test
npm run test:integration
npm run test:smoke
npm run build
```

## Product value test

New functionality should do at least one of the following:

1. Create or route a security decision.
2. Improve evidence supporting a decision.
3. Close or verify a decision.
4. Improve provenance, security, reproducibility, or auditability.

If not, explain why it belongs in Astra.

## Data integrity

> **Empty is honest. Silent mock data is not.**

Demo data must only be created by an explicit demo seed/profile. Do not put production-looking synthetic data into normal runtime fallbacks.

## Deterministic skills

Skills must:

- have a stable skill ID and semantic version
- be deterministic
- avoid hidden I/O
- accept time as an explicit input when needed
- have golden tests
- persist a SkillRun when used operationally

## Security

Never commit credentials, API keys, customer evidence, or production telemetry.

Security vulnerabilities must follow [SECURITY.md](SECURITY.md), not public issues.

## Branches and commits

Branch from `main` using `feature/*`, `fix/*`, `security/*`, `docs/*`, or `chore/*`.

Use focused Conventional Commit messages where practical.

## Pull requests

Include:

- problem statement
- implementation summary
- test evidence
- database/migration impact
- security/authorization impact
- screenshots for UI changes
- documentation changes

Update `HONESTY.md` when a user-facing surface changes between real, empty, experimental, or mixed.
