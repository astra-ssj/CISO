import { describe, expect, it } from 'vitest';
import { canonicalizeAnswer } from '@/app/api/vendors/[id]/finalize-assessment/route';

describe('vendor assessment answer normalization', () => {
    it('never treats negative implementation language as passing', () => {
        expect(canonicalizeAnswer({ answer: 'not implemented' })).toBe('NO');
        expect(canonicalizeAnswer({ answer: 'non-compliant' })).toBe('NO');
        expect(canonicalizeAnswer({ answer: 'false' })).toBe('NO');
    });

    it('accepts only canonical positive states as yes', () => {
        expect(canonicalizeAnswer({ answer: 'implemented' })).toBe('YES');
        expect(canonicalizeAnswer({ answer: 'compliant' })).toBe('YES');
        expect(canonicalizeAnswer({ answer: 'yes' })).toBe('YES');
    });

    it('does not infer a pass from arbitrary prose', () => {
        expect(canonicalizeAnswer({ answer: 'We have a compensating control documented elsewhere.' })).toBe('UNKNOWN');
        expect(canonicalizeAnswer({ answer: 'This needs additional review by the platform team.' })).toBe('UNKNOWN');
    });

    it('prefers explicit answerType over free-text answer', () => {
        expect(canonicalizeAnswer({ answerType: 'NO', answer: 'implemented' })).toBe('NO');
        expect(canonicalizeAnswer({ answerType: 'PARTIAL', answer: 'yes' })).toBe('PARTIAL');
    });

    it('handles N/A without inflating the score', () => {
        expect(canonicalizeAnswer({ answer: 'N/A' })).toBe('NA');
    });
});
