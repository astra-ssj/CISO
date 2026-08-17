# Astra skill catalog

Skills compute. LLM drafts only. OpenNeko watches and approval-gates — it does not own domain truth.

Every skill is:

- Versioned (`skillId@version`)
- Pure core: no `fetch`, no `Math.random()`, no `Date.now()` except as an **input** (`asOf`)
- Golden-tested (fixture in → fixture out)
- Persisted to `SkillRun` (`inputHash`, `skillVersion`, `outputJson`) when invoked from an API or engine path

Same inputs + same skill version → same output.

## Catalog

| Skill | Version | Input | Output | Clock |
|---|---|---|---|---|
| `caiq.match` | 1.0.0 | questions + KB entries | hits with tier/confidence | none |
| `caiq.score` | 1.0.0 | match hits | coverage %, band, by-confidence | none |
| `caiq.draft` | 1.0.0 | question + model text | labeled `source: ai_draft`, `canCloseDecision: false` | none |
| `risk.fiveByFive` | 1.0.0 | likelihood × impact (1–5) | inherent/residual score + band | none |
| `evidence.expiry` | 1.0.0 | evidence rows + `asOf` + window | expired / expiring / current | `asOf` input |
| `vendor.goNoGo` | 1.0.0 | coverage, tier, Shodan snapshot, appetite | go / conditional / no-go + reasons | none |
| `tabletop.score` | 1.0.0 | session history + scenario | grade, dollars, strengths/failures | none |
| `intel.correlate` | 1.0.0 | IOC list ∩ vendor domains / hosts | hits | none |
| `playbook.nextStep` | 1.0.0 | Playbook.phases JSON | next incomplete step or done | none |

## HTTP

Session **or** `x-astra-internal-secret` (OpenNeko). Catalog: `GET /api/internal/skills`.

- `POST /api/skills/caiq-match`
- `POST /api/skills/caiq-score`
- `POST /api/skills/caiq-draft`
- `POST /api/skills/risk-five-by-five`
- `POST /api/skills/evidence-expiry`
- `POST /api/skills/vendor-gonogo`
- `POST /api/skills/tabletop-score`
- `POST /api/skills/intel-correlate`
- `POST /api/skills/playbook-next-step`
- `GET /api/skills/runs?skillId=&limit=`

Watchers: `POST /api/internal/watchers/tick`  
Approvals: `POST /api/internal/approvals` (dual-write `Approval` + `AuditLog`; optional `OPENNEKO_MEMORY_URL`)

## Persistence

- CAIQ questionnaire matching writes `caiq.match` + `caiq.score`.
- Vendor finalize writes `caiq.score` + `vendor.goNoGo` (+ `risk.fiveByFive` when a risk is created).
- Creating/updating a 5×5 `Risk` writes `risk.fiveByFive`.
- Tabletop finish writes `tabletop.score`.
- Watcher tick writes `evidence.expiry`, `intel.correlate`, `playbook.nextStep`.
- `GET /api/decision-queue` **computes** expiry and 5×5 for the queue (read path).

OpenNeko must call skills by id. It must not re-implement matching in a prompt.
