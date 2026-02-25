// ─────────────────────────────────────────────────────────────
// Help Center – Content Data
// All help articles live here so the page component stays lean.
// ─────────────────────────────────────────────────────────────

export interface HelpArticle {
    id: string;
    title: string;
    description: string;
    route?: string;
    content: string;
}

export interface HelpSection {
    id: string;
    title: string;
    icon: string;
    color: string;
    articles: HelpArticle[];
}

// ── Section accent colors ──────────────────────────────────
const BLUE = '#3b82f6';
const CYAN = '#06b6d4';
const YELLOW = '#eab308';
const PURPLE = '#a855f7';
const ORANGE = '#f97316';
const PINK = '#ec4899';

// ── Sections ───────────────────────────────────────────────
export const HELP_SECTIONS: HelpSection[] = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. GETTING STARTED
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: '🚀',
        color: BLUE,
        articles: [
            {
                id: 'gs-welcome',
                title: 'Welcome to Astra-CISO',
                description: 'Platform overview and core value proposition',
                content: `Astra-CISO is a unified security command platform designed for CISOs and security teams.

• Single pane of glass for posture, risk, compliance, and strategy
• AI-assisted decision making with configurable autonomy levels
• Real-time threat intelligence and incident response
• Board-ready reporting with one-click export
• Vendor risk automation with knowledge transfer

The platform follows Zero Trust Architecture and Identity Posture (ZTAIP) principles, ensuring every signal is normalized, scored, and surfaced to the right stakeholder.`,
            },
            {
                id: 'gs-first-login',
                title: 'First Login & Setup',
                description: '5-step guide to configuring your environment',
                content: `Follow these steps after your first login:

1. Navigate to Settings and configure your AI provider (Claude, Gemini, or Ollama)
2. Set up your organization profile with company name, industry, and size
3. Import your compliance frameworks from the Governance module
4. Invite team members and assign roles (CISO, SEC_ENG, AUDITOR, VIEWER)
5. Run the initial posture assessment from the Command Center

Each step includes guided wizards that walk you through the configuration. The platform will auto-detect available integrations and suggest connections during setup.`,
            },
            {
                id: 'gs-navigation',
                title: 'Navigation Overview',
                description: 'Understanding the sidebar, tabs, and keyboard shortcuts',
                content: `The platform uses a persistent left sidebar for primary navigation:

• Command Center — Your daily starting point with posture overview
• Decision Center — AI-assisted security decisions and action queue
• Strategy & OKRs — Objectives, defense matrix, KPIs, and project tracker
• Governance & Risk — Compliance, risk register, policies, audit logs, and evidence
• Vendor Risk — Quick answer, knowledge transfer, knowledge base, review, and registry
• Incidents — Response management and tabletop exercises
• Intelligence — Threat briefing, world monitor, signals, infrastructure, feeds, and ransomware
• AppSec — Vulnerability feed, SAST results, and remediation tracking
• Integration Hub — 24 integrations across 9 categories

Each module uses tabs for sub-sections. The header provides global search, notifications, and AI assistant access.`,
            },
            {
                id: 'gs-roles',
                title: 'Role-Based Access',
                description: 'Permissions for CISO, SEC_ENG, AUDITOR, and VIEWER roles',
                content: `Four built-in roles control access across the platform:

CISO
Full access to all modules including strategy, decisions, reporting, and settings. Can approve policies, manage team, and configure AI providers.

SEC_ENG (Security Engineer)
Operational access to incidents, AppSec, vendors, and intelligence. Can create and manage incidents, run scans, and process vendor questionnaires. No access to strategy or executive reporting.

AUDITOR
Read-only access to governance, compliance evidence, policies, and audit logs. Can view but not modify risk register entries. Cannot access operational modules.

VIEWER
Dashboard and reports only. Can view the Command Center overview and generated reports. No edit capabilities anywhere. Ideal for executive stakeholders who need visibility without operational access.`,
            },
        ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. PLATFORM MODULES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'platform-modules',
        title: 'Platform Modules',
        icon: '📦',
        color: CYAN,
        articles: [
            {
                id: 'pm-command',
                title: 'Command Center',
                description: 'Posture overview, executive brief, and board reporting',
                route: '/',
                content: `The Command Center is your daily starting point. It provides three views:

• Overview — live posture gauge, threat pulse, security metrics, and mini world map
• Executive Brief — board-ready narrative summary generated by AI
• Reports & Board Deck — export DOCX/PDF reports with customizable sections

The posture score is computed from risk register, compliance status, open incidents, and vulnerability counts. It updates in real-time as data changes across the platform.`,
            },
            {
                id: 'pm-decisions',
                title: 'Decision Center',
                description: 'AI recommendations, confidence scores, and action queue',
                route: '/decisions',
                content: `Two core tabs power the Decision Center:

• Decisions — AI-generated security recommendations with confidence scores and pillar filters. Review, approve, or defer each decision.
• Action Queue — security tickets and tasks consolidated from all modules. Priority-sorted with assignee tracking.

Decisions are generated based on signals from threat intelligence, risk register changes, compliance gaps, and incident patterns. Each recommendation includes rationale and suggested actions.`,
            },
            {
                id: 'pm-strategy',
                title: 'Strategy & OKRs',
                description: 'OKRs, defense matrix, KPIs, and program tracker',
                route: '/strategy',
                content: `The Strategy module provides four tabs:

• OKRs — define security objectives and key results with progress tracking
• Defense Matrix — visual control coverage map across your security program
• KPI Dashboard — 20+ auto-computed KPIs with board-friendly translations
• Program Tracker — project Gantt chart and status for security initiatives

Each KPI includes trend data and can be exported to executive presentations. The defense matrix highlights coverage gaps and recommends priorities.`,
            },
            {
                id: 'pm-governance',
                title: 'Governance & Risk',
                description: 'Compliance, risk register, policies, audit logs, and evidence vault',
                route: '/governance',
                content: `Five tabs organize governance capabilities:

• Compliance — framework heatmap with evidence vault integration
• Risk Register — FAIR methodology with Annual Loss Expectancy (ALE) calculations
• Policy Engine — full lifecycle: draft → review → approve → publish
• Audit Logs — searchable audit trail of all platform actions
• Evidence Vault — file storage for compliance artifacts and attestations

Upload evidence, track compliance across frameworks (ISO 27001, NIST, GDPR). Create risk scenarios with quantitative scoring. Manage policies through templates and lifecycle stages.`,
            },
            {
                id: 'pm-vendors',
                title: 'Vendor Risk',
                description: 'Quick answer, knowledge transfer, KB, review queue, and registry',
                route: '/vendors',
                content: `The Vendor Risk module includes five key features:

• Quick Answer — upload a questionnaire, process through KB matching and AI, export populated results
• Knowledge Transfer — 4-tier matching pipeline for auto-filling vendor questionnaires
• Knowledge Base — centralized answer library with 3-layer overrides (Common, Company, Product)
• Review Queue — track questionnaire review status and approvals
• Vendor Registry — manage vendor profiles, risk ratings, and contract details

The Knowledge Transfer engine uses direct matching, AI semantic analysis, and context-aware generation to maximize questionnaire coverage.`,
            },
            {
                id: 'pm-incidents',
                title: 'Incidents',
                description: 'Incident response playbooks and tabletop exercises',
                route: '/incidents',
                content: `Two operational modes:

• Incident Response — create and manage incidents with playbooks, war room, and timeline. The War Room provides real-time collaboration for active incidents.
• Tabletop Exercises — plan and run scenario-based exercises for team preparedness. Create exercises, assign participants, and track completion status.

Each incident follows a structured lifecycle: Detection → Triage → Containment → Eradication → Recovery → Lessons Learned.`,
            },
            {
                id: 'pm-intelligence',
                title: 'Threat Intelligence',
                description: 'Briefing, world monitor, signals, infrastructure, feeds, and ransomware',
                route: '/intelligence',
                content: `Comprehensive threat intelligence across six views:

• Threat Briefing — AI-curated daily briefing of relevant threats
• World Monitor — interactive map with geopolitical risk overlay
• Signal Intelligence — anomaly detection and alert correlation
• Infrastructure — asset discovery and exposure monitoring
• Threat Feeds — aggregated feeds from multiple sources
• Ransomware Dashboard — active group tracking and trend analysis

The intelligence engine normalizes events from multiple sources into actionable signals that drive risk score updates.`,
            },
            {
                id: 'pm-appsec',
                title: 'AppSec',
                description: 'Vulnerability feed, SAST results, and remediation tracking',
                route: '/appsec',
                content: `Application security posture management:

• Vulnerability Feed — aggregated vulnerabilities from scanners and feeds
• SAST Results — static analysis findings with severity and remediation guidance
• Remediation Tracking — track fix progress with assignee and deadline management

Integrates with Trivy for container and dependency scanning. Results are correlated with MITRE ATT&CK techniques for prioritized remediation.`,
            },
            {
                id: 'pm-integrations',
                title: 'Integration Hub',
                description: '24 integrations across 9 categories',
                route: '/integrations',
                content: `Connect your security stack with 24 supported integrations:

• SIEM — Splunk, Elastic SIEM, Microsoft Sentinel
• Cloud — AWS Security Hub, Azure Defender, GCP Security Command Center
• Identity — Okta, Azure AD, Auth0
• Vulnerability — Qualys, Tenable, Rapid7
• Endpoint — CrowdStrike, SentinelOne, Carbon Black
• Ticketing — Jira, ServiceNow, PagerDuty
• Communication — Slack, Microsoft Teams, Email
• GRC — OneTrust, Drata, Vanta
• DevSecOps — GitHub, GitLab, Snyk

Each integration includes a guided setup wizard, connection testing, and configurable sync intervals.`,
            },
        ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. CAIQ & KNOWLEDGE TRANSFER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'caiq-knowledge',
        title: 'CAIQ & Knowledge Transfer',
        icon: '⚡',
        color: YELLOW,
        articles: [
            {
                id: 'kt-how',
                title: 'How Knowledge Transfer Works',
                description: '4-tier matching pipeline for auto-filling questionnaires',
                content: `The Knowledge Transfer engine uses a 4-tier matching pipeline:

Tier 1 — Direct Match
Exact or near-exact question matching against the Knowledge Base. Threshold-based with configurable similarity score.

Tier 2 — AI Semantic Match
AI analyzes question semantics to find conceptually similar answers. Adapts existing answers to fit the target question context.

Tier 3 — AI Context Generation
For unmatched questions, AI generates answers using organizational context, policies, and compliance data as source material.

Tier 4 — Manual Review
Questions that cannot be confidently answered are flagged for human review with suggested starting points.

Each tier outputs a confidence score. Higher tiers provide higher confidence but lower coverage.`,
            },
            {
                id: 'kt-multi-company',
                title: 'Multi-Company Configuration',
                description: '3-layer override system for knowledge entries',
                content: `Knowledge entries support three layers of overrides:

Common Layer
Base answers that apply across all companies and products. These are your universal security practices and policies.

Company Layer
Company-specific overrides that modify Common answers for a particular organization. Useful for multi-tenant deployments or consulting firms.

Product Layer
Product-specific overrides that further specialize Company answers. Each product can have unique security controls, architectures, and compliance requirements.

When answering a question, the system checks Product → Company → Common in order, using the most specific available answer.`,
            },
            {
                id: 'kt-quick-answer',
                title: 'Quick Answer Flow',
                description: '3-step visual workflow for processing questionnaires',
                content: `Quick Answer processes questionnaires in three steps:

1. Upload — drag and drop your questionnaire file (CSV, XLSX, or JSON format). The parser auto-detects question columns and structure.

2. Process — the engine runs the 4-tier matching pipeline. A progress bar shows real-time status. You can configure which tiers to enable and set confidence thresholds.

3. Export — download the populated questionnaire with answers filled in. Choose format (original format or standardized JSON). Review flagged items before export.

Each processed question shows its match tier, confidence score, and source reference for traceability.`,
            },
            {
                id: 'kt-import-export',
                title: 'JSON Import & Export',
                description: 'Bulk operations for knowledge base management',
                content: `The Knowledge Base supports bulk operations via JSON:

• Import — upload a JSON file with question-answer pairs. The system validates format, deduplicates entries, and shows a preview before committing.
• Export — download your entire Knowledge Base as structured JSON. Includes metadata, layer information, and timestamps.

JSON schema includes:
• question — the original question text
• answer — the answer content
• category — optional categorization
• source — where the answer originated
• layer — Common, Company, or Product
• confidence — quality score from 0-100`,
            },
            {
                id: 'kt-wizard',
                title: 'Knowledge Base Wizard',
                description: 'Guided setup for building your answer library',
                content: `The Knowledge Base Wizard helps you build your initial answer library:

• Step 1 — Select your compliance frameworks (ISO 27001, SOC 2, GDPR, etc.)
• Step 2 — Import existing completed questionnaires as seed data
• Step 3 — Review and categorize imported answers
• Step 4 — Set layer assignments (Common vs Company vs Product)
• Step 5 — Validate and commit to the Knowledge Base

The wizard can process multiple questionnaire files simultaneously. It uses AI to deduplicate similar answers and suggest the best version to keep.`,
            },
        ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. ARCHITECTURE & AI
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'architecture-ai',
        title: 'Architecture & AI',
        icon: '🏗️',
        color: PURPLE,
        articles: [
            {
                id: 'arch-ztaip',
                title: 'ZTAIP Architecture',
                description: 'Zero Trust Architecture and Identity Posture foundation',
                content: `Astra-CISO is built on Zero Trust Architecture and Identity Posture (ZTAIP) principles:

• Never trust, always verify — every API request is authenticated and authorized
• Least privilege — role-based access ensures users only see what they need
• Continuous validation — session tokens are short-lived and refreshed automatically
• Signal-driven — security events drive automatic posture updates

The Signal Bus connects all modules:
• Inputs — SIEM feeds, Trivy scans, threat intel streams, user actions
• Processing — Intelligence Engine normalizes events into typed Signals
• Outputs — Signals update Risk Register, Strategy Pyramid, and posture score

This reactive architecture ensures that a single event (e.g., a new CVE) automatically ripples through risk scores, compliance status, and executive dashboards.`,
            },
            {
                id: 'arch-circuit-breaker',
                title: 'Circuit Breaker Pattern',
                description: 'Graceful degradation for AI and external services',
                content: `All external service calls use a circuit breaker pattern with three states:

CLOSED (Normal)
Requests flow normally. Failures are counted. If failures exceed the threshold within the time window, the circuit opens.

OPEN (Failing)
All requests are immediately rejected with a fallback response. The UI shows degraded-mode indicators. After a timeout period, the circuit transitions to half-open.

HALF_OPEN (Testing)
A limited number of test requests are allowed through. If they succeed, the circuit closes. If they fail, the circuit reopens.

This pattern prevents cascade failures when AI providers, threat feeds, or integration endpoints are unavailable. The platform continues to function with cached data and manual workflows.`,
            },
            {
                id: 'arch-multi-ai',
                title: 'Multi-Provider AI',
                description: 'Support for Claude, Gemini, and Ollama providers',
                content: `The platform supports three AI providers:

• Claude (Anthropic) — cloud-based, excellent reasoning capabilities. Best for complex policy analysis and decision recommendations.
• Gemini (Google) — cloud-based, strong at structured output and data analysis. Good for compliance mapping and report generation.
• Ollama (Local) — self-hosted, runs on your infrastructure. Zero data exfiltration risk. Supports Llama, Mistral, and other open models.

Configuration is done in Settings → AI Provider:
• Select your preferred provider
• Enter API keys (for cloud providers)
• Test connection
• Set autonomy level (suggest-only, auto-fill with review, fully autonomous)

The system falls back to the next available provider if the primary is unavailable, following the circuit breaker pattern.`,
            },
            {
                id: 'arch-fair',
                title: 'FAIR Risk Quantification',
                description: 'Factor Analysis of Information Risk methodology',
                content: `The Risk Register uses FAIR (Factor Analysis of Information Risk) for quantitative risk assessment:

• Loss Event Frequency (LEF) — how often a threat event occurs
• Threat Event Frequency (TEF) — how often a threat agent acts
• Vulnerability (V) — probability that a threat event becomes a loss event
• Loss Magnitude (LM) — the impact in financial terms

The system calculates:
• Single Loss Expectancy (SLE) = average loss per event
• Annual Loss Expectancy (ALE) = SLE × LEF
• Risk Score = normalized 0-100 value for comparison

Each risk scenario includes Monte Carlo simulation support for confidence intervals. Results feed into the posture score and strategy recommendations.`,
            },
        ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. THREAT INTELLIGENCE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'threat-intelligence',
        title: 'Threat Intelligence',
        icon: '🌐',
        color: ORANGE,
        articles: [
            {
                id: 'ti-world-monitor',
                title: 'World Monitor',
                description: 'Interactive map with geopolitical risk layers',
                route: '/intelligence',
                content: `The World Monitor provides a global threat visualization with multiple layers:

• Office Locations — your organization's offices with pulse indicators
• Conflict Zones — active conflict areas with severity coloring
• Submarine Cables — undersea cable infrastructure relevant to your operations
• Threat Actors — known APT group activity mapped to regions
• Sanctions — sanctioned countries and entities highlighted

Layers can be toggled individually. Presets provide quick views:
• Executive Overview — offices and high-severity conflicts only
• Infrastructure — cables, data centers, and network paths
• Geopolitical — conflicts, sanctions, and instability indices

Click any marker for detailed intelligence briefing with source citations.`,
            },
            {
                id: 'ti-instability',
                title: 'Country Instability Index',
                description: 'Scoring methodology for geopolitical risk assessment',
                content: `Each country receives an instability index (0-100) based on multiple factors:

• Political Stability — governance effectiveness, corruption index, rule of law
• Cyber Capability — offensive cyber capacity, state-sponsored APT activity
• Conflict Status — active conflicts, border disputes, internal unrest
• Economic Risk — sanctions exposure, financial system stability
• Infrastructure — internet freedom, surveillance capability, data sovereignty laws

Scores are updated daily from multiple intelligence sources. Countries are categorized as:
• Low Risk (0-25) — stable, strong rule of law, minimal cyber threat
• Moderate (26-50) — some concerns, monitor for changes
• Elevated (51-75) — active risks, recommend enhanced due diligence
• Critical (76-100) — active conflict or severe cyber threat, restrict operations`,
            },
            {
                id: 'ti-signals',
                title: 'Signal Intelligence',
                description: 'Anomaly detection and alert correlation engine',
                content: `The Signal Intelligence module provides automated anomaly detection:

• Baseline Learning — the system learns normal patterns for your environment over a configurable window (7-30 days)
• Anomaly Detection — deviations from baseline trigger alerts with severity scoring
• Alert Correlation — related alerts are grouped into incidents automatically
• Threat Mapping — alerts are mapped to MITRE ATT&CK techniques

Signal types include:
• Authentication anomalies — unusual login patterns, geo-impossible travel
• Network anomalies — traffic spikes, unusual destinations, data exfiltration indicators
• Configuration changes — unauthorized modifications to security controls
• Vulnerability exposure — new CVEs affecting your asset inventory

Each signal includes confidence score, affected assets, and recommended response actions.`,
            },
        ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. ADMINISTRATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'administration',
        title: 'Administration',
        icon: '⚙️',
        color: PINK,
        articles: [
            {
                id: 'admin-team',
                title: 'Team Management',
                description: 'Invite members, assign roles, and manage permissions',
                route: '/settings',
                content: `Manage your security team from Settings → Team Management:

• Invite Members — send email invitations with pre-assigned roles
• Role Assignment — assign CISO, SEC_ENG, AUDITOR, or VIEWER roles
• Access Review — periodic review of user access and permissions
• Activity Monitoring — track user actions and last login times

Best practices:
• Follow least privilege — start with VIEWER and escalate as needed
• Review access quarterly — remove inactive users promptly
• Use SSO — centralize authentication for better control
• Enable MFA — require multi-factor for all accounts`,
            },
            {
                id: 'admin-sso',
                title: 'SSO Configuration',
                description: 'SAML and OIDC single sign-on setup',
                content: `Configure single sign-on for enterprise authentication:

SAML 2.0 Setup:
• Enter your IdP metadata URL or upload the XML file
• Configure SP entity ID and ACS URL (provided in the setup screen)
• Map IdP attributes to platform roles
• Test the connection before enabling

OIDC Setup:
• Enter client ID and client secret from your IdP
• Configure discovery URL or manual endpoints
• Map claims to platform roles
• Test the connection before enabling

Supported identity providers include Okta, Azure AD, Google Workspace, OneLogin, and any SAML 2.0 / OIDC compliant provider.`,
            },
            {
                id: 'admin-security',
                title: 'Security Policies',
                description: 'Platform security settings and hardening options',
                route: '/settings',
                content: `Configure platform security policies:

• Session Management — set session timeout (default: 8 hours), idle timeout (default: 30 minutes)
• Password Policy — minimum length, complexity requirements, rotation period
• MFA Enforcement — require multi-factor for all users or specific roles
• IP Allowlisting — restrict access to specific IP ranges
• API Key Management — create and rotate API keys for integrations
• Audit Retention — configure how long audit logs are retained (default: 1 year)

All security policy changes are logged in the audit trail with the admin who made the change.`,
            },
            {
                id: 'admin-docker',
                title: 'Docker Deployment',
                description: 'Container deployment and configuration guide',
                content: `Deploy Astra-CISO using Docker Compose:

docker-compose.yml includes:
• app — Next.js application container
• db — PostgreSQL database with persistent volume
• redis — session cache and rate limiting (optional)

Environment variables:
• NEXTAUTH_SECRET — session encryption key (required)
• DATABASE_URL — PostgreSQL connection string
• AI_PROVIDER — claude, gemini, or ollama
• AI_API_KEY — API key for cloud AI providers
• OLLAMA_URL — URL for local Ollama instance

Volumes:
• db-data — persistent database storage
• evidence-data — uploaded compliance evidence files

Run with: docker compose up -d
Health check: curl http://localhost:3000/api/health`,
            },
        ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. COMPLIANCE FRAMEWORKS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'compliance-frameworks',
        title: 'Compliance Frameworks',
        icon: '📋',
        color: CYAN,
        articles: [
            {
                id: 'cf-iso27001',
                title: 'ISO 27001:2022',
                description: '93 controls across 4 themes for information security management',
                route: '/governance',
                content: `ISO 27001:2022 implementation with 93 controls across 4 themes:

Organizational Controls (37 controls)
Policies, roles, asset management, access control, supplier relationships, and business continuity.

People Controls (8 controls)
Screening, terms of employment, awareness training, disciplinary process, and responsibilities after termination.

Physical Controls (14 controls)
Physical security perimeters, entry controls, securing offices, equipment protection, and clear desk policy.

Technological Controls (34 controls)
User endpoint devices, privileged access, information access restriction, secure authentication, capacity management, malware protection, and vulnerability management.

The compliance heatmap shows coverage percentage per theme with drill-down to individual controls.`,
            },
            {
                id: 'cf-soc2',
                title: 'SOC 2 Type II',
                description: '5 trust service categories for service organization controls',
                route: '/governance',
                content: `SOC 2 Type II tracks 5 trust service categories:

Security (Common Criteria)
Protection of information and systems against unauthorized access. Includes logical and physical access controls, system operations, and change management.

Availability
Systems are available for operation as committed. Covers performance monitoring, disaster recovery, and business continuity.

Processing Integrity
System processing is complete, valid, accurate, timely, and authorized. Includes data processing controls and quality assurance.

Confidentiality
Information designated as confidential is protected. Covers encryption, access restrictions, and data classification.

Privacy
Personal information is collected, used, retained, and disclosed in conformity with commitments. Aligns with GDPR requirements for data subject rights.`,
            },
            {
                id: 'cf-gdpr',
                title: 'GDPR',
                description: 'Key areas for General Data Protection Regulation compliance',
                route: '/governance',
                content: `GDPR compliance tracking covers key areas:

• Data Processing — lawful basis for processing, purpose limitation, data minimization
• Data Subject Rights — right to access, rectification, erasure, portability, and objection
• Consent Management — obtaining, recording, and managing consent
• Data Protection Impact Assessments — DPIA for high-risk processing
• Data Breach Notification — 72-hour notification requirement to supervisory authority
• International Transfers — adequacy decisions, SCCs, and BCRs
• Data Protection Officer — DPO appointment and responsibilities
• Records of Processing — Article 30 ROPA maintenance

The platform maps GDPR articles to technical and organizational controls with evidence attachment support.`,
            },
            {
                id: 'cf-nis2',
                title: 'NIS2 Directive',
                description: 'Articles 21 and 23 for network and information security',
                route: '/governance',
                content: `NIS2 Directive compliance focuses on two key articles:

Article 21 — Cybersecurity Risk Management Measures
Essential and important entities must implement appropriate measures:
• Risk analysis and information system security policies
• Incident handling procedures
• Business continuity and crisis management
• Supply chain security
• Security in network and information systems acquisition
• Cybersecurity risk management assessments
• Basic cyber hygiene practices and training
• Cryptography and encryption policies
• Human resources security and access control
• Multi-factor authentication and secure communications

Article 23 — Reporting Obligations
• Early warning within 24 hours of becoming aware of a significant incident
• Incident notification within 72 hours with initial assessment
• Final report within one month with detailed description, root cause, and remediation`,
            },
            {
                id: 'cf-nist',
                title: 'NIST CSF 2.0',
                description: '6 core functions for cybersecurity framework implementation',
                route: '/governance',
                content: `NIST Cybersecurity Framework 2.0 covers 6 core functions:

Govern (New in 2.0)
Establish and monitor cybersecurity risk management strategy, expectations, and policy. Integrates cybersecurity with enterprise risk management.

Identify
Understand organizational context, assets, risks, and supply chain. Develop asset inventory and risk assessment processes.

Protect
Implement safeguards for critical services. Covers identity management, access control, data security, platform security, and resilience.

Detect
Develop capabilities to identify cybersecurity events. Continuous monitoring, anomaly detection, and adverse event analysis.

Respond
Take action regarding detected cybersecurity incidents. Incident management, analysis, mitigation, and communication.

Recover
Restore capabilities impaired by cybersecurity incidents. Recovery planning, improvements, and communications.`,
            },
            {
                id: 'cf-ce',
                title: 'Cyber Essentials',
                description: '5 technical controls for baseline cybersecurity',
                route: '/governance',
                content: `Cyber Essentials provides 5 foundational technical controls:

Firewalls
Ensure boundary firewalls and internet gateways are configured to protect your network. Default deny for inbound connections. Regular rule review.

Secure Configuration
Remove or disable unnecessary software, accounts, and functionality. Change default passwords. Enable only required services.

User Access Control
Implement user accounts with appropriate privileges. Use unique credentials per user. Limit administrative access to authorized personnel only.

Malware Protection
Deploy anti-malware solutions on all endpoints. Keep signatures updated. Configure real-time scanning and scheduled full scans.

Patch Management
Keep all software up to date. Apply critical patches within 14 days. Remove unsupported software. Use automated patch management where possible.

Cyber Essentials Plus adds independent testing and verification of these controls.`,
            },
        ],
    },
];

// ── Flat list for global search ────────────────────────────
export interface SearchableArticle extends HelpArticle {
    sectionId: string;
    sectionTitle: string;
    sectionIcon: string;
    sectionColor: string;
}

export const ALL_ARTICLES: SearchableArticle[] = HELP_SECTIONS.flatMap((s) =>
    s.articles.map((a) => ({
        ...a,
        sectionId: s.id,
        sectionTitle: s.title,
        sectionIcon: s.icon,
        sectionColor: s.color,
    }))
);
