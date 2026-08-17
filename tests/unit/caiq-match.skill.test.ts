import { describe, expect, it } from 'vitest';
import { matchCaiq, runCaiqMatch, CAIQ_MATCH_VERSION } from '@/lib/skills/caiq-match';

const kb = [
    {
        id: 'kb-iam-mfa',
        questionNormalized: 'is multi factor authentication required for all remote access',
        keywords: 'mfa,remote,access',
        answerText: 'Yes. MFA is required for all remote access via SSO.',
        answerType: 'YES',
        evidence: 'Policy-IAM-01',
    },
    {
        id: 'kb-enc',
        questionNormalized: 'is data encrypted at rest',
        keywords: 'encryption,at rest,aes',
        answerText: 'Yes. AES-256 at rest for all datastores.',
        answerType: 'YES',
        evidence: 'SOC2-CC6.1',
    },
];

describe('skill caiq.match@1.0.0', () => {
    it('exact normalized match is deterministic and high confidence', () => {
        const first = matchCaiq({
            questions: [{ questionText: 'Is multi-factor authentication required for all remote access?' }],
            entries: kb,
        });
        const second = matchCaiq({
            questions: [{ questionText: 'Is multi-factor authentication required for all remote access?' }],
            entries: kb,
        });

        expect(first).toEqual(second);
        expect(first[0].entryId).toBe('kb-iam-mfa');
        expect(first[0].matchTier).toBe(1);
        expect(first[0].confidence).toBe('high');
        expect(first[0].answer).toContain('MFA');
    });

    it('same input hash for the same skill run payload', () => {
        const a = runCaiqMatch({
            questions: [{ questionText: 'Is data encrypted at rest?' }],
            entries: kb,
        }, '2026-01-01T00:00:00.000Z');
        const b = runCaiqMatch({
            questions: [{ questionText: 'Is data encrypted at rest?' }],
            entries: kb,
        }, '2026-01-01T00:00:00.000Z');

        expect(a.skillId).toBe('caiq.match');
        expect(a.skillVersion).toBe(CAIQ_MATCH_VERSION);
        expect(a.inputHash).toBe(b.inputHash);
        expect(a.output).toEqual(b.output);
        expect(a.output[0].entryId).toBe('kb-enc');
    });

    it('returns empty answer when nothing meets minConfidence', () => {
        const hits = matchCaiq({
            questions: [{ questionText: 'What is the cafeteria lunch menu?' }],
            entries: kb,
            minConfidence: 90,
        });
        expect(hits[0].entryId).toBeNull();
        expect(hits[0].answer).toBe('');
        expect(hits[0].matchTier).toBe(0);
    });
});
