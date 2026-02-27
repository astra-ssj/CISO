# Test Results — 2026-02-27

> Auto-generated test results log

## Summary

| Suite | Files | Tests | Status |
|-------|-------|-------|--------|
| Unit | 4 | 47 | ✅ ALL PASS |
| Smoke | 3 | 50 | ✅ ALL PASS |
| Integration | 5 | 40 | ✅ ALL PASS |
| **Total** | **12** | **137** | **✅ 137/137** |

## Unit Tests (`tests/unit/`)

| File | Tests | Duration |
|------|-------|----------|
| `caiq-matching.test.ts` | 8 | <1ms |
| `severity-mapping.test.ts` | 16 | <1ms |
| `cii-calculation.test.ts` | 14 | <1ms |
| `circuit-breaker.test.ts` | 9 | <1ms |

## Smoke Tests (`tests/smoke/`)

| File | Tests | Duration |
|------|-------|----------|
| `routes.smoke.test.tsx` | 13 | ~1.5s |
| `sidebar.smoke.test.tsx` | 2 | <100ms |
| `api-health.smoke.test.ts` | 35 | <200ms |

## Integration Tests (`tests/integration/`)

| File | Tests | Duration |
|------|-------|----------|
| `abusech.test.ts` | 5 | ~100ms |
| `shodan.test.ts` | 5 | ~50ms |
| `caiq.test.ts` | 8 | <10ms |
| `governance.test.ts` | 15 | <50ms |
| `auth.test.ts` | 7 | <10ms |

## Commands

```bash
npm test              # Unit tests (default)
npm run test:smoke    # Smoke tests
npm run test:integration  # Integration tests
npm run test:watch    # Watch mode
npm run test:ui       # Browser UI
```
