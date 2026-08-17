// ─────────────────────────────────────────────────────────────
// Help Center – Content Data
// Comprehensive documentation for the entire Astra-CISO platform.
// Articles use Markdown formatting.
// ─────────────────────────────────────────────────────────────

export interface HelpSection {
    id: string;
    title: string;
    icon: string;
    description: string;
    articles: HelpArticle[];
}

export interface HelpArticle {
    id: string;
    title: string;
    content: string;
    tags: string[];
    relatedArticles?: string[];
}

export const HELP_SECTIONS: HelpSection[] = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. GETTING STARTED & PLATFORM BASICS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: '🚀',
        description: 'Platform overview, first-time setup, and navigation guide',
        articles: [
            {
                id: 'platform-overview',
                title: 'What is Astra-CISO?',
                tags: ['overview', 'introduction', 'what is'],
                content: `
# What is Astra-CISO?

**Astra is where security decisions get made, evidenced, and remembered.**

It is not an autonomous CISO and not an OpenNeko wrapper. **Skills compute. Humans approve. Snapshots are the source of truth.**

Version **3.0.0-decision.2** on branch \`release/v3-decision-loop\`.

## What we claim today

Vendor security questionnaires answered from a **1,000+ entry knowledge base** (\`caiq.match\` / \`caiq.score\`), 5×5 risk, evidence expiry, vendor go/no-go, Postgres snapshots, an honest decision queue, and an audit trail. OpenNeko is an optional **sidecar** for watchers and approvals.

## What we do not claim today

Live incident command, FAIR as dollar truth, board-ready KPIs, or an AI Decision Center that invents tickets. Empty is honest. Silent mock is not.

## Modules in the nav

**Command Center** — Needs-you queue plus real Prisma counts. Empty intel stays empty.

**Decision Center** — Work that needs a human: expired evidence, open 5×5 risks, recent skill runs. OpenNeko CTA when \`OPENNEKO_URL\` is set.

**Strategy & OKRs** — Objectives and projects from Postgres. Defense Matrix unscored until assessments exist.

**Governance & Risk** — Policies, evidence vault, 5×5 risk register (\`risk.fiveByFive\`).

**Vendor Risk** — CAIQ match/score, knowledge base, vendor registry, optional Shodan snapshots.

**Incidents** — Playbooks from Postgres. War Room binds a real \`Incident\` or is labeled **exercise mode**.

**Exercises** — Tabletop gym. Scoring is the \`tabletop.score\` skill.

**Threat Intelligence** — Live feeds or empty. Never silent \`MOCK_*\` IOCs.

**Integrations / Settings / Help** — Connectors, keys, this documentation.

AppSec and Roadmap fail the value test and are **hidden from the nav**.

## Value test (every feature)

1. Does this create, evidence, or close a **decision**?
2. Is the data **real** (or clearly empty)?
3. Can the CISO **show an auditor** what happened?
4. Same inputs + same skill version → **same output** (or a labeled \`ai_draft\`)?
      `
            },
            {
                id: 'first-time-setup',
                title: 'First-Time Setup Checklist',
                tags: ['setup', 'configuration', 'first time', 'onboarding'],
                content: `
# First-Time Setup

## 1. Postgres
Astra v3 requires Postgres (GraphJin / OpenNeko cannot read SQLite).

\`\`\`bash
docker compose up -d postgres
# DATABASE_URL=postgresql://astra:astra@localhost:5432/astra
npx prisma generate && npx prisma db push && npx prisma db seed
npm run dev
\`\`\`

Local seed login: **ciso@astra.ai** / **admin123**. Change this before any shared deploy.

## 2. Auth secrets
Set \`AUTH_SECRET\` (and \`NEXTAUTH_SECRET\`) in \`.env.local\`.

## 3. Threat intelligence (optional)
Settings → API keys. **Shodan** for attack-surface snapshots. Abuse.ch feeds need no key. Missing key → last Observation or **empty**, never mock IOCs.

## 4. Skills
Skills run from Vendor Risk, Governance, Exercises, and \`POST /api/skills/*\`. Same input + version → same output. LLM output is labeled \`ai_draft\` and cannot close a decision.

## 5. OpenNeko (optional sidecar)
Do **not** \`npm install\` OpenNeko into this app. Follow \`ops/openneko/README.md\`. Set \`ASTRA_INTERNAL_SECRET\` and optionally \`OPENNEKO_URL\`.

## 6. First real work
- Vendor Risk: run a CAIQ match against the knowledge base
- Governance: add evidence with an expiry date (feeds Needs-you)
- Exercises: run a tabletop (writes \`tabletop.score\`)

## 7. Team
Settings → Users. Roles: **CISO**, **SEC_ENGINEER**, **AUDITOR**, **VIEWER**.
      `
            },
            {
                id: 'navigation-guide',
                title: 'Navigating the Platform',
                tags: ['navigation', 'sidebar', 'layout', 'UI'],
                content: `
# Navigation Guide

## Sidebar
Command Center, Decision Center, Strategy & OKRs, Governance & Risk,
Vendor Risk, Incidents, Exercises, Threat Intel, Integrations, Settings, Help.
AppSec and Roadmap are hidden — they do not pass the value test.

Click Collapse at the bottom to icon-only.

## Top bar
Status is **supervised**, not a fake "live SOC" ticker. Notifications
come from Prisma. Empty queues mean nothing needs you.

## Where decisions live
- **Needs you** — Command Center widget and Decision Center tab
- **Recorded** — operator-recorded decisions (starts empty)
- **OpenNeko** — briefing CTA when \`OPENNEKO_URL\` is set
      `
            }
        ]
    },

    {
        id: 'skills-openneko',
        title: 'Skills & OpenNeko',
        icon: '⚙️',
        description: 'Deterministic skills, snapshots, and the sidecar',
        articles: [
            {
                id: 'skills-catalog',
                title: 'Skill catalog',
                tags: ['skills', 'caiq', 'determinism', 'golden tests'],
                content: `
# Skill catalog

Each skill is versioned, pure (clock is an input), and golden-tested.

| Skill | Does |
|-------|------|
| \`caiq.match\` | KB match |
| \`caiq.score\` | Coverage from hits |
| \`caiq.draft\` | Label LLM text; cannot close a decision |
| \`risk.fiveByFive\` | Likelihood × impact bands |
| \`evidence.expiry\` | expiresAt vs asOf |
| \`vendor.goNoGo\` | Score + Shodan snapshot vs appetite |
| \`tabletop.score\` | Exercise grade from stored decisions |
| \`intel.correlate\` | IOC ∩ vendor domains / hosts |
| \`playbook.nextStep\` | Next incomplete checkbox |

HTTP: \`POST /api/skills/...\` (session or \`x-astra-internal-secret\`).
Catalog: \`GET /api/internal/skills\`.

Runs persist to \`SkillRun\` (inputHash, skillVersion, outputJson).
                `,
                relatedArticles: ['openneko-sidecar'],
            },
            {
                id: 'openneko-sidecar',
                title: 'OpenNeko sidecar',
                tags: ['openneko', 'watchers', 'approvals', 'graphjin'],
                content: `
# OpenNeko sidecar

OpenNeko is **not** npm-installed into Astra. Install it beside the repo
(\`ops/openneko/README.md\`). Point GraphJin at **Astra Postgres**, using
the allowlist in \`ops/graphjin/config.yml\`.

- Watchers call \`POST /api/internal/watchers/tick\`
- Approvals: \`POST /api/internal/approvals\` (Approval + AuditLog)
- Plugins need \`skillRunId\` and APPROVE

If OpenNeko disappears, \`caiq.match\` still runs from the UI.
                `,
                relatedArticles: ['skills-catalog'],
            },
        ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. COMMAND CENTER & STRATEGY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: "command-center",
        title: "Command Center",
        icon: "📊",
        description: "CISO dashboard, KPIs, and real-time monitoring",
        articles: [
            {
                id: "dashboard-kpis",
                title: "Understanding Dashboard KPIs",
                tags: ["KPI", "dashboard", "metrics", "command center"],
                content: `
# Dashboard KPIs

Command Center is the **queue of decisions that need a human**, not a wallpaper of invented metrics.

## Needs you
Evidence expired / expiring (skill \`evidence.expiry\`) and open 5×5 risks
(\`risk.fiveByFive\`). Empty means nothing needs you — not that the feed is demo.

## Counts that are real
Vendor, policy, playbook, and evidence counts come from Postgres APIs.
Recent incidents come from \`GET /api/incidents\` (empty until you create one).
Active threats come from live Abuse.ch or stay empty.

## When you see "—" or empty
That is the product. Connect a real integration or add a row. Astra will
not invent failed logins, board KPIs, or SAMPLE incidents.

Executive Brief / some KPI sparklines are still mixed — see HONESTY.md.
      `
            },
            {
                id: "threat-monitor-widget",
                title: "Global Threat Monitor Widget",
                tags: ["threat", "map", "monitor", "geopolitical"],
                content: `
# Global Threat Monitor

The mini-map on the Command Center shows a summary view of the World
Monitor. It displays:

- **Office locations** — teal pulsing dots at each configured entity location
- **Active threats** — recent IOCs from Abuse.ch feeds plotted geographically
- **Geopolitical events** — significant events from GDELT feed

Click the map to open the full World Monitor in the Threat Intelligence module.
      `
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. DECISION CENTER & AI
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'decisions-ai',
        title: 'Decision Center & AI',
        icon: '🧠',
        description: 'AI-assisted security decisions, action queues, and engine capabilities.',
        articles: [
            {
                id: 'decisions-queue',
                title: 'Managing the Decision Queue',
                tags: ['decisions', 'ai recommendations', 'action queue', 'triage'],
                content: `
# The Decision Center

The AI does **not** invent tickets. The queue is computed from Postgres.

## Needs you
- Expired / expiring evidence — skill \`evidence.expiry\`
- Open 5×5 risks — skill \`risk.fiveByFive\`
- Recent skill runs (audit of what computed)

Empty = nothing needs a human. OpenNeko pending actions appear as a
**Open OpenNeko briefing** link when \`OPENNEKO_URL\` is set.

## Recorded
Operator-recorded decisions only. The list starts empty. OpenNeko memory
is dual-written on approve/reject (\`Approval\` + \`AuditLog\` + skillRunId).

## Autonomy
Default is **SUPERVISED**. LLM text is \`source: ai_draft\` and cannot
close a vendor, risk, or incident without a human.
`,
                relatedArticles: ['arch-multi-ai']
            },
            {
                id: 'arch-multi-ai',
                title: 'Multi-Provider AI Engine',
                tags: ['ai', 'claude', 'gemini', 'ollama', 'privacy'],
                content: `
# Multi-Provider AI Architecture

LLM output is a **draft**. Skills are the source of truth.

### Providers
1. **Anthropic (Claude)** — drafts (policy language, tabletop prose, War Room copilot)
2. **Google (Gemini)** — large-context drafts (CAIQ enhance as \`caiq.draft\`)
3. **Ollama (local)** — same envelope, no data to a cloud LLM

Circuit breaker per provider. Tokens/cost tracked. Missing config → no draft, not a fake "fail-safe" playbook.

### Autonomy (default SUPERVISED)
- **MANUAL** — humans CRUD in Astra; no agent
- **SUPERVISED** — OpenNeko / UI approve before plugins act
- **AUTONOMOUS** — only behind an explicit written rule + audit. Not shipped for vendor reject or containment.
`
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. GOVERNANCE & RISK
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: "governance",
        title: "Governance & Risk",
        icon: "🏛",
        description: "Compliance frameworks, risk register, and policy management",
        articles: [
            {
                id: "compliance-frameworks",
                title: "Managing Compliance Frameworks",
                tags: ["compliance", "ISO 27001", "SOC 2", "NIS2", "GDPR", "framework"],
                content: `
# Compliance Frameworks

## Supported Frameworks
- **ISO 27001:2022** — Information security management (114 controls in Annex A)
- **SOC 2 Type II** — Trust services criteria (Security, Availability, Confidentiality, Processing Integrity, Privacy)
- **NIS2** — EU directive for network and information security (Article 21 measures)
- **GDPR** — EU General Data Protection Regulation (Articles 5, 25, 32, 33, 34, 35)
- **Cyber Essentials** — UK government-backed scheme (5 technical controls)
- **EU AI Act** — AI system risk classification and requirements

## Control Status
Each control in a framework can be marked:
- **Implemented** (green) — Control is fully operational with evidence
- **Partial** (amber) — Control exists but has gaps or missing evidence
- **Not Implemented** (red) — Control is not yet in place

## Compliance Percentage
Calculated as: (Implemented controls + 0.5 × Partial controls) / Total controls

When integrations are connected, compliance evidence is auto-generated
from audit events. A control with fresh evidence (< 30 days old) from
an integration counts as having live evidence, strengthening your audit
position.

## Multi-Entity Compliance
Each entity can have different frameworks enabled. Switch entities to
see compliance posture per legal entity. This is essential for
organizations operating under different regulatory regimes
(e.g., NIS2 for EU entities, Cyber Essentials for UK).
      `
            },
            {
                id: "risk-register",
                title: "Risk Register & FAIR Scoring",
                tags: ["risk", "FAIR", "quantification", "register"],
                content: `
# Risk Register

## 5×5 (what we claim)
Each risk stores likelihood × impact (1–5). The skill \`risk.fiveByFive\`
computes inherent/residual score and band. Same numbers → same band.

## FAIR
FAIR dollar fields may exist on older scenario rows. They are **not**
calibrated loss truth. Do not brief the board on ALE until you have
your own loss data.

## Heatmap
Plots stored 5×5 cells. Unscored cells stay an em dash.
      `
            },
            {
                id: "policy-management",
                title: "Policy Lifecycle Management",
                tags: ["policy", "lifecycle", "approval", "review"],
                content: `
# Policy Management

## Policy Lifecycle
Draft → Review → Approved → Published → Retired

- **Draft** — author creates or edits the policy
- **Review** — assigned reviewers assess the policy
- **Approved** — management signs off
- **Published** — policy is active and distributed
- **Retired** — superseded by a new version

## Policy Review Cadence
Set review dates for each policy. The platform alerts when a policy
is approaching its review date. Overdue reviews appear in the Command
Center's Pending Actions.
      `
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. VENDOR RISK & KNOWLEDGE BASE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: "vendor-risk",
        title: "Vendor Risk",
        icon: "🔗",
        description: "CAIQ assessments, Knowledge Base, and vendor scanning",
        articles: [
            {
                id: "caiq-overview",
                title: "CAIQ Knowledge Transfer Engine",
                tags: ["CAIQ", "vendor", "assessment", "questionnaire", "knowledge base"],
                content: `
# CAIQ Knowledge Transfer Engine

## What is CAIQ?
Cloud Security Alliance questionnaire. Hundreds of questions. The job
that hurts is answering them **the same way every time**, with evidence.

## Skills (not a prompt)
1. **\`caiq.match\`** — deterministic KB match (A-to-A / normalized). Golden-tested.
2. **\`caiq.score\`** — coverage % from match hits only.
3. **\`caiq.draft\`** — LLM paragraph labeled \`ai_draft\`. Cannot close a decision.
4. Human review → \`VendorAssessment\`
5. **\`vendor.goNoGo\`** — rules vs appetite + last Shodan Observation. Maps to
   Approved / Conditionally Approved / Requires Reassessment. No autonomous reject.

Same questionnaire hash + KB + skill version → same match.

## Knowledge Base
1,000+ Q&A entries. Import/export JSON.

## Shodan
Optional. Success writes an **Observation** (and attack-surface rows).
Failure → last snapshot or empty.
      `
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. INCIDENTS & EXERCISES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: "exercises",
        title: "Tabletop Exercises",
        icon: "🎯",
        description: "Crisis simulation exercises, scoring, and audit evidence",
        articles: [
            {
                id: "exercises-overview",
                title: "Tabletop Exercises Overview",
                tags: ["tabletop", "exercise", "simulation", "crisis"],
                content: `
# Tabletop Exercises

For the complete guide including scenario walkthroughs, scoring
methodology, facilitator instructions, and auditor evidence guide,
visit the [Exercise Guide](/exercises/guide).

## Quick Summary
- 3 scenarios: Supply Chain Compromise, Insider Threat, Ransomware
- 2 modes: Decision Tree (scored, solo) and Discussion (team, facilitated)
- 5 roles: CFO, Legal Counsel, VP Technology, ISO Auditor, Implementer
- Scoring: Financial impact + Internal reputation + External reputation → Grade A–F
- Audit value: ISO 27001 A.17, SOC 2 CC7.4, NIS2 Art.21(2)(c)
      `
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. INTELLIGENCE & APPSEC
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: "threat-intelligence",
        title: "Threat Intelligence",
        icon: "🌍",
        description: "World Monitor, threat feeds, IOC enrichment, and attack surface",
        articles: [
            {
                id: "world-monitor",
                title: "World Monitor & Geopolitical Intelligence",
                tags: ["world monitor", "map", "geopolitical", "intelligence"],
                content: `
# World Monitor

## What It Shows
The World Monitor is an interactive map displaying 7 static data layers
and multiple live API feeds:

### Static Layers
- Armed conflicts and instability zones
- Military bases and installations
- Submarine cable landing points
- Nuclear facilities
- Major data center locations
- Energy pipeline routes
- Your office locations

### Live Feeds
- **Abuse.ch ThreatFox** — Indicators of Compromise (IOCs)
- **Abuse.ch URLhaus** — Malicious URLs
- **Abuse.ch MalwareBazaar** — Malware samples
- **USGS** — Earthquake data (operational risk to data centers)
- **GDELT** — Geopolitical news events

## Country Instability Index (CII)
Each country where you operate receives an instability score based on:
conflict proximity, geopolitical events, cyber threat activity, and
natural disaster risk. Higher CII = higher operational risk.

## Why This Matters for Compliance
NIS2 Article 21 requires organizations to consider supply chain risks
including geopolitical factors. The World Monitor provides evidence
that you're monitoring the geopolitical risk landscape for every
jurisdiction where you operate.
      `
            },
            {
                id: "threat-feeds",
                title: "Abuse.ch Threat Feeds",
                tags: ["abuse.ch", "threatfox", "urlhaus", "malwarebazaar", "IOC"],
                content: `
# Threat Feeds

## ThreatFox
Indicators of Compromise (IOCs) including IP addresses, domains, and
URLs associated with malware command and control infrastructure.
Confidence levels indicate reliability of the intelligence.

## URLhaus
Database of malicious URLs used for malware distribution. Shows
online/offline status, associated malware families, and hosting details.

## MalwareBazaar
Malware sample repository with SHA-256 hashes, file types, detection
signatures, and CTI (Cyber Threat Intelligence) scores.

## Severity Mapping
All feeds are normalized to a consistent severity scale:
- **CRITICAL** — confidence/CTI ≥ 80
- **HIGH** — confidence/CTI 50–79
- **MEDIUM** — confidence/CTI 25–49
- **LOW** — confidence/CTI < 25

## Data Freshness
- Active (green) — last update < 15 minutes
- Stale (amber) — last update > 1 hour
- Error (red) — API connection failed
- Unconfigured (gray) — API key not set (Shodan only)

All Abuse.ch feeds are free and require no API key. Circuit open or
fetch fail → last Observation or empty. Never \`MOCK_*\` IOCs.
      `
            },
            {
                id: "shodan-scanning",
                title: "Shodan Attack Surface Monitoring",
                tags: ["shodan", "attack surface", "scanning", "reconnaissance"],
                content: `
# Shodan Attack Surface Monitoring

## What Shodan Provides
Shodan scans the internet for exposed services. The platform uses it for:

- **IP Lookup** — discover what services are running on a specific IP
- **Domain Lookup** — find subdomains and associated services
- **Search** — find exposed services by port, country, or technology
- **Vendor Scanning** — assess a vendor's external security posture
- **Attack Surface** — monitor your own organization's exposed services

## Rate Limits
Shodan free tier: 1 request per second. The platform enforces this
automatically. Paid plans allow higher throughput.

## API Key
A Shodan API key is required. Get one at shodan.io (free tier available).
Configure in Settings → API Keys.
      `
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 8. ADMIN & INTEGRATIONS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: "incidents",
        title: "Incidents",
        icon: "⚠️",
        description: "Incident lifecycle, War Room, and tabletop integration",
        articles: [
            {
                id: "incident-lifecycle",
                title: "Incident Lifecycle Management",
                tags: ["incident", "lifecycle", "response", "war room"],
                content: `
# Incident Lifecycle

## Status
Open → Investigating → Contained → Resolved → Closed — when an
\`Incident\` row exists.

## War Room
Binds the first real incident from \`GET /api/incidents\`. If none,
it is **exercise mode** — not live IR. Copilot output is a draft
and cannot close a decision. Playbook checkboxes stay empty until a
stored Playbook is attached (\`playbook.nextStep\`).

Astra is not a SIEM/SOC. Nothing is auto-created from invented telemetry.

## Tabletop
Rehearse under **Exercises**. Finish writes \`tabletop.score\`.
      `
            },
        ],
    },
    {
        id: "decision-center",
        title: "Decision Center",
        icon: "⚡",
        description: "AI-assisted decisions and autonomy modes",
        articles: [
            {
                id: "autonomy-modes",
                title: "AI Autonomy Modes",
                tags: ["AI", "autonomy", "auto", "supervised", "manual", "decision"],
                content: `
# AI Autonomy Modes

Default is **SUPERVISED**.

## MANUAL
Astra UI CRUD. No agent. Skills still run when you click them.

## SUPERVISED
Watchers call Astra skills. Plugins (Jira, Slack, write Risk / vendor status)
run only after **APPROVE** with a \`skillRunId\`. Dual-write \`Approval\` + \`AuditLog\`.

## AUTONOMOUS
Not shipped for vendor reject or incident containment. Requires a written
rule plus audit before it would ever be enabled.
      `
            },
        ],
    },
    {
        id: "appsec",
        title: "AppSec (hidden)",
        icon: "🔐",
        description: "Hidden from nav until scanner snapshots are real",
        articles: [
            {
                id: "appsec-hidden",
                title: "Why AppSec is hidden",
                tags: ["AppSec", "value test", "hidden"],
                content: `
# AppSec is not in the nav

The value test: if a screen does not create, evidence, or close a
decision with **real** data, hide it. The AppSec / Trivy path still
invented CVEs. It is hidden until a scanner writes Observations.

Use Vendor Risk + Shodan snapshots and GitHub Dependabot (empty without
\`GITHUB_TOKEN\`) instead of a fake vuln feed.
      `
            },
        ],
    },
    {
        id: "integrations",
        title: "Integrations",
        icon: "🔌",
        description: "Connecting Google Workspace, Microsoft 365, and other data sources",
        articles: [
            {
                id: "integration-overview",
                title: "Why Integrations Matter",
                tags: ["integration", "Google", "Microsoft", "data", "connector"],
                content: `
# Why Integrations Matter

Connectors persist **Observations**. Command Center and Decision Center
read snapshots and skill outputs — never the live wire on every paint.

Without a connector you see empty. That is correct.

| Without | With |
|---------|------|
| Needs-you from evidence + risks only | Same, plus intel correlate hits |
| Shodan disabled | Observation + AttackSurfaceScan |
| No SIEM | Still not a SOC — we will not invent events |

Credentials stay encrypted. GraphJin must not read Integration \`config\`.
      `
            },
        ],
    },
    {
        id: "settings",
        title: "Settings & FAQ",
        icon: "⚙️",
        description: "Configuration, API keys, troubleshooting, and FAQ",
        articles: [
            {
                id: "api-keys",
                title: "API Key Configuration",
                tags: ["API", "keys", "Shodan", "configuration", "settings"],
                content: `
# API Key Configuration

## Required Keys
- **AI Provider** — Claude (Anthropic), Gemini (Google), or Ollama (local).
  At least one must be configured for AI features to work.

## Optional Keys
- **Shodan** — enables attack surface monitoring and vendor scanning.
  Free tier available at shodan.io.

## Where to Configure
Settings → API Keys. Keys are encrypted at rest and never displayed
in full after saving.
      `
            },
            {
                id: "faq",
                title: "Frequently Asked Questions",
                tags: ["FAQ", "questions", "help", "troubleshooting"],
                content: `
# FAQ

## Why is the queue empty?
Nothing is expired and no open 5×5 risks. Add evidence with \`expiresAt\`
or a risk on Governance.

## Why no fake threats on the ticker?
v3 deleted silent mocks. Abuse.ch / Shodan / OTX: live, last Observation, or empty.

## Is War Room live IR?
Only if an \`Incident\` row exists. Otherwise it is labeled exercise mode.

## Where are skills documented?
In-app: this Help Center → Skills. Repo: \`src/lib/skills/README.md\`.
Honesty inventory: \`HONESTY.md\`.

## Does OpenNeko replace CAIQ matching?
No. OpenNeko calls \`caiq.match\` by id. If OpenNeko is unplugged, the
skill still runs from the UI and golden tests.

## What data leaves my environment?
- AI drafts: your configured provider (or none)
- Shodan: IPs/domains you ask to scan
- Abuse.ch: read-only
- Domain data: your Postgres
      `
            },
        ],
    }
];

// Helper to flatten articles for search
export const ALL_ARTICLES: (HelpArticle & { sectionId: string; sectionTitle: string; sectionIcon: string })[] =
    HELP_SECTIONS.flatMap((section) =>
        section.articles.map((article) => ({
            ...article,
            sectionId: section.id,
            sectionTitle: section.title,
            sectionIcon: section.icon,
        }))
    );

export type SearchableArticle = typeof ALL_ARTICLES[0];
