import { describe, expect, it } from 'vitest';
import { canonicalizeAssessmentAnswer } from '@/lib/caiq/answer-normalizer';

describe('vendor assessment answer normalization', () => {
    it('never treats negative implementation language as passing', () => {
        expect(canonicalizeAssessmentAnswer({ answer: 'not implemented' })).toBe('NO');
        expect(canonicalizeAssessmentAnswer({ answer: 'non-compliant' })).toBe('NO');
        expect(canonicalizeAssessmentAnswer({ answer: 'false' })).toBe('NO');
    });

    it('accepts only canonical positive states as yes', () => {
        expect(canonicalizeAssessmentAnswer({ answer: 'implemented' })).toBe('YES');
        expect(canonicalizeAssessmentAnswer({ answer: 'compliant' })).toBe('YES');
        expect(canonicalizeAssessmentAnswer({ answer: 'yes' })).toBe('YES');
    });

    it('does not infer a pass from arbitrary prose', () => {
        expect(canonicalizeAssessmentAnswer({ answer: 'We have a compensating control documented elsewhere.' })).toBe('UNKNOWN');
        expect(canonicalizeAssessmentAnswer({ answer: 'This needs additional review by the platform team.' })).toBe('UNKNOWN');
    });

    it('prefers explicit answerType over free-text answer', () => {
        expect(canonicalizeAssessmentAnswer({ answerType: 'NO', answer: 'implemented' })).toBe('NO');
        expect(canonicalizeAssessmentAnswer({ answerType: 'PARTIAL', answer: 'yes' })).toBe('PARTIAL');
    });

    it('handles N/A without inflating the score', () => {
        expect(canonicalizeAssessmentAnswer({ answer: 'N/A' })).toBe('NA');
    });
});
