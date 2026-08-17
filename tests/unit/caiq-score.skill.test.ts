import { describe, expect, it } from 'vitest';
import { scoreCaiq, runCaiqScore, CAIQ_SCORE_VERSION } from '@/lib/skills/caiq-score';
import { matchCaiq } from '@/lib/skills/caiq-match';

const kb = [
    {
        id: 'kb-iam-mfa',
        questionNormalized: 'is multi factor authentication required for all remote access',
        keywords: 'mfa,remote,access',
        answerText: 'Yes. MFA is required for all remote access via SSO.',
        answerType: 'YES',
        evidence: 'Policy-IAM-01',
    },
];

describe('skill caiq.score@1.0.0', () => {
    it('computes coverage from match hits deterministically', () => {
        const hits = matchCaiq({
            questions: [
                { questionText: 'Is multi-factor authentication required for all remote access?' },
                { questionText: 'What is the cafeteria lunch menu?' },
            ],
            entries: kb,
            minConfidence: 90,
        });

        const first = scoreCaiq({ hits });
        const second = scoreCaiq({ hits });

        expect(first).toEqual(second);
        expect(first.total).toBe(2);
        expect(first.matched).toBe(1);
        expect(first.unmatched).toBe(1);
        expect(first.coveragePct).toBe(50);
        expect(first.band).toBe('partial');
        expect(first.byTier.t1).toBe(1);
        expect(first.byTier.t0).toBe(1);
    });

    it('same input hash for the same skill run payload', () => {
        const hits = [{ entryId: 'a', confidence: 'high' as const, matchTier: 1 as const }];
        const a = runCaiqScore({ hits }, '2026-01-01T00:00:00.000Z');
        const b = runCaiqScore({ hits }, '2026-01-01T00:00:00.000Z');
        expect(a.skillId).toBe('caiq.score');
        expect(a.skillVersion).toBe(CAIQ_SCORE_VERSION);
        expect(a.inputHash).toBe(b.inputHash);
        expect(a.output.coveragePct).toBe(100);
        expect(a.output.band).toBe('complete');
    });

    it('empty questionnaire is none / 0%', () => {
        const out = scoreCaiq({ hits: [] });
        expect(out.coveragePct).toBe(0);
        expect(out.band).toBe('none');
        expect(out.total).toBe(0);
    });
});
