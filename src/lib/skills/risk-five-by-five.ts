import { hashCanonical } from './hash';
import { SKILL_IDS, type SkillRunResult } from './types';

export const RISK_FIVE_BY_FIVE_VERSION = '1.0.0';

export type RiskBand = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFiveByFiveInput {
    likelihood: number;
    impact: number;
    residualLikelihood?: number;
    residualImpact?: number;
}

export interface RiskFiveByFiveOutput {
    inherentScore: number;
    inherentBand: RiskBand;
    residualScore: number | null;
    residualBand: RiskBand | null;
}

function clampCell(n: number): number {
    if (!Number.isFinite(n)) return 1;
    return Math.min(5, Math.max(1, Math.round(n)));
}

function bandFor(score: number): RiskBand {
    if (score >= 17) return 'critical';
    if (score >= 10) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
}

/**
 * Deterministic 5×5 risk score. Likelihood and impact are 1–5 integers.
 * Residual is computed only when both residual axes are provided.
 * No I/O, no clock, no FAIR theater.
 */
export function scoreFiveByFive(input: RiskFiveByFiveInput): RiskFiveByFiveOutput {
    const likelihood = clampCell(input.likelihood);
    const impact = clampCell(input.impact);
    const inherentScore = likelihood * impact;

    const hasResidual =
        input.residualLikelihood !== undefined && input.residualImpact !== undefined;

    const residualScore = hasResidual
        ? clampCell(input.residualLikelihood as number) * clampCell(input.residualImpact as number)
        : null;

    return {
        inherentScore,
        inherentBand: bandFor(inherentScore),
        residualScore,
        residualBand: residualScore === null ? null : bandFor(residualScore),
    };
}

export function runFiveByFive(input: RiskFiveByFiveInput, asOf: string = '1970-01-01T00:00:00.000Z'): SkillRunResult<RiskFiveByFiveOutput> {
    const output = scoreFiveByFive(input);
    return {
        skillId: SKILL_IDS.RISK_FIVE_BY_FIVE,
        skillVersion: RISK_FIVE_BY_FIVE_VERSION,
        inputHash: hashCanonical({
            skillVersion: RISK_FIVE_BY_FIVE_VERSION,
            likelihood: clampCell(input.likelihood),
            impact: clampCell(input.impact),
            residualLikelihood: input.residualLikelihood === undefined ? null : clampCell(input.residualLikelihood),
            residualImpact: input.residualImpact === undefined ? null : clampCell(input.residualImpact),
        }),
        output,
        asOf,
    };
}
