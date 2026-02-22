# Dependency Vulnerabilities

## Running npm audit

Before each release and periodically in production:

```bash
npm audit
```

- **High and Critical**: Fix before production deployment.
  - Try `npm audit fix` first.
  - If that is insufficient, run `npm audit fix --force` only after reviewing breaking changes, or upgrade specific packages manually.
- **Moderate**: Document below if they cannot be fixed yet (e.g. no patched version, or upgrade would break the build).

## Fixing high/critical

1. Run `npm audit` and note high/critical findings.
2. Run `npm audit fix` to apply compatible updates.
3. Run `npm audit` again. For any remaining high/critical, upgrade the affected dependency to the version suggested in the advisory, or add an override/patched version if available.
4. Re-run tests and build: `npm run build` and `npm run test:run`.

## Moderate vulnerabilities (documented)

*When a moderate (or lower) vulnerability cannot be fixed yet (no patch, or upgrade would break the app), document it here with package name, advisory summary, and plan.*

| Package | Severity | Summary | Plan |
|--------|----------|---------|------|
| *(none documented yet)* | | | |

*After running `npm audit`, add any unfixable moderate issues to the table above.*
