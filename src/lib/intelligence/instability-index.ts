/**
 * Country Instability Index (CII)
 *
 * Computes a 0-100 score per country as a weighted blend of:
 * - Baseline risk (40%)
 * - Unrest events (20%)
 * - Security activity (20%)
 * - Information velocity (20%)
 */

import type { IntelligenceSignal } from './signal-aggregator';

// ── Country baseline risk scores ──────────────────────────────
const BASELINE_SCORES: Record<string, number> = {
    AF: 85, IQ: 55, SY: 80, YE: 82, LY: 68, SO: 78, SD: 88, SS: 85,
    CD: 73, CF: 70, ML: 65, BF: 62, NE: 58, NG: 50, ET: 60, MZ: 48,
    MM: 82, UA: 90, RU: 40, BY: 38, VE: 58, HT: 78, MX: 35,
    PK: 42, LB: 62, IR: 48, KP: 45, CN: 20, IN: 22,
    US: 15, GB: 10, DE: 8, FR: 12, NL: 7, BE: 9, AT: 7, CH: 5,
    IT: 10, ES: 12, PT: 8, IE: 6, SE: 5, NO: 4, FI: 4, DK: 5,
    PL: 10, CZ: 7, RO: 12, BG: 14, GR: 15, HR: 8, HU: 12,
    SK: 8, LT: 10, LV: 10, EE: 9, LU: 3,
    JP: 5, KR: 8, TW: 22, SG: 3, AU: 5, NZ: 3, TH: 25, MY: 12,
    ID: 18, PH: 22, VN: 15, HK: 18,
    AE: 10, SA: 15, IL: 35, TR: 28, EG: 30, QA: 8, BH: 15,
    KW: 10, OM: 8, JO: 18,
    ZA: 25, KE: 22, GH: 15, MA: 12, BR: 20, AR: 22, CL: 12, CO: 28, CA: 6,
};

// ── CII computation ───────────────────────────────────────────

export interface CIIResult {
    country: string;
    countryCode: string;
    score: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    trend: 'rising' | 'falling' | 'stable';
    breakdown: {
        baseline: number;
        unrest: number;
        security: number;
        infoVelocity: number;
    };
    factors: string[];
    threshold: number;
    exceedsThreshold: boolean;
}

/**
 * Compute the Country Instability Index for a given country.
 */
export function computeCII(
    countryCode: string,
    signals: IntelligenceSignal[],
    options: { threshold?: number; windowHours?: number } = {}
): CIIResult {
    const { threshold = 50, windowHours = 48 } = options;
    const code = countryCode.toUpperCase();
    const baseline = BASELINE_SCORES[code] ?? 20;

    // Filter signals for this country within time window
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    const countrySignals = signals.filter(
        (s) => s.country.toUpperCase() === code && s.timestamp.getTime() > cutoff
    );

    // ── Unrest component (0-100) ──
    const unrestTypes = ['PROTEST', 'NEWS'];
    const unrestSignals = countrySignals.filter((s) => unrestTypes.includes(s.type));
    const unrestScore = Math.min(100, unrestSignals.length * 5 +
        unrestSignals.filter((s) => s.severity === 'CRITICAL').length * 15 +
        unrestSignals.filter((s) => s.severity === 'HIGH').length * 8);

    // ── Security activity component (0-100) ──
    const securityTypes = ['MILITARY_FLIGHT', 'NAVAL_VESSEL'];
    const securitySignals = countrySignals.filter((s) => securityTypes.includes(s.type));
    const foreignMilitary = securitySignals.filter(
        (s) => s.metadata?.origin_country && s.metadata.origin_country !== code
    );
    const securityScore = Math.min(100,
        securitySignals.length * 3 + foreignMilitary.length * 6);

    // ── Information velocity component (0-100) ──
    const newsSignals = countrySignals.filter((s) => s.type === 'NEWS');
    const severityWeight = newsSignals.reduce((sum, s) => {
        const w = { CRITICAL: 5, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0.5 };
        return sum + (w[s.severity] ?? 1);
    }, 0);
    const infoScore = Math.min(100, severityWeight * 2);

    // ── Weighted blend ──
    const score = Math.round(
        baseline * 0.4 +
        unrestScore * 0.2 +
        securityScore * 0.2 +
        infoScore * 0.2
    );

    const clampedScore = Math.max(0, Math.min(100, score));

    // ── Factor analysis ──
    const factors: string[] = [];
    if (baseline >= 60) factors.push('high_baseline_risk');
    if (unrestScore >= 40) factors.push('elevated_unrest');
    if (securityScore >= 40) factors.push('military_activity');
    if (foreignMilitary.length > 0) factors.push('foreign_military_presence');
    if (infoScore >= 40) factors.push('high_news_velocity');
    if (countrySignals.some((s) => s.type === 'OUTAGE')) factors.push('internet_disruption');
    if (countrySignals.some((s) => s.type === 'CYBER')) factors.push('cyber_threat');

    return {
        country: code,
        countryCode: code,
        score: clampedScore,
        riskLevel:
            clampedScore >= 80 ? 'critical' :
                clampedScore >= 60 ? 'high' :
                    clampedScore >= 30 ? 'medium' : 'low',
        trend: determineTrend(clampedScore, baseline),
        breakdown: {
            baseline,
            unrest: unrestScore,
            security: securityScore,
            infoVelocity: infoScore,
        },
        factors,
        threshold,
        exceedsThreshold: clampedScore >= threshold,
    };
}

function determineTrend(current: number, baseline: number): 'rising' | 'falling' | 'stable' {
    const diff = current - baseline;
    if (diff > 10) return 'rising';
    if (diff < -5) return 'falling';
    return 'stable';
}

/**
 * Compute CII for all countries where the organization has operations.
 */
export function computeAllCII(
    countryCodes: string[],
    signals: IntelligenceSignal[],
    options?: { threshold?: number }
): CIIResult[] {
    return countryCodes
        .map((code) => computeCII(code, signals, options))
        .sort((a, b) => b.score - a.score);
}

/**
 * CII color for map choropleth.
 */
export function ciiColor(score: number): [number, number, number, number] {
    if (score >= 80) return [239, 68, 68, 180];   // red
    if (score >= 60) return [249, 115, 22, 160];   // orange
    if (score >= 30) return [250, 204, 21, 140];   // yellow
    return [34, 197, 94, 120];                     // green
}
