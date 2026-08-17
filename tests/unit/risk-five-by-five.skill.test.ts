import { describe, expect, it } from 'vitest';
import { scoreFiveByFive, runFiveByFive, RISK_FIVE_BY_FIVE_VERSION } from '@/lib/skills/risk-five-by-five';

describe('skill risk.fiveByFive@1.0.0', () => {
    it('5×5 cells are deterministic and banded', () => {
        expect(scoreFiveByFive({ likelihood: 1, impact: 1 })).toEqual({
            inherentScore: 1,
            inherentBand: 'low',
            residualScore: null,
            residualBand: null,
        });
        expect(scoreFiveByFive({ likelihood: 2, impact: 3 }).inherentBand).toBe('medium');
        expect(scoreFiveByFive({ likelihood: 4, impact: 4 }).inherentBand).toBe('high');
        expect(scoreFiveByFive({ likelihood: 5, impact: 5 })).toMatchObject({
            inherentScore: 25,
            inherentBand: 'critical',
        });
    });

    it('clamps out-of-range cells instead of inventing scores', () => {
        expect(scoreFiveByFive({ likelihood: 0, impact: 99 }).inherentScore).toBe(5);
        expect(scoreFiveByFive({ likelihood: 3.4, impact: 2 }).inherentScore).toBe(6);
    });

    it('residual only when both residual axes are present', () => {
        const withResidual = scoreFiveByFive({
            likelihood: 5,
            impact: 5,
            residualLikelihood: 2,
            residualImpact: 2,
        });
        expect(withResidual.residualScore).toBe(4);
        expect(withResidual.residualBand).toBe('low');

        const partial = scoreFiveByFive({ likelihood: 5, impact: 5, residualLikelihood: 1 });
        expect(partial.residualScore).toBeNull();
        expect(partial.residualBand).toBeNull();
    });

    it('same input hash for the same skill run payload', () => {
        const a = runFiveByFive({ likelihood: 3, impact: 4 }, '2026-01-01T00:00:00.000Z');
        const b = runFiveByFive({ likelihood: 3, impact: 4 }, '2026-01-01T00:00:00.000Z');
        expect(a.skillId).toBe('risk.fiveByFive');
        expect(a.skillVersion).toBe(RISK_FIVE_BY_FIVE_VERSION);
        expect(a.inputHash).toBe(b.inputHash);
        expect(a.output.inherentScore).toBe(12);
    });
});
