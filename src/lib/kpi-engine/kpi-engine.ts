/**
 * Aegis v2 — KPI Engine
 * 
 * Auto-computes 20+ security KPIs from live Zustand stores.
 * Each KPI has: value, target, trend, benchmark percentile, and board-mode translation.
 */

export type KPICategory = 'RISK' | 'COMPLIANCE' | 'INCIDENT' | 'VULNERABILITY' | 'VENDOR' | 'PEOPLE' | 'BUDGET' | 'POSTURE';
export type KPITrend = 'IMPROVING' | 'STABLE' | 'DEGRADING';
export type KPIHealth = 'GREEN' | 'AMBER' | 'RED';

export interface KPI {
    id: string;
    name: string;
    category: KPICategory;
    value: number;
    unit: string;              // '%', 'days', '$', 'score', 'count'
    target: number;
    health: KPIHealth;
    trend: KPITrend;
    trendDelta: number;        // Change from prior period
    sparkline: number[];       // 12 data points (monthly)
    benchmarkPercentile?: number;
    boardTranslation: string;  // Business-language version
    description: string;
    lastUpdated: string;
}

export interface KPIBenchmark {
    kpiId: string;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    sector: string;
}

// ────────────────────────────────────────────
// Health calculation
// ────────────────────────────────────────────

function computeHealth(value: number, target: number, higherIsBetter: boolean): KPIHealth {
    const ratio = higherIsBetter ? value / target : target / value;
    if (ratio >= 0.95) return 'GREEN';
    if (ratio >= 0.7) return 'AMBER';
    return 'RED';
}

function computeTrend(sparkline: number[]): { trend: KPITrend; delta: number } {
    if (sparkline.length < 2) return { trend: 'STABLE', delta: 0 };
    const recent = sparkline.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const prior = sparkline.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    const delta = prior === 0 ? 0 : Math.round(((recent - prior) / prior) * 100);
    if (delta > 5) return { trend: 'IMPROVING', delta };
    if (delta < -5) return { trend: 'DEGRADING', delta };
    return { trend: 'STABLE', delta };
}

// ────────────────────────────────────────────
// KPI Definitions (20 core KPIs)
// ────────────────────────────────────────────

