/**
 * Posture Score Engine
 * 
 * Calculates a composite security posture score (0-100) weighted across:
 *   Compliance (30%), Risk (25%), Incidents (20%), Vendor Risk (15%), AppSec (10%)
 *
 * Also provides industry peer benchmarking (simulated).
 */

export type PostureGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface PostureScoreResult {
    overallScore: number;
    grade: PostureGrade;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    breakdown: {
        compliance: { score: number; weight: number; weighted: number };
        risk: { score: number; weight: number; weighted: number };
        incidents: { score: number; weight: number; weighted: number };
        vendorRisk: { score: number; weight: number; weighted: number };
        appSec: { score: number; weight: number; weighted: number };
    };
    peerBenchmark: {
        percentile: number;
        industryAverage: number;
        topQuartile: number;
    };
}

export interface PostureInputs {
    complianceScore: number;       // 0-100 from governance
    riskScore: number;             // 0-100 average from risk register (inverted: lower is better)
    incidentMTTR: number;          // Mean time to resolve in hours
    openIncidents: number;
    resolvedIncidents: number;
    vendorAvgRiskScore: number;    // 0-100 from vendor store (inverted)
    criticalVulns: number;
    totalVulns: number;
    previousScore?: number;        // For trend calculation
}

function scoreToGrade(score: number): PostureGrade {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

export function calculatePostureScore(inputs: PostureInputs): PostureScoreResult {
    // 1. Compliance (30%) — direct pass-through
    const complianceScore = Math.min(100, Math.max(0, inputs.complianceScore));

    // 2. Risk (25%) — invert: lower risk score = better posture
    const riskPosture = Math.min(100, Math.max(0, 100 - inputs.riskScore));

    // 3. Incidents (20%) — based on resolution rate and MTTR
    const totalIncidents = inputs.openIncidents + inputs.resolvedIncidents;
    const resolutionRate = totalIncidents > 0 ? (inputs.resolvedIncidents / totalIncidents) * 100 : 100;
    const mttrScore = inputs.incidentMTTR <= 4 ? 100 : inputs.incidentMTTR <= 24 ? 75 : inputs.incidentMTTR <= 72 ? 50 : 25;
    const incidentScore = Math.round((resolutionRate * 0.6) + (mttrScore * 0.4));

    // 4. Vendor Risk (15%) — invert: lower vendor risk = better
    const vendorPosture = Math.min(100, Math.max(0, 100 - inputs.vendorAvgRiskScore));

    // 5. AppSec (10%) — based on critical vuln ratio
    const vulnRatio = inputs.totalVulns > 0 ? inputs.criticalVulns / inputs.totalVulns : 0;
    const appSecScore = inputs.totalVulns === 0 ? 100 : Math.round(Math.max(0, 100 - (vulnRatio * 200) - (inputs.criticalVulns * 5)));

    // Weighted composite
    const weights = { compliance: 0.30, risk: 0.25, incidents: 0.20, vendorRisk: 0.15, appSec: 0.10 };
    const overallScore = Math.round(
        complianceScore * weights.compliance +
        riskPosture * weights.risk +
        incidentScore * weights.incidents +
        vendorPosture * weights.vendorRisk +
        appSecScore * weights.appSec
    );

    // Trend
    let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
    if (inputs.previousScore !== undefined) {
        const diff = overallScore - inputs.previousScore;
        if (diff >= 3) trend = 'IMPROVING';
        else if (diff <= -3) trend = 'DECLINING';
    }

    // Industry Benchmark (simulated)
    const industryAverage = 62;
    const topQuartile = 81;
    const percentile = Math.min(99, Math.max(1, Math.round(
        (overallScore / 100) * 80 + (overallScore > industryAverage ? 10 : 0)
    )));

    return {
        overallScore: Math.min(100, Math.max(0, overallScore)),
        grade: scoreToGrade(overallScore),
        trend,
        breakdown: {
            compliance: { score: complianceScore, weight: weights.compliance, weighted: Math.round(complianceScore * weights.compliance) },
            risk: { score: riskPosture, weight: weights.risk, weighted: Math.round(riskPosture * weights.risk) },
            incidents: { score: incidentScore, weight: weights.incidents, weighted: Math.round(incidentScore * weights.incidents) },
            vendorRisk: { score: vendorPosture, weight: weights.vendorRisk, weighted: Math.round(vendorPosture * weights.vendorRisk) },
            appSec: { score: appSecScore, weight: weights.appSec, weighted: Math.round(appSecScore * weights.appSec) },
        },
        peerBenchmark: { percentile, industryAverage, topQuartile }
    };
}
