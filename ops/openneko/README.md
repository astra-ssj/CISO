# OpenNeko sidecar (do not npm-install into Astra)

Astra owns skills, snapshots, Prisma, AuditLog, and the CISO UI.
OpenNeko owns when to look, who may act, and prose. Default autonomy is SUPERVISED.

## Install (beside this repo, never inside Next.js)

Follow [OpenNeko docs](https://openneko.app/docs). Typical:

```bash
# from a directory NEXT TO this app, not inside src/
curl -fsSL https://openneko.app/install | sh
openneko setup
```

During setup:

1. Data source = Astra Postgres `postgresql://astra:astra@localhost:5432/astra`
   (if host 5432 is taken: `ASTRA_PG_PORT=5433 docker compose up -d postgres` and use port 5433)
2. GraphJin allowlist = copy [`../graphjin/config.yml`](../graphjin/config.yml)
3. Do **not** give the agent Astra `AUTH_SECRET` or Integration `config` ciphertext

Astra continues to run on `:3000`. OpenNeko web typically lands on another port (often `:8080` or its own `:3000` — if so, keep Astra on 3000 and set `OPENNEKO_URL`).

## Register Astra skills

OpenNeko watchers must call Astra by skill id, not by prompt:

| Skill | Astra route |
|---|---|
| `caiq.match` | `POST /api/skills/caiq-match` |
| `caiq.score` | `POST /api/skills/caiq-score` |
| `caiq.draft` | envelope only — never canonical |
| `vendor.goNoGo` | `POST /api/skills/vendor-gonogo` |
| `risk.fiveByFive` | `POST /api/skills/risk-five-by-five` |
| `evidence.expiry` | `POST /api/skills/evidence-expiry` |
| `tabletop.score` | `POST /api/skills/tabletop-score` |
| `intel.correlate` | `POST /api/skills/intel-correlate` |
| `playbook.nextStep` | `POST /api/skills/playbook-next-step` |

Watcher tick (secret header):

```
POST /api/internal/watchers/tick
x-astra-internal-secret: $ASTRA_INTERNAL_SECRET
```

Approvals dual-write Astra `Approval` + `AuditLog` (and OpenNeko memory if `OPENNEKO_MEMORY_URL` is set):

```
POST /api/internal/approvals
```

Catalog: `GET /api/internal/skills` (same secret).

## Operator loop

- Morning: OpenNeko briefing = Command Center / Decision Center “Needs you”
- Domain work: Astra `/vendors`, `/governance`, `/exercises`, `/intelligence`
- Approvals: OpenNeko actions. Astra Decision Center shows the same queue plus an OpenNeko CTA when `OPENNEKO_URL` is set.

If OpenNeko is unplugged, `caiq.match` still runs from the UI and golden tests.
