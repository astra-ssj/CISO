/**
 * Aegis v2 — Decision Router
 * 
 * Central nervous system of the CISO Decision OS.
 * Generates, routes, and manages decisions from all 10 pillars.
 * Consumes data from all Zustand stores to produce actionable decisions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    type Decision, type DecisionPillar, type DecisionUrgency, type DecisionStatus,
    type DecisionFilter, type Recommendation, type ConfidenceScore,
    filterDecisions, getConfidenceLabel
} from './types';

// ────────────────────────────────────────────
// Decision Store
// ────────────────────────────────────────────

interface DecisionStore {
    decisions: Decision[];
    addDecision: (decision: Omit<Decision, 'id' | 'createdAt' | 'status'>) => string;
    resolveDecision: (id: string, status: DecisionStatus, notes?: string) => void;
    getFiltered: (filter: DecisionFilter) => Decision[];
    getPending: () => Decision[];
    getPendingByPillar: (pillar: DecisionPillar) => Decision[];
    getDecisionById: (id: string) => Decision | undefined;
    getStats: () => DecisionStats;
}

export interface DecisionStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    deferred: number;
    byPillar: Record<DecisionPillar, number>;
    byUrgency: Record<DecisionUrgency, number>;
    avgConfidence: number;
    avgTimeToDecide: number; // hours
}

// ────────────────────────────────────────────
// Demo Decisions
// ────────────────────────────────────────────

function confidence(value: number, reasoning: string, dataSources: string[]): ConfidenceScore {
    return { value, label: getConfidenceLabel(value), reasoning, dataSources };
}

const DEMO_DECISIONS: Omit<Decision, 'id' | 'createdAt'>[] = [
    {
        pillar: 'RISK',
        urgency: 'CRITICAL',
        status: 'PENDING',
        title: 'Ransomware ALE exceeds risk appetite',
        question: 'Your ransomware annual loss expectancy ($3.5M) exceeds the $2M risk appetite threshold. Accept, mitigate, or transfer?',
        context: 'FAIR analysis shows ransomware ALE of $3.5M based on 2.5 TEF and $1.4M average loss. Current EDR coverage is at 78%. Cyber insurance covers $1M.',
        recommendation: {
            action: 'MITIGATE',
            summary: 'Invest $180K in EDR expansion to reduce ALE to $1.2M — within appetite.',
            rationale: 'Expanding EDR to 100% coverage reduces vulnerability from 0.3 to 0.12, dropping ALE by 65%. Insurance already covers $1M, making residual risk $200K — well within appetite. ROI: $180K investment yields $2.3M risk reduction.',
            confidence: confidence(87, 'FAIR model calibrated with 4 quarters of incident data', ['Risk Register', 'FAIR Engine', 'Vendor Quotes']),
            impact: { riskDelta: -65, costEstimate: 180000, timeEstimate: '6 weeks' },
            alternatives: [
                { action: 'TRANSFER', summary: 'Increase cyber insurance to $3M', tradeoff: 'Premiums increase $120K/year. Does not reduce actual attack surface.' },
                { action: 'ACCEPT', summary: 'Accept current exposure with board acknowledgment', tradeoff: 'Residual $2.5M exposure. Requires board risk acceptance resolution.' }
            ]
        },
        linkedRisks: ['RS-001'],
        linkedKPIs: ['kpi-risk-ale', 'kpi-risk-appetite']
    },
    {
        pillar: 'COMPLIANCE',
        urgency: 'HIGH',
        status: 'PENDING',
        title: 'SOC 2 audit gap: 4 controls unmet',
        question: 'SOC 2 Type II audit is in 45 days. 4 critical controls remain unmet. Prioritize remediation or request audit postponement?',
        context: 'Controls CC6.1 (encryption at rest), CC6.3 (access reviews), CC7.2 (incident response), CC8.1 (change management) are non-compliant. Evidence gap in 3 additional controls.',
        recommendation: {
            action: 'MITIGATE',
            summary: 'Remediate all 4 controls in parallel — estimated 3 weeks with current team.',
            rationale: 'CC6.1 and CC8.1 can be resolved in 1 week each (enable encryption, implement change tickets). CC6.3 requires an access review campaign (2 weeks). CC7.2 needs playbook updates (1 week). All achievable before audit.',
            confidence: confidence(78, 'Based on current team capacity and prior remediation velocity', ['Evidence Vault', 'Compliance Engine', 'Team Calendar']),
            impact: { riskDelta: -30, costEstimate: 15000, timeEstimate: '3 weeks' },
            alternatives: [
                { action: 'DEFER', summary: 'Postpone audit by 60 days', tradeoff: 'Auditor availability risk. May delay customer deals requiring SOC 2.' }
            ]
        },
        linkedControls: ['CC6.1', 'CC6.3', 'CC7.2', 'CC8.1'],
        linkedKPIs: ['kpi-compliance-score', 'kpi-audit-readiness']
    },
    {
        pillar: 'VENDOR',
        urgency: 'HIGH',
        status: 'PENDING',
        title: 'Critical vendor reported data breach',
        question: 'CloudMatrix (Tier 1 vendor, handles PII) disclosed a breach. Initiate emergency reassessment or suspend data flows?',
        context: 'CloudMatrix processes 40% of customer PII for analytics. Breach disclosed 12 hours ago. No evidence of our data involved yet. Contract requires 24h notification.',
        recommendation: {
            action: 'INVESTIGATE',
            summary: 'Initiate emergency reassessment AND activate DPA clause 7.3 for incident details.',
            rationale: 'Suspending data flows impacts revenue pipeline. Instead, invoke contractual right to emergency audit (clause 7.3). Require written confirmation within 48h that our data was not affected. Simultaneously start reassessment.',
            confidence: confidence(72, 'Based on contract terms and breach severity assessment', ['Vendor Risk Store', 'Contract Database', 'Threat Intel']),
            impact: { riskDelta: -15, costEstimate: 5000, timeEstimate: '48 hours' },
            alternatives: [
                { action: 'MITIGATE', summary: 'Immediately suspend PII data flows', tradeoff: 'Analytics pipeline goes offline. $50K/day revenue impact estimated.' },
                { action: 'ACCEPT', summary: 'Monitor situation, no immediate action', tradeoff: 'Regulatory risk if our data is later found compromised and we didn\'t act promptly.' }
            ]
        },
        linkedVendors: ['vendor-cloudmatrix'],
        linkedKPIs: ['kpi-vendor-avg-risk']
    },
    {
        pillar: 'VULNERABILITY',
        urgency: 'CRITICAL',
        status: 'PENDING',
        title: 'Zero-day in production web framework',
        question: 'CVE-2026-1234 (CVSS 9.8) affects your primary web framework. Active exploitation in the wild. Patch now in emergency window or apply WAF rule?',
        context: 'Affects 12 production services. Patch available but requires framework upgrade (breaking changes possible). WAF vendor released virtual patch rule 2 hours ago.',
        recommendation: {
            action: 'MITIGATE',
            summary: 'Deploy WAF virtual patch immediately, schedule framework upgrade for next maintenance window (48h).',
            rationale: 'WAF rule blocks the known exploit vector within minutes, buying time. Full framework upgrade needs testing to avoid regressions. Two-phase approach: immediate risk reduction + permanent fix.',
            confidence: confidence(82, 'WAF rule tested against PoC exploit, framework upgrade tested in staging', ['Vuln Scanner', 'WAF Logs', 'Staging Environment']),
            impact: { riskDelta: -80, costEstimate: 0, timeEstimate: '48 hours' },
            alternatives: [
                { action: 'MITIGATE', summary: 'Emergency patch all 12 services now', tradeoff: 'Risk of breaking changes in production. Estimated 4h downtime per service.' }
            ]
        },
        linkedKPIs: ['kpi-vuln-critical-age', 'kpi-patch-sla']
    },
    {
        pillar: 'BUDGET',
        urgency: 'MEDIUM',
        status: 'PENDING',
        title: 'SIEM and EDR tool overlap detected',
        question: 'Your SIEM ($280K/yr) and EDR ($150K/yr) have 60% capability overlap in log analysis. Consolidate to save $120K/yr?',
        context: 'Tool rationalization analysis shows both products ingest endpoint logs, run behavioral analytics, and generate alerts. EDR vendor now offers SIEM-lite module at no extra cost.',
        recommendation: {
            action: 'INVESTIGATE',
            summary: 'Run 30-day parallel evaluation of EDR SIEM-lite module before committing to consolidation.',
            rationale: 'The $120K/yr savings is significant, but SIEM provides compliance log retention (7-year archive) that EDR doesn\'t. A 30-day trial validates detection parity without committing.',
            confidence: confidence(65, 'Based on vendor feature comparison; hands-on validation needed', ['Budget Module', 'Tool Inventory', 'Vendor Capabilities']),
            impact: { riskDelta: 0, costEstimate: -120000, timeEstimate: '30 days' },
            alternatives: [
                { action: 'APPROVE', summary: 'Consolidate immediately', tradeoff: 'Risk of detection gap during migration. Compliance retention must be addressed separately.' },
                { action: 'REJECT', summary: 'Keep both tools', tradeoff: 'No savings. Continued operational overhead of managing two platforms.' }
            ]
        },
        linkedKPIs: ['kpi-budget-spend-pct', 'kpi-tool-roi']
    },
    {
        pillar: 'BOARD',
        urgency: 'LOW',
        status: 'PENDING',
        title: 'Quarterly board report due in 5 days',
        question: 'Board meeting in 5 days. Auto-generate deck or customize? Key narrative: risk reduction vs. compliance progress?',
        context: 'Last quarter: posture score improved from 62 to 71. Two incidents resolved under SLA. SOC 2 audit upcoming. Ransomware ALE remains above appetite.',
        recommendation: {
            action: 'APPROVE',
            summary: 'Auto-generate deck with "Risk Reduction Progress" as primary narrative, compliance as secondary.',
            rationale: 'Posture improvement (+9 pts) and incident performance are strong stories. Lead with risk reduction ROI. Address ransomware gap as "in-progress mitigation" with timeline. SOC 2 as forward-looking initiative.',
            confidence: confidence(90, 'Based on executive communication best practices and prior board feedback', ['Posture Engine', 'Incident Timeline', 'Risk Register']),
            impact: { riskDelta: 0, timeEstimate: '5 minutes' },
            alternatives: [
                { action: 'MITIGATE', summary: 'Lead with compliance narrative', tradeoff: 'Compliance is defensive. Risk reduction shows proactive value creation.' }
            ]
        },
        linkedKPIs: ['kpi-posture-score', 'kpi-compliance-score', 'kpi-risk-ale']
    }
];

// ────────────────────────────────────────────
// Store Implementation
// ────────────────────────────────────────────

export const useDecisionStore = create<DecisionStore>()(
    persist(
        (set, get) => ({
            decisions: DEMO_DECISIONS.map((d, i) => ({
                ...d,
                id: `DEC-${String(i + 1).padStart(3, '0')}`,
                createdAt: new Date(Date.now() - (i * 86400000 * (i + 1))).toISOString()
            })) as Decision[],

            addDecision: (decision) => {
                const id = `DEC-${Date.now().toString(36).toUpperCase()}`;
                set(state => ({
                    decisions: [{
                        ...decision,
                        id,
                        status: 'PENDING' as const,
                        createdAt: new Date().toISOString()
                    }, ...state.decisions]
                }));
                return id;
            },

            resolveDecision: (id, status, notes) => set(state => ({
                decisions: state.decisions.map(d =>
                    d.id === id ? {
                        ...d, status, decisionNotes: notes,
                        decidedAt: new Date().toISOString(), decidedBy: 'CISO'
                    } : d
                )
            })),

            getFiltered: (filter) => filterDecisions(get().decisions, filter),

            getPending: () => get().decisions
                .filter(d => d.status === 'PENDING')
                .sort((a, b) => {
                    const urgencyOrder: Record<DecisionUrgency, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
                    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                }),

            getPendingByPillar: (pillar) => get().getPending().filter(d => d.pillar === pillar),

            getDecisionById: (id) => get().decisions.find(d => d.id === id),

            getStats: () => {
                const decisions = get().decisions;
                const pending = decisions.filter(d => d.status === 'PENDING');
                const resolved = decisions.filter(d => d.decidedAt);

                const byPillar = {} as Record<DecisionPillar, number>;
                const byUrgency = {} as Record<DecisionUrgency, number>;
                decisions.forEach(d => {
                    byPillar[d.pillar] = (byPillar[d.pillar] || 0) + 1;
                    byUrgency[d.urgency] = (byUrgency[d.urgency] || 0) + 1;
                });

                const avgConfidence = decisions.length > 0
                    ? Math.round(decisions.reduce((s, d) => s + d.recommendation.confidence.value, 0) / decisions.length)
                    : 0;

                const avgTimeToDecide = resolved.length > 0
                    ? resolved.reduce((s, d) => {
                        const created = new Date(d.createdAt).getTime();
                        const decided = new Date(d.decidedAt!).getTime();
                        return s + (decided - created) / 3600000;
                    }, 0) / resolved.length
                    : 0;

                return {
                    total: decisions.length,
                    pending: pending.length,
                    approved: decisions.filter(d => d.status === 'APPROVED').length,
                    rejected: decisions.filter(d => d.status === 'REJECTED').length,
                    deferred: decisions.filter(d => d.status === 'DEFERRED').length,
                    byPillar, byUrgency, avgConfidence,
                    avgTimeToDecide: Math.round(avgTimeToDecide * 10) / 10
                };
            }
        }),
        { name: 'aegis-decision-store' }
    )
);
