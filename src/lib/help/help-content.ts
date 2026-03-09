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

Astra-CISO is an AI-powered cybersecurity compliance and risk management
platform designed for organizations operating across multiple jurisdictions.

## Core Capabilities

**Command Center** — Your CISO dashboard. Real-time KPIs, threat feeds,
compliance posture, and pending actions across all modules in one view.

**Decision Center** — AI-assisted decision queue. Pending approvals,
risk-scored priorities, and three autonomy modes (Auto, Supervised, Manual)
that control how much the AI acts independently.

**Strategy & OKRs** — Security program strategy management. Set objectives,
track key results, map controls to strategic initiatives, and measure
program effectiveness.

**Governance & Risk** — Multi-framework compliance tracking (ISO 27001,
SOC 2, NIS2, GDPR, Cyber Essentials, EU AI Act), risk register with
FAIR quantification, and policy lifecycle management.

**Vendor Risk** — CAIQ-powered vendor assessment with a 1000+ entry
Knowledge Base, 4-tier confidence matching (Exact, High, Partial, Low),
and Shodan-integrated attack surface scanning.

**Incidents** — Incident lifecycle management from detection through
resolution, War Room collaboration, and tabletop exercise integration.

**Exercises** — Tabletop exercise engine with 3 crisis scenarios,
decision tree and discussion modes, quantified consequences, and
audit-ready session reports.

**Threat Intelligence** — World Monitor geopolitical dashboard, Abuse.ch
threat feeds (ThreatFox, URLhaus, MalwareBazaar), Shodan attack surface
monitoring, and Country Instability Index.

**AppSec** — Vulnerability tracking, SAST scanner integration,
remediation workflow, and risk register feed.

**Integrations** — Data connectors for Google Workspace, Microsoft 365,
and other platforms that feed real audit data into the compliance engine.

## Multi-Entity Architecture
Astra-CISO supports multiple legal entities under one account. Switch
between entities using the entity selector — all data isolates per entity.

## AI Layer
The platform uses multiple AI providers (Claude, Gemini, Ollama) with
a circuit breaker for resilience. The Dynamic Autonomy Router controls
AI decision-making authority. AI Economics tracks token usage and cost.
      `
            },
            {
                id: 'first-time-setup',
                title: 'First-Time Setup Checklist',
                tags: ['setup', 'configuration', 'first time', 'onboarding'],
                content: `
# First-Time Setup

## 1. Configure Your Entities
Go to Settings → Entities. Add each legal entity your organization
operates (e.g., AstraLabs GmbH, AstraLabs UK Ltd, AstraLabs Pty Ltd).
Each entity can have different compliance frameworks and jurisdictions.

## 2. Set Up Compliance Frameworks
Go to Governance & Risk → Compliance. Enable the frameworks relevant
to each entity: ISO 27001, SOC 2, NIS2, GDPR, Cyber Essentials, EU AI Act.
Mark controls as Implemented, Partial, or Not Implemented.

## 3. Configure Threat Intelligence
Go to Settings → API Keys. Add:
- **Shodan API Key** — for attack surface monitoring (free tier available)
- API keys for AI providers (Claude/Gemini) if not pre-configured

Abuse.ch feeds (ThreatFox, URLhaus, MalwareBazaar) require no API key.

## 4. Connect Data Sources
Go to Integrations. Connect Google Workspace and/or Microsoft 365 to
feed real audit events into the platform. This is what makes the
Command Center show real data instead of empty states.

## 5. Run Your First Exercise
Go to Exercises and run Operation Trojan Vendor in Decision Tree mode.
This takes ~90 minutes and gives you hands-on experience with the
platform while testing your incident response instincts.

## 6. Add Your Team
Go to Settings → Users. Invite team members with appropriate roles:
- **CISO** — full access to all modules
- **Engineer** — access to AppSec, Intelligence, and assigned tasks
- **Auditor** — read-only access to Governance, Risk, and Exercise history
- **Viewer** — read-only dashboard access
      `
            },
            {
                id: 'navigation-guide',
                title: 'Navigating the Platform',
                tags: ['navigation', 'sidebar', 'layout', 'UI'],
                content: `
# Navigation Guide

## Sidebar
The left sidebar contains all 11 module links. Click "Collapse" at the
bottom to minimize it to icons only.

## Top Bar
- **Astra Network** — status of connected systems
- **Immunity Leaderboard** — industry benchmark comparison
- **Data Status** — indicator showing whether real data is flowing
- **Notifications** — alerts requiring attention
- **Security Status** — overall security posture indicator

## Module Tabs
Most modules have internal tabs for sub-sections. For example:
- Governance has: Compliance, Risk Register, Policies
- Intelligence has: World Monitor, Threat Feeds, IOC Enrichment, Attack Surface
- Vendor Risk has: Quick Answer, Full Review, Knowledge Base, Vendor Registry

