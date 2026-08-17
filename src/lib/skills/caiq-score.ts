import { hashCanonical } from './hash';
import { SKILL_IDS, type SkillRunResult } from './types';
import type { CaiqMatchHit } from './caiq-match';

export const CAIQ_SCORE_VERSION = '1.0.0';

export interface CaiqScoreInput {
    hits: Pick<CaiqMatchHit, 'entryId' | 'confidence' | 'matchTier'>[];
}

export type CaiqScoreBand = 'none' | 'partial' | 'majority' | 'complete';

export interface CaiqScoreOutput {
    total: number;
    matched: number;
    unmatched: number;
    coveragePct: number;
    band: CaiqScoreBand;
    byConfidence: { high: number; medium: number; low: number };
    byTier: { t0: number; t1: number; t2: number; t3: number };
}

function bandFor(coveragePct: number, total: number): CaiqScoreBand {
    if (total === 0 || coveragePct === 0) return 'none';
    if (coveragePct >= 100) return 'complete';
    if (coveragePct >= 70) return 'majority';
    return 'partial';
}

/**
 * Deterministic coverage score from caiq.match hits.
 * No I/O, no clock, no LLM. Same hits → same score.
 */
export function scoreCaiq(input: CaiqScoreInput): CaiqScoreOutput {
    const total = input.hits.length;
    const byConfidence = { high: 0, medium: 0, low: 0 };
    const byTier = { t0: 0, t1: 0, t2: 0, t3: 0 };

    let matched = 0;
    for (const hit of input.hits) {
        if (hit.entryId) matched += 1;
        byConfidence[hit.confidence] += 1;
        if (hit.matchTier === 1) byTier.t1 += 1;
        else if (hit.matchTier === 2) byTier.t2 += 1;
        else if (hit.matchTier === 3) byTier.t3 += 1;
        else byTier.t0 += 1;
    }

    const coveragePct = total === 0 ? 0 : Math.round((matched / total) * 10000) / 100;

    return {
        total,
        matched,
        unmatched: total - matched,
        coveragePct,
        band: bandFor(coveragePct, total),
        byConfidence,
        byTier,
    };
}

export function runCaiqScore(input: CaiqScoreInput, asOf: string = '1970-01-01T00:00:00.000Z'): SkillRunResult<CaiqScoreOutput> {
    const output = scoreCaiq(input);
    return {
        skillId: SKILL_IDS.CAIQ_SCORE,
        skillVersion: CAIQ_SCORE_VERSION,
        inputHash: hashCanonical({
            skillVersion: CAIQ_SCORE_VERSION,
            hits: input.hits.map((h) => ({
                entryId: h.entryId,
                confidence: h.confidence,
                matchTier: h.matchTier,
            })),
        }),
        output,
        asOf,
    };
}
