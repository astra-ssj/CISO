# Contributing to Astra CISO

Thank you for your interest in contributing! This guide covers everything you need to get started.

---

## Development Environment Setup

### Prerequisites

- **Node.js** 22+
- **npm** 10+
- **Docker** 26+ (optional, for container testing)
- **Git**

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/SristiNative/astra-ciso.git
cd astra-ciso

# 2. Install dependencies
npm ci

# 3. Copy environment variables
cp .env.example .env.local
# Fill in required values (see README for reference)

# 4. Set up the database
npx prisma migrate dev

# 5. Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Branch Naming Convention

| Branch type | Pattern | Example |
|-------------|---------|---------|
| Feature | `feature/<short-description>` | `feature/caiq-4-tier-matching` |
| Bug fix | `fix/<short-description>` | `fix/map-render-height` |
| Refactor | `refactor/<short-description>` | `refactor/vendor-risk-tabs` |
| Docs | `docs/<short-description>` | `docs/contributing-guide` |
| Security | `security/<short-description>` | `security/jwt-secret-rotation` |

---

## Commit Message Format (Conventional Commits)

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short imperative description>

[optional body]

[optional footer, e.g. Closes #123]
```

### Allowed types

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behaviour change) |
| `docs` | Documentation only |
| `security` | Security fix or hardening |
| `test` | Adding or updating tests |
| `chore` | Build, CI, deps, tooling |

### Examples

```
feat: add 4-tier CAIQ matching with semantic fallback

fix: correct map container height for World Monitor

security: replace randomBytes with crypto.getRandomValues in middleware

docs: update README with Docker data sovereignty instructions

Closes #42
```

---

## Pull Request Process

1. **Branch** from `main` using the naming convention above.
2. **Implement** your change, keeping commits atomic and well-described.
3. **Self-review** using the PR checklist.
4. **Open a PR** targeting `main` — fill in the PR template completely.
5. **CI must pass** before a PR can be merged (see `.github/workflows/ci.yml`).
6. **Request review** from `@SristiNative` (auto-assigned via CODEOWNERS).
7. **Squash and merge** is the preferred merge strategy.

---

## Code Style

### TypeScript

- **Strict mode** is enabled — no `@ts-ignore`, no `any` types.
- Use `unknown` and type guards instead of `any`.
- All external data boundaries (API responses, form inputs, file parsing) **must** use [Zod](https://zod.dev/) schemas.
- Prefer `const` over `let`; avoid `var`.

### React / Next.js

- Use the **App Router** (`src/app/`) exclusively — no Pages Router.
- Prefer **Server Components** unless client interactivity is required.
- Client Components must start with `'use client'`.

### Formatting

ESLint is configured via `eslint.config.mjs`. Run before commit:

```bash
npx eslint src/
npx tsc --noEmit
```

---

## Testing Expectations

- All new logic must have corresponding unit tests in `src/**/__tests__/` or colocated `.test.ts` files.
- Run the full test suite with:

```bash
npx vitest run
```

- Include edge cases and error paths, not just happy paths.
- For UI components, a basic render test is the minimum bar.

---

## Branch Protection Rules (for maintainers)

The `main` branch is protected:

- Direct pushes are **disabled** — all changes go through PRs.
- CI pipeline (`.github/workflows/ci.yml`) **must pass** before merging.
- At least **1 review** required.
- Feature branches follow: `feature/*`, `fix/*`, `refactor/*`, `docs/*`, `security/*`.

### Tag convention (releases)

We follow [Semantic Versioning](https://semver.org/):

```
v<MAJOR>.<MINOR>.<PATCH>
```

Examples: `v2.0.0`, `v2.1.0`, `v2.1.1`

Docker images are tagged with both `latest` and the version tag automatically via `.github/workflows/docker.yml`.

---

## Recommended GitHub Labels

See `.github/labels.yml` for the full label set. Key labels:

| Label | Colour | Use |
|-------|--------|-----|
| `bug` | 🔴 Red | Something isn't working |
| `enhancement` | 🔵 Blue | New feature or improvement |
| `security` | 🟠 Orange | Security fix or hardening |
| `caiq` | 🟣 Purple | CAIQ / vendor risk module |
| `intelligence` | 🩵 Cyan | World Monitor / intel module |
| `priority:critical` | 🔴 Dark red | Must ship immediately |
| `good first issue` | 🔵 Light blue | Good entry-point for new contributors |

---

## Questions?

Open a [GitHub Discussion](../../discussions) or an [Issue](../../issues) with the `question` label.