## Entity Switcher
If you have multiple entities configured, use the entity selector to
switch context. All data (compliance, risks, incidents, intelligence)
filters to the selected entity.
      `
            }
        ]
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

The Command Center displays 6 key performance indicators:

## Security Alerts (24h)
Count of CRITICAL and HIGH severity events from threat intelligence
feeds and connected integrations in the last 24 hours. Click to view
details in the Threat Intelligence module.

## Failed Logins (24h)
Count of failed authentication attempts across connected platforms
(Google Workspace, Microsoft 365). High numbers may indicate brute
force attacks or credential stuffing. Requires active integration.

## Compliance Posture
Percentage of controls marked as Implemented across all active
frameworks. This is a weighted average — frameworks with more controls
contribute proportionally.

## Open Incidents
Active incidents in the Incidents module that haven't reached "Closed"
status. Click to jump to the incident list.

## Pending Actions
Count of items requiring attention across all modules: vendor assessments
due, policy reviews pending, evidence expiring, and decisions awaiting
approval in the Decision Center.

## External Shares (7d)
Count of file sharing events to external recipients in connected
platforms over the last 7 days. High numbers may indicate data
exfiltration risk or policy violation. Requires active integration.

## When KPIs Show Zero or "—"
If KPIs display zero or dashes, it means either:
- No integration is connected (go to Integrations to connect Google
  Workspace or Microsoft 365)
- The connected integration hasn't synced yet (check last sync time)
- There genuinely were no events in the measured period
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

Astra-CISO's AI engine acts as a tireless security analyst, continuously scanning cross-module telemetry to surface high-impact recommendations into the **Decision Center**.

## AI Decision Cards

When the platform correlates multiple low-level signals into a strategic finding, it generates a Decision Card. Each card includes:
*   **The Proposition:** A clear statement of what needs to be decided (e.g., "Enforce MFA on legacy VPN gateway?").
*   **Confidence Score:** How certain the AI is, based on historical data and policy alignment.
*   **Impact Analysis:** Projected changes to the posture score or financial risk if the decision is approved.
*   **Actions:** Direct links to approve, defer, or reject the recommendation.

## The Action Queue

Separate from strategic decisions, the Action Queue consolidates tactical tasks from across the platform (e.g., approving a policy draft, reviewing a vendor questionnaire, acknowledging an incident alert) into a single, prioritized inbox for the SEC_ENG and CISO roles.
`,
                relatedArticles: ['arch-multi-ai']
            },
            {
                id: 'arch-multi-ai',
                title: 'Multi-Provider AI Engine',
                tags: ['ai', 'claude', 'gemini', 'ollama', 'privacy'],
                content: `
# Multi-Provider AI Architecture

Astra-CISO uses a flexible AI abstraction layer, allowing you to route workloads to different Large Language Models (LLMs) based on task complexity and data sensitivity requirements.

### Supported Providers

1.  **Anthropic (Claude):** Default engine for complex logic, policy drafting, and tabletop exercise simulation. Exceptional reasoning capabilities.
2.  **Google (Gemini):** Highly efficient for massive context windows, document processing (CAIQ ingestion), and rapid report generation.
3.  **Ollama (Local):** For organizations with strict data residency rules (e.g., defense contractors), Ollama allows you to run models like Llama 3 or Mistral entirely on your own infrastructure with zero data exfiltration.

### Autonomy Levels
In the Settings, you can configure the AI's autonomy:
*   **Level 1 (Suggest):** AI highlights patterns but requires human action to draft responses.
*   **Level 2 (Draft):** AI pre-populates forms, reports, and vendor questionnaires, waiting for human approval.
*   **Level 3 (Autonomous):** (Coming Soon) AI can execute predefined remediation playbooks automatically for low-risk scenarios.
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

## Creating a Risk
Each risk entry captures:
- **Title** and description
- **Category** — technical, operational, compliance, strategic, financial
- **Likelihood** — probability of occurrence (1-5 scale)
- **Impact** — consequence if realized (1-5 scale or FAIR $ quantification)
- **Owner** — person accountable for mitigation
- **Treatment** — avoid, mitigate, transfer, accept

## FAIR Quantification
The platform supports Factor Analysis of Information Risk (FAIR) for
dollar-value risk quantification. Instead of "High/Medium/Low," FAIR
calculates expected annual loss:

- **Loss Event Frequency** — how often the event occurs per year
- **Loss Magnitude** — dollar impact per occurrence
- **Expected Annual Loss** = Frequency × Magnitude

This gives the CFO a number they can work with: "This risk has an
expected annual cost of €240K. The mitigation costs €80K. ROI is 3:1."

## Risk Heatmap
The visual matrix plots all risks by Likelihood (y-axis) and Impact
(x-axis). Red zone = critical risks requiring immediate attention.
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
The Consensus Assessment Initiative Questionnaire (CAIQ) is a Cloud
Security Alliance (CSA) standard with 260+ questions covering 17 control
domains. It's the industry standard for cloud vendor security assessment.

## How Knowledge Transfer Works
Instead of answering the same 260 questions from scratch for every
vendor assessment, the Knowledge Base stores your organization's
standard responses. When a new assessment arrives:

1. **Quick Answer** — paste a question, get the best matching response
   from your Knowledge Base with a confidence score
2. **Full Review** — run the entire CAIQ questionnaire against your
   Knowledge Base, auto-matching all 260+ questions
3. **Learning Loop** — correct any matches, and the system improves

## Confidence Tiers
- **EXACT** (100%) — identical question already answered
- **HIGH** (>80%) — strong semantic match, answer likely correct
- **PARTIAL** (50-80%) — related question, answer needs review
- **LOW** (<50%) — weak match, manual answer recommended

## Knowledge Base
The Knowledge Base contains 1000+ Q&A entries organized by control
domain (AIS, BCR, CCC, DSP, GRC, etc.). Import/export as JSON.

## Shodan Vendor Scanning
Scan a vendor's domain to discover their external attack surface:
exposed services, open ports, CVEs, SSL/TLS configuration. Results
appear in the vendor profile alongside CAIQ assessment results.
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

All Abuse.ch feeds are free and require no API key.
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

## Status Flow
Open → Investigating → Contained → Resolved → Closed

- **Open** — incident detected and logged
- **Investigating** — root cause analysis underway
- **Contained** — threat neutralized, spread stopped
- **Resolved** — systems restored, evidence preserved
- **Closed** — post-mortem complete, corrective actions assigned

## War Room
Real-time collaboration space for active incidents. Includes:
- Timeline of events
- Notes and observations
- Evidence attachments
- Assigned actions

## Auto-Created Incidents
When integrations detect anomalies (impossible travel, brute force,
mass data exfiltration), the platform auto-creates incident proposals.
Review and accept or dismiss from the Decision Center.

## Linking Exercises to Incidents
After a real incident, run a tabletop exercise based on a similar
scenario within 30 days. This tests whether your lessons learned
actually improved your response capability.
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

## Auto Mode
The AI acts on low-risk decisions automatically (e.g., updating threat
feed classifications, marking expired evidence for review). All actions
are logged in the audit trail.

## Supervised Mode
The AI provides recommendations with confidence scores. A human must
approve before any action is taken. Recommended for most organizations.

## Manual Mode
The AI provides information and analysis only. All decisions require
explicit human initiation. Required for organizations with strict
governance requirements or during the initial trust-building period.

## Switching Modes
Change modes in Decision Center → Settings. Mode changes are logged
in the audit trail. Some organizations use Auto for routine tasks and
Manual for anything touching customer data or regulatory filings.
      `
            },
        ],
    },
    {
        id: "appsec",
        title: "AppSec",
        icon: "🔐",
        description: "Vulnerability management and code security",
        articles: [
            {
                id: "vulnerability-tracking",
                title: "Vulnerability Tracking",
                tags: ["vulnerability", "CVE", "CVSS", "AppSec", "remediation"],
                content: `
# Vulnerability Tracking

## Vulnerability Feed
Lists discovered vulnerabilities with CVE identifiers and CVSS scores.
Sorted by severity (Critical → High → Medium → Low).

## Remediation Workflow
Open → In Progress → Resolved

Track who is fixing what, set due dates, and measure remediation velocity.
Critical vulnerabilities that exceed their SLA auto-escalate to the
Decision Center.

## Risk Register Integration
Critical vulnerabilities auto-create risk proposals in the Governance
module. This connects application security findings to your enterprise
risk posture.
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

Without integrations, the platform displays empty states. With
integrations, it displays real data:

| Without | With |
|---------|------|
| KPIs show "—" | KPIs show real counts |
| Compliance has no evidence | Auto-generated evidence from events |
| Risk register is manual | Auto-proposals from anomalies |
| Incidents are manually created | Auto-detection of suspicious activity |

## Available Connectors
- **Google Workspace** — login events, admin actions, Drive sharing,
  OAuth grants, device compliance
- **Microsoft 365** — sign-in logs, directory audit, SharePoint sharing,
  Intune compliance, security alerts
- **AWS CloudTrail** — IAM changes, S3 access, security group modifications
- **GitHub** — code access, secret scanning, PR approvals
- **Slack** — message retention, DLP events, app installations

## Setup
Go to Settings → Integrations. Each connector has specific setup
instructions and required permissions. Credentials are encrypted
and stored securely.
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

## Why are my KPIs showing zero?
Connect at least one integration (Google Workspace or Microsoft 365)
to populate KPIs with real data.

## Why is the World Monitor empty?
Check that Abuse.ch feeds are connecting (they require no API key).
If the map doesn't load, ensure MapLibre CSS is loading correctly
(check browser console for errors).

## Can multiple people use the platform simultaneously?
Yes. Each user has their own session. Exercise sessions are per-user
unless running in Discussion mode with assigned participants.

## How often should we run tabletop exercises?
Quarterly for full Discussion mode exercises, monthly for quick
Decision mode assessments. After any real incident, run a similar
scenario within 30 days.

## What data leaves my environment?
- AI queries: sent to your configured AI provider (Claude, Gemini, or
  Ollama). Use Ollama for fully local processing.
- Shodan: target IPs/domains are sent to Shodan's API
- Abuse.ch: no data is sent — read-only feeds
- Integration data: stored in your database only
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