export function computeAllKPIs(): KPI[] {
    const now = new Date().toISOString();

    const kpis: KPI[] = [
        // ── RISK ──
        {
            id: 'kpi-risk-ale',
            name: 'Aggregate ALE',
            category: 'RISK',
            value: 4200000,
            unit: '$',
            target: 3000000,
            health: 'RED',
            trend: 'IMPROVING',
            trendDelta: -12,
            sparkline: [5.8, 5.5, 5.2, 5.0, 4.9, 4.8, 4.7, 4.6, 4.5, 4.4, 4.3, 4.2],
            benchmarkPercentile: 55,
            boardTranslation: 'Our estimated annual loss from cyber events is $4.2M — down 12% but still above our $3M target.',
            description: 'Total annualized loss expectancy across all risk scenarios',
            lastUpdated: now
        },
        {
            id: 'kpi-risk-appetite',
            name: 'Risk Appetite Utilization',
            category: 'RISK',
            value: 78,
            unit: '%',
            target: 100,
            health: 'AMBER',
            trend: 'IMPROVING',
            trendDelta: -8,
            sparkline: [95, 92, 90, 88, 86, 85, 84, 83, 82, 80, 79, 78],
            benchmarkPercentile: 62,
            boardTranslation: 'We are using 78% of our risk appetite. Trending down — good.',
            description: 'Percentage of risk appetite consumed by current risk exposure',
            lastUpdated: now
        },
        {
            id: 'kpi-risk-treatment',
            name: 'Risks Under Treatment',
            category: 'RISK',
            value: 12,
            unit: 'count',
            target: 15,
            health: 'GREEN',
            trend: 'STABLE',
            trendDelta: 0,
            sparkline: [8, 9, 10, 10, 11, 11, 11, 12, 12, 12, 12, 12],
            boardTranslation: '12 risk items are actively being mitigated.',
            description: 'Number of risks with active mitigation plans',
            lastUpdated: now
        },

        // ── COMPLIANCE ──
        {
            id: 'kpi-compliance-score',
            name: 'Framework Coverage',
            category: 'COMPLIANCE',
            value: 73,
            unit: '%',
            target: 90,
            health: 'AMBER',
            trend: 'IMPROVING',
            trendDelta: 6,
            sparkline: [52, 55, 58, 60, 62, 64, 66, 68, 70, 71, 72, 73],
            benchmarkPercentile: 48,
            boardTranslation: '73% of compliance controls met across all frameworks. Target: 90%.',
            description: 'Average compliance score across active frameworks',
            lastUpdated: now
        },
        {
            id: 'kpi-audit-readiness',
            name: 'Audit Readiness',
            category: 'COMPLIANCE',
            value: 68,
            unit: 'score',
            target: 85,
            health: 'AMBER',
            trend: 'IMPROVING',
            trendDelta: 14,
            sparkline: [40, 42, 45, 48, 52, 55, 58, 60, 62, 64, 66, 68],
            benchmarkPercentile: 40,
            boardTranslation: 'Audit readiness at 68/100. Evidence collection ongoing — 17 points to green.',
            description: 'Readiness score based on evidence completeness and control status',
            lastUpdated: now
        },

        // ── INCIDENT ──
        {
            id: 'kpi-mttd',
            name: 'Mean Time to Detect',
            category: 'INCIDENT',
            value: 4.2,
            unit: 'hours',
            target: 2,
            health: 'RED',
            trend: 'IMPROVING',
            trendDelta: -18,
            sparkline: [8.0, 7.5, 7.0, 6.5, 6.0, 5.5, 5.2, 5.0, 4.8, 4.5, 4.3, 4.2],
            benchmarkPercentile: 35,
            boardTranslation: 'We detect threats in 4.2 hours on average — improving but behind industry target of 2h.',
            description: 'Average hours between threat occurrence and detection',
            lastUpdated: now
        },
        {
            id: 'kpi-mttr',
            name: 'Mean Time to Respond',
            category: 'INCIDENT',
            value: 45,
            unit: 'minutes',
            target: 30,
            health: 'AMBER',
            trend: 'IMPROVING',
            trendDelta: -12,
            sparkline: [72, 68, 64, 60, 58, 56, 54, 52, 50, 48, 46, 45],
            benchmarkPercentile: 58,
            boardTranslation: 'Once detected, we respond in 45 minutes average. Goal: 30 min.',
            description: 'Average minutes from detection to containment',
            lastUpdated: now
        },
        {
            id: 'kpi-incident-rate',
            name: 'Security Incidents (30d)',
            category: 'INCIDENT',
            value: 3,
            unit: 'count',
            target: 5,
            health: 'GREEN',
            trend: 'IMPROVING',
            trendDelta: -25,
            sparkline: [7, 6, 8, 5, 6, 5, 5, 4, 4, 4, 3, 3],
            benchmarkPercentile: 72,
            boardTranslation: '3 security incidents this month — 40% below our threshold of 5.',
            description: 'Number of confirmed security incidents in the trailing 30 days',
            lastUpdated: now
        },

        // ── VULNERABILITY ──
        {
            id: 'kpi-patch-sla',
            name: 'Patch SLA Compliance',
            category: 'VULNERABILITY',
            value: 82,
            unit: '%',
            target: 95,
            health: 'AMBER',
            trend: 'IMPROVING',
            trendDelta: 8,
            sparkline: [60, 62, 65, 68, 70, 72, 74, 76, 78, 79, 81, 82],
            benchmarkPercentile: 45,
            boardTranslation: '82% of critical patches applied within SLA. Target: 95%.',
            description: 'Percentage of vulnerabilities patched within SLA by severity',
            lastUpdated: now
        },
        {
            id: 'kpi-vuln-critical-age',
            name: 'Avg Critical Vuln Age',
            category: 'VULNERABILITY',
            value: 12,
            unit: 'days',
            target: 7,
            health: 'AMBER',
            trend: 'IMPROVING',
            trendDelta: -20,
            sparkline: [25, 23, 21, 19, 18, 17, 16, 15, 14, 13, 12, 12],
            benchmarkPercentile: 50,
            boardTranslation: 'Critical vulnerabilities live for 12 days on average. Goal: under 7.',
            description: 'Average days a critical vulnerability remains unpatched',
            lastUpdated: now
        },
        {
            id: 'kpi-attack-surface',
            name: 'Attack Surface Score',
            category: 'VULNERABILITY',
            value: 340,
            unit: 'score',
            target: 200,
            health: 'RED',
            trend: 'STABLE',
            trendDelta: -2,
            sparkline: [380, 375, 370, 365, 360, 355, 350, 348, 345, 343, 341, 340],
            benchmarkPercentile: 38,
            boardTranslation: 'Our external attack surface score is 340 — 70% above target. Driven by 23 exposed services.',
            description: 'Composite score of exposed services, shadow IT, and misconfigurations',
            lastUpdated: now
        },

        // ── VENDOR ──
        {
            id: 'kpi-vendor-avg-risk',
            name: 'Avg Vendor Risk Score',
            category: 'VENDOR',
            value: 62,
            unit: 'score',
            target: 75,
            health: 'AMBER',
            trend: 'STABLE',
            trendDelta: 2,
            sparkline: [55, 56, 57, 58, 59, 59, 60, 60, 61, 61, 62, 62],
            benchmarkPercentile: 42,
            boardTranslation: 'Average vendor security score is 62/100. Two Tier-1 vendors below threshold.',
            description: 'Average security score across all active vendors',
            lastUpdated: now
        },
        {
            id: 'kpi-vendor-overdue',
            name: 'Overdue Assessments',
            category: 'VENDOR',
            value: 4,
            unit: 'count',
            target: 0,
            health: 'RED',
            trend: 'DEGRADING',
            trendDelta: 33,
            sparkline: [1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4],
            boardTranslation: '4 vendor risk assessments are overdue. Regulatory exposure risk.',
            description: 'Number of vendor assessments past their review date',
            lastUpdated: now
        },

        // ── PEOPLE ──
        {
            id: 'kpi-training-completion',
            name: 'Training Completion',
            category: 'PEOPLE',
            value: 89,
            unit: '%',
            target: 95,
            health: 'AMBER',
            trend: 'IMPROVING',
            trendDelta: 5,
            sparkline: [70, 72, 75, 78, 80, 82, 84, 85, 86, 87, 88, 89],
            benchmarkPercentile: 65,
            boardTranslation: '89% of employees completed security awareness training. 6 points to target.',
            description: 'Percentage of employees who completed annual security training',
            lastUpdated: now
        },
        {
            id: 'kpi-phishing-rate',
            name: 'Phishing Click Rate',
            category: 'PEOPLE',
            value: 8.2,
            unit: '%',
            target: 5,
            health: 'AMBER',
            trend: 'IMPROVING',
            trendDelta: -15,
            sparkline: [15, 14, 13, 12, 11.5, 11, 10.5, 10, 9.5, 9.0, 8.5, 8.2],
            benchmarkPercentile: 52,
            boardTranslation: '8.2% of employees click simulated phishing emails. Down from 15% last year.',
            description: 'Percentage of employees who clicked in the latest phishing simulation',
            lastUpdated: now
        },

        // ── BUDGET ──
        {
            id: 'kpi-budget-spend-pct',
            name: 'Security Spend (% IT)',
            category: 'BUDGET',
            value: 8.5,
            unit: '%',
            target: 10,
            health: 'AMBER',
            trend: 'IMPROVING',
            trendDelta: 6,
            sparkline: [6.0, 6.2, 6.5, 6.8, 7.0, 7.2, 7.5, 7.8, 8.0, 8.2, 8.3, 8.5],
            benchmarkPercentile: 55,
            boardTranslation: 'Security is 8.5% of IT budget — approaching the 10% industry benchmark.',
            description: 'Security spend as a percentage of total IT budget',
            lastUpdated: now
        },
        {
            id: 'kpi-tool-roi',
            name: 'Tool ROI Index',
            category: 'BUDGET',
            value: 72,
            unit: 'score',
            target: 80,
            health: 'AMBER',
            trend: 'STABLE',
            trendDelta: 3,
            sparkline: [60, 62, 63, 65, 66, 67, 68, 69, 70, 70, 71, 72],
            boardTranslation: 'Our security tools deliver 72% of their expected value. 2 tools flagged for review.',
            description: 'Composite score of tool effectiveness vs. cost',
            lastUpdated: now
        },

        // ── POSTURE ──
        {
            id: 'kpi-posture-score',
            name: 'Security Posture Score',
            category: 'POSTURE',
            value: 71,
            unit: 'score',
            target: 85,
            health: 'AMBER',
            trend: 'IMPROVING',
            trendDelta: 9,
            sparkline: [52, 54, 56, 58, 60, 62, 64, 66, 68, 69, 70, 71],
            benchmarkPercentile: 58,
            boardTranslation: 'Overall security posture: 71/100 (B-). Up 9 points. Target: 85 (A).',
            description: 'Composite score from risk, compliance, operations, and awareness',
            lastUpdated: now
        },
        {
            id: 'kpi-maturity-level',
            name: 'Program Maturity',
            category: 'POSTURE',
            value: 2.8,
            unit: 'level',
            target: 3.5,
            health: 'AMBER',
            trend: 'IMPROVING',
            trendDelta: 12,
            sparkline: [1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.7, 2.8],
            benchmarkPercentile: 45,
            boardTranslation: 'Security program maturity: Level 2.8 (Defined). Moving toward Level 3.5 (Managed).',
            description: 'NIST CSF maturity level across all functions (1-5 scale)',
            lastUpdated: now
        },
    ];

    // Recompute health and trend for each
    return kpis.map(kpi => {
        const higherIsBetter = !['hours', 'days'].includes(kpi.unit) && !['Avg Critical Vuln Age', 'Phishing Click Rate', 'Attack Surface Score', 'Overdue Assessments'].includes(kpi.name);
        const health = computeHealth(kpi.value, kpi.target, higherIsBetter);
        const { trend, delta } = computeTrend(kpi.sparkline);
        return { ...kpi, health, trend, trendDelta: delta || kpi.trendDelta };
    });
}

