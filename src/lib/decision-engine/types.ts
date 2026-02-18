/**
 * Aegis v2 — Decision Engine Types
 * 
 * Core type system for the CISO Decision OS.
 * Every feature routes through Decision → Recommendation → Approval.
 */

// ────────────────────────────────────────────
// Decision Pillars (the 10 pillars from the plan)
// ────────────────────────────────────────────

export type DecisionPillar =
    | 'RISK'
    | 'COMPLIANCE'
    | 'INCIDENT'
    | 'VULNERABILITY'
    | 'VENDOR'
    | 'BUDGET'
    | 'ACCESS_DATA'
    | 'PROGRAM'
    | 'THREAT_INTEL'
    | 'BOARD';

export type DecisionUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type DecisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEFERRED' | 'AUTO_RESOLVED';

// ────────────────────────────────────────────
// AI Confidence
// ────────────────────────────────────────────

export interface ConfidenceScore {
    value: number;           // 0-100
    label: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'SPECULATIVE';
    reasoning: string;       // Why this confidence level
    dataSources: string[];   // What data informed this
}

export function getConfidenceLabel(score: number): ConfidenceScore['label'] {
    if (score >= 90) return 'VERY_HIGH';
    if (score >= 75) return 'HIGH';
    if (score >= 55) return 'MODERATE';
    if (score >= 35) return 'LOW';
    return 'SPECULATIVE';
}

// ────────────────────────────────────────────
// Recommendation (AI output)
// ────────────────────────────────────────────

export type RecommendationAction = 'APPROVE' | 'REJECT' | 'MITIGATE' | 'TRANSFER' | 'ACCEPT' | 'INVESTIGATE' | 'ESCALATE' | 'DEFER';

export interface Recommendation {
    action: RecommendationAction;
    summary: string;          // One-line recommendation
    rationale: string;        // Detailed reasoning
    confidence: ConfidenceScore;
    impact: {
        riskDelta: number;    // Expected risk score change (-100 to +100)
        costEstimate?: number; // $ cost of the recommended action
        timeEstimate?: string; // e.g. "2 weeks", "3 months"
    };
    alternatives: {
        action: RecommendationAction;
        summary: string;
        tradeoff: string;     // What you give up
    }[];
}

// ────────────────────────────────────────────
// Decision (core unit of work)
// ────────────────────────────────────────────

export interface Decision {
    id: string;
    pillar: DecisionPillar;
    urgency: DecisionUrgency;
    status: DecisionStatus;

    // What needs deciding
    title: string;
    question: string;         // The specific question being answered
    context: string;          // Background information

    // AI recommendation
    recommendation: Recommendation;

    // Linked data
    linkedRisks?: string[];       // Risk register entry IDs
    linkedControls?: string[];    // Compliance control IDs
    linkedVendors?: string[];     // Vendor IDs
    linkedProjects?: string[];    // Project IDs
    linkedKPIs?: string[];        // KPI IDs affected

    // Metadata
    createdAt: string;
    decidedAt?: string;
    decidedBy?: string;
    decisionNotes?: string;
    expiresAt?: string;       // For time-sensitive decisions
}

// ────────────────────────────────────────────
// Decision Filter
// ────────────────────────────────────────────

export interface DecisionFilter {
    pillars?: DecisionPillar[];
    urgencies?: DecisionUrgency[];
    statuses?: DecisionStatus[];
    search?: string;
}

export function filterDecisions(decisions: Decision[], filter: DecisionFilter): Decision[] {
    return decisions.filter(d => {
        if (filter.pillars?.length && !filter.pillars.includes(d.pillar)) return false;
        if (filter.urgencies?.length && !filter.urgencies.includes(d.urgency)) return false;
        if (filter.statuses?.length && !filter.statuses.includes(d.status)) return false;
        if (filter.search) {
            const q = filter.search.toLowerCase();
            return d.title.toLowerCase().includes(q) || d.question.toLowerCase().includes(q);
        }
        return true;
    });
}

// ────────────────────────────────────────────
// Pillar Metadata (for UI)
// ────────────────────────────────────────────

export const PILLAR_META: Record<DecisionPillar, { label: string; icon: string; color: string; description: string }> = {
    RISK: { label: 'Risk', icon: 'Shield', color: 'text-red-400 bg-red-500/10 border-red-500/20', description: 'Risk quantification, appetite, and treatment' },
    COMPLIANCE: { label: 'Compliance', icon: 'FileCheck', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', description: 'Frameworks, controls, and audit readiness' },
    INCIDENT: { label: 'Incident', icon: 'Siren', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', description: 'Triage, severity, and response' },
    VULNERABILITY: { label: 'Vulnerability', icon: 'Bug', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', description: 'Patch priority and attack surface' },
    VENDOR: { label: 'Vendor', icon: 'Building2', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', description: 'Third-party and supply chain risk' },
    BUDGET: { label: 'Budget', icon: 'DollarSign', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', description: 'Security investment and ROI' },
    ACCESS_DATA: { label: 'Access & Data', icon: 'Key', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', description: 'Identity, access, and data governance' },
    PROGRAM: { label: 'Program', icon: 'Target', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', description: 'Security maturity and staffing' },
    THREAT_INTEL: { label: 'Threat Intel', icon: 'Radar', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', description: 'Threat landscape and detection coverage' },
    BOARD: { label: 'Board', icon: 'Presentation', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', description: 'Board communication and reporting' },
};

export const URGENCY_META: Record<DecisionUrgency, { label: string; color: string; sortOrder: number }> = {
    CRITICAL: { label: 'Critical', color: 'bg-red-500 text-white', sortOrder: 0 },
    HIGH: { label: 'High', color: 'bg-orange-500 text-white', sortOrder: 1 },
    MEDIUM: { label: 'Medium', color: 'bg-yellow-500/80 text-black', sortOrder: 2 },
    LOW: { label: 'Low', color: 'bg-blue-500/60 text-white', sortOrder: 3 },
    INFO: { label: 'Info', color: 'bg-gray-500/40 text-gray-200', sortOrder: 4 },
};
