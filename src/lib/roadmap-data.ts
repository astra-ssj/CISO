// ─────────────────────────────────────────────────────────────
// Astra-CISO Product Roadmap — Data Layer
// Edit this file to update the roadmap without touching the UI.
// ─────────────────────────────────────────────────────────────

export type FeatureStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED' | 'BACKLOG';
export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Category =
    | 'Auth'
    | 'Compliance'
    | 'Integrations'
    | 'AI'
    | 'Platform'
    | 'Cloud'
    | 'AppSec'
    | 'Intelligence'
    | 'Reporting'
    | 'Data'
    | 'Core'
    | 'UX';

export interface Feature {
    id: string;
    name: string;
    description: string;
    status: FeatureStatus;
    priority: Priority;
    category: Category;
    effort?: string;
}

export interface Release {
    id: string;
    version: string;
    title: string;
    status: FeatureStatus;
    target?: string;
    features: Feature[];
}

// ─── Helpers ────────────────────────────────────────────────

export function getReleaseProgress(release: Release) {
    const total = release.features.length;
    if (total === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = release.features.filter(f => f.status === 'COMPLETED').length;
    return { completed, total, percent: Math.round((completed / total) * 100) };
}

export function getOverallStats(releases: Release[]) {
    const all = releases.flatMap(r => r.features);
    const total = all.length;
    const completed = all.filter(f => f.status === 'COMPLETED').length;
    const inProgress = all.filter(f => f.status === 'IN_PROGRESS').length;
    const planned = all.filter(f => f.status === 'PLANNED').length;
    const backlog = all.filter(f => f.status === 'BACKLOG').length;
    return {
        total,
        completed,
        inProgress,
        planned,
        backlog,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
}

export function getAllCategories(releases: Release[]): Category[] {
    const set = new Set<Category>();
    releases.flatMap(r => r.features).forEach(f => set.add(f.category));
    return Array.from(set).sort();
}

// ─── Release Data ───────────────────────────────────────────

export const ROADMAP: Release[] = [
    // ═══ v2.0 — Foundation ═══
    {
        id: 'v2.0',
        version: '2.0',
        title: 'Foundation',
        status: 'IN_PROGRESS',
        target: 'Current Release',
        features: [
            { id: 'f-001', name: 'Command Center Dashboard', description: 'Real-time security posture overview with executive briefing and board reporting.', status: 'COMPLETED', priority: 'CRITICAL', category: 'Core' },
            { id: 'f-002', name: 'FAIR Risk Quantification Engine', description: 'Factor Analysis of Information Risk methodology with ALE calculations and normalized scoring.', status: 'COMPLETED', priority: 'CRITICAL', category: 'Core' },
            { id: 'f-003', name: 'Multi-Framework Compliance', description: 'Support for ISO 27001, NIST CSF, GDPR, NIS2, and SOC 2 frameworks with evidence tracking.', status: 'COMPLETED', priority: 'CRITICAL', category: 'Compliance' },
            { id: 'f-004', name: 'Policy Lifecycle Management', description: 'Full policy workflow: Draft → Review → Approved → Published with version history.', status: 'COMPLETED', priority: 'CRITICAL', category: 'Compliance' },
            { id: 'f-005', name: 'Incident Management + War Room', description: 'Incident response with playbooks, timeline, and real-time War Room collaboration.', status: 'COMPLETED', priority: 'CRITICAL', category: 'Core' },
            { id: 'f-006', name: 'Threat Intelligence Feed', description: 'Curated threat intelligence with MITRE ATT&CK mapping and ransomware tracking.', status: 'COMPLETED', priority: 'HIGH', category: 'Intelligence' },
            { id: 'f-007', name: 'AI-Powered Decision Support', description: 'AI recommendations with confidence scoring, pillar filters, and approval workflows.', status: 'COMPLETED', priority: 'CRITICAL', category: 'AI' },
            { id: 'f-008', name: 'CAIQ v4 Knowledge Base', description: 'Full 261-question Consensus Assessments Initiative Questionnaire with AI auto-fill.', status: 'COMPLETED', priority: 'HIGH', category: 'Compliance' },
            { id: 'f-009', name: 'Knowledge Repository', description: '1,000+ pre-validated Q&A entries for automated questionnaire completion.', status: 'COMPLETED', priority: 'HIGH', category: 'Data' },
            { id: 'f-010', name: 'Knowledge Transfer Engine', description: '4-tier confidence matching (Exact → Semantic → Context → AI Generated) for cross-questionnaire transfer.', status: 'COMPLETED', priority: 'HIGH', category: 'AI' },
            { id: 'f-011', name: 'CAIQ Review Queue', description: 'Review queue with confidence badges, bulk actions, and quality gates.', status: 'COMPLETED', priority: 'MEDIUM', category: 'Compliance' },
            { id: 'f-012', name: 'AI CISO Assistant (Astra)', description: 'Context-aware AI assistant with circuit breaker pattern and confidence tiers.', status: 'COMPLETED', priority: 'HIGH', category: 'AI' },
            { id: 'f-013', name: 'AppSec Dashboard', description: 'Application security posture with Trivy integration for container and dependency scanning.', status: 'COMPLETED', priority: 'HIGH', category: 'AppSec' },
            { id: 'f-014', name: 'Docker Deployment', description: 'Single-command Docker setup with auto-configuration and health checks.', status: 'COMPLETED', priority: 'MEDIUM', category: 'Platform' },
            { id: 'f-015', name: 'Circuit Breaker Pattern', description: 'Graceful AI service degradation with automatic fallbacks and recovery.', status: 'COMPLETED', priority: 'MEDIUM', category: 'Platform' },
            { id: 'f-016', name: 'Immutable Audit Fabric', description: 'Tamper-proof audit logging for all security-critical actions.', status: 'COMPLETED', priority: 'HIGH', category: 'Compliance' },
            { id: 'f-017', name: 'Dark Hacker Theme', description: 'Premium dark theme with glassmorphism, micro-animations, and command-line aesthetics.', status: 'COMPLETED', priority: 'MEDIUM', category: 'UX' },
            { id: 'f-018', name: 'Tabletop Exercise Framework', description: 'Scenario-based tabletop exercises with CRUD operations and status tracking.', status: 'COMPLETED', priority: 'HIGH', category: 'Core' },
            { id: 'f-019', name: 'Help Center', description: 'Comprehensive module documentation with search, role-based access guide, and AI features overview.', status: 'COMPLETED', priority: 'MEDIUM', category: 'UX' },
            { id: 'f-020', name: 'Authentication Consolidation', description: 'Migrate to NextAuth 5 with unified session management and secure credential flow.', status: 'IN_PROGRESS', priority: 'HIGH', category: 'Auth' },
            { id: 'f-021', name: 'Storage Migration', description: 'Migrate from localStorage to Prisma ORM with SQLite for persistent, queryable data storage.', status: 'IN_PROGRESS', priority: 'HIGH', category: 'Platform' },
            { id: 'f-022', name: 'Dead Link Cleanup', description: 'Audit and fix all stale routes, merge redirects, and remove orphaned references.', status: 'COMPLETED', priority: 'MEDIUM', category: 'UX' },
            { id: 'f-023', name: 'TypeScript Strict Mode', description: 'Eliminate all `any` types and enable strict compiler flags across the codebase.', status: 'IN_PROGRESS', priority: 'MEDIUM', category: 'Platform' },
        ],
    },

    // ═══ v2.1 — Enterprise Ready ═══
    {
        id: 'v2.1',
        version: '2.1',
        title: 'Enterprise Ready',
        status: 'PLANNED',
        target: 'Q2 2026',
        features: [
            { id: 'f-100', name: 'SSO / SAML Authentication', description: 'Enterprise SSO with Azure AD, Okta, and Google Workspace support.', status: 'PLANNED', priority: 'CRITICAL', category: 'Auth', effort: '2 weeks' },
            { id: 'f-101', name: 'Multi-User Team Management', description: 'Invite team members, assign roles, and manage permissions from a central dashboard.', status: 'PLANNED', priority: 'CRITICAL', category: 'Auth', effort: '2 weeks' },
            { id: 'f-102', name: 'Audit Log Viewer', description: 'Searchable, filterable, and exportable audit trail with timeline visualization.', status: 'PLANNED', priority: 'CRITICAL', category: 'Compliance', effort: '1 week' },
            { id: 'f-103', name: 'Evidence Vault File Storage', description: 'Upload PDFs, certificates, and screenshots; link evidence to compliance controls.', status: 'PLANNED', priority: 'CRITICAL', category: 'Compliance', effort: '2 weeks' },
            { id: 'f-104', name: 'Board Report Generator', description: 'Automated DOCX/PDF board decks with charts, risk summaries, and compliance status.', status: 'PLANNED', priority: 'HIGH', category: 'Reporting', effort: '2 weeks' },
            { id: 'f-105', name: 'Email Notifications', description: 'Incident alerts, policy review reminders, and evidence expiry warnings via email.', status: 'PLANNED', priority: 'HIGH', category: 'Integrations', effort: '1 week' },
            { id: 'f-106', name: 'Data Import / Export', description: 'Bulk CSV/Excel import for risks, vendors, policies, and evidence.', status: 'PLANNED', priority: 'HIGH', category: 'Data', effort: '1 week' },
        ],
    },

    // ═══ v2.2 — Integrations ═══
    {
        id: 'v2.2',
        version: '2.2',
        title: 'Integrations',
        status: 'PLANNED',
        target: 'Q3 2026',
        features: [
            { id: 'f-200', name: 'Jira Cloud Bi-Directional Sync', description: 'Create tickets from incidents/risks, sync status back, and custom field mapping.', status: 'PLANNED', priority: 'HIGH', category: 'Integrations', effort: '2 weeks' },
            { id: 'f-201', name: 'Slack Integration', description: 'Incident alerts, daily security digest, and slash commands for quick actions.', status: 'PLANNED', priority: 'HIGH', category: 'Integrations', effort: '1 week' },
            { id: 'f-202', name: 'Microsoft Teams Integration', description: 'Adaptive cards for approvals, incident notifications, and bot commands.', status: 'PLANNED', priority: 'MEDIUM', category: 'Integrations', effort: '1 week' },
            { id: 'f-203', name: 'REST API + Webhooks', description: 'OpenAPI spec, API key management, and webhook endpoints for platform events.', status: 'PLANNED', priority: 'HIGH', category: 'Platform', effort: '2 weeks' },
            { id: 'f-204', name: 'Live Threat Intelligence Feeds', description: 'Replace mock data with real ransomware, CVE, and threat actor feeds.', status: 'PLANNED', priority: 'MEDIUM', category: 'Intelligence', effort: '1 week' },
            { id: 'f-205', name: 'GitHub / GitLab Security Alerts', description: 'Import Dependabot, CodeQL, and secret scanning alerts into AppSec.', status: 'PLANNED', priority: 'MEDIUM', category: 'AppSec', effort: '1 week' },
        ],
    },

    // ═══ v2.3 — Cloud Security ═══
    {
        id: 'v2.3',
        version: '2.3',
        title: 'Cloud Security',
        status: 'PLANNED',
        target: 'Q4 2026',
        features: [
            { id: 'f-300', name: 'AWS SecurityHub Integration', description: 'Import findings, map to compliance controls, and auto-create risk entries.', status: 'PLANNED', priority: 'HIGH', category: 'Cloud', effort: '3 weeks' },
            { id: 'f-301', name: 'Azure Defender Integration', description: 'Import Azure security findings and map to compliance controls.', status: 'PLANNED', priority: 'MEDIUM', category: 'Cloud', effort: '2 weeks' },
            { id: 'f-302', name: 'Vulnerability Scanner Integration', description: 'Import Nessus, Qualys, and Trivy scans with remediation tracking.', status: 'PLANNED', priority: 'HIGH', category: 'AppSec', effort: '2 weeks' },
            { id: 'f-303', name: 'Automated Evidence Collection', description: 'Schedule evidence pulls from cloud APIs — IAM policies, encryption settings, backup configs.', status: 'PLANNED', priority: 'HIGH', category: 'Compliance', effort: '3 weeks' },
            { id: 'f-304', name: 'Compliance Drift Detection', description: 'Continuous monitoring against framework controls with alert-on-drift.', status: 'PLANNED', priority: 'MEDIUM', category: 'Compliance', effort: '2 weeks' },
        ],
    },

    // ═══ v3.0 — Autonomous CISO ═══
    {
        id: 'v3.0',
        version: '3.0',
        title: 'Autonomous CISO',
        status: 'BACKLOG',
        target: '2027',
        features: [
            { id: 'f-400', name: 'Multi-Tenant Architecture', description: 'PostgreSQL with per-org data isolation and subsidiary management.', status: 'BACKLOG', priority: 'HIGH', category: 'Platform', effort: '6 weeks' },
            { id: 'f-401', name: 'Natural Language Queries', description: '"Show me all critical risks in EU entities", "What\'s our GDPR compliance gap?"', status: 'BACKLOG', priority: 'MEDIUM', category: 'AI', effort: '3 weeks' },
            { id: 'f-402', name: 'Predictive Risk Scoring', description: 'ML trend analysis on risk scores with anomaly detection and early warning.', status: 'BACKLOG', priority: 'MEDIUM', category: 'AI', effort: '4 weeks' },
            { id: 'f-403', name: 'AI Audit Preparation', description: 'Auto-generate evidence packages per framework and pre-fill audit checklists.', status: 'BACKLOG', priority: 'HIGH', category: 'Compliance', effort: '3 weeks' },
            { id: 'f-404', name: 'Regulatory Change Monitoring', description: 'AI scans regulatory updates and flags impact to your compliance posture.', status: 'BACKLOG', priority: 'MEDIUM', category: 'Intelligence', effort: '3 weeks' },
            { id: 'f-405', name: 'Self-Healing Compliance', description: 'Auto-remediate drift when safe, human-approve when risky — Dynamic Autonomy Router.', status: 'BACKLOG', priority: 'LOW', category: 'AI', effort: '6 weeks' },
            { id: 'f-406', name: 'Marketplace', description: 'Community-contributed knowledge base entries, policy templates, and playbooks.', status: 'BACKLOG', priority: 'LOW', category: 'Platform', effort: '4 weeks' },
        ],
    },
];