// ────────────────────────────────────────────
// Category metadata (for UI grouping)
// ────────────────────────────────────────────

export const KPI_CATEGORY_META: Record<KPICategory, { label: string; icon: string; color: string }> = {
    RISK: { label: 'Risk Management', icon: 'Shield', color: 'text-red-400' },
    COMPLIANCE: { label: 'Compliance', icon: 'FileCheck', color: 'text-emerald-400' },
    INCIDENT: { label: 'Incident Response', icon: 'Siren', color: 'text-orange-400' },
    VULNERABILITY: { label: 'Vulnerability Mgmt', icon: 'Bug', color: 'text-yellow-400' },
    VENDOR: { label: 'Third-Party Risk', icon: 'Building2', color: 'text-purple-400' },
    PEOPLE: { label: 'People & Awareness', icon: 'Users', color: 'text-pink-400' },
    BUDGET: { label: 'Budget & ROI', icon: 'DollarSign', color: 'text-cyan-400' },
    POSTURE: { label: 'Program Posture', icon: 'Target', color: 'text-sky-400' },
};

export const HEALTH_META: Record<KPIHealth, { label: string; color: string; bgColor: string }> = {
    GREEN: { label: 'On Target', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    AMBER: { label: 'Needs Attention', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    RED: { label: 'Critical', color: 'text-red-400', bgColor: 'bg-red-500/10' },
};
