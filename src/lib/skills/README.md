# Astra skill catalog

Skills compute. LLM drafts only. OpenNeko (later) watches and approval-gates — it does not own domain truth.

Every skill is:

- Versioned (`skillId@version`)
- Pure core: no `fetch`, no `Math.random()`, no `Date.now()` except as an **input** (`asOf`)
- Golden-tested (fixture in → fixture out)
- Persisted to `SkillRun` (`inputHash`, `skillVersion`, `outputJson`) when invoked from an API or engine path

Same inputs + same skill version → same output.

## Catalog (this slice)

| Skill | Version | Input | Output | Clock |
|---|---|---|---|---|
| `caiq.match` | 1.0.0 | questions + KB entries | hits with tier/confidence | none |
| `caiq.score` | 1.0.0 | match hits | coverage %, band, by-confidence | none |
| `risk.fiveByFive` | 1.0.0 | likelihood × impact (1–5) | inherent/residual score + band | none |
| `evidence.expiry` | 1.0.0 | evidence rows + `asOf` + window | expired / expiring / current | `asOf` input |

## HTTP

All routes require a session.

- `POST /api/skills/caiq-match`
- `POST /api/skills/caiq-score`
- `POST /api/skills/risk-five-by-five`
- `POST /api/skills/evidence-expiry`
- `GET /api/skills/runs?skillId=&limit=`

## Persistence

- CAIQ questionnaire matching (`matchToKnowledgeBase`) writes `caiq.match` + `caiq.score` SkillRuns.
- Creating/updating a 5×5 `Risk` writes `risk.fiveByFive`.
- `GET /api/decision-queue` **computes** expiry and 5×5 for the queue but does not persist (read path).

## Not skills (yet)

`caiq.draft` (LLM, labeled draft), `vendor.goNoGo`, `tabletop.score`, `intel.correlate`, `playbook.nextStep`.
