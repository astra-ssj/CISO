import { describe, expect, it } from 'vitest';
import { labelCaiqDraft, runCaiqDraft } from '@/lib/skills/caiq-draft';

describe('skill caiq.draft@1.0.0', () => {
    it('labels LLM text as ai_draft and cannot close a decision', () => {
        const out = labelCaiqDraft({
            questionText: 'Is MFA required?',
            draftText: 'Yes, we require MFA.',
        });
        expect(out.source).toBe('ai_draft');
        expect(out.canCloseDecision).toBe(false);
        expect(out.text).toBe('Yes, we require MFA.');
    });

    it('same input hash for the same draft', () => {
        const input = { questionText: 'Q', draftText: 'A' };
        const a = runCaiqDraft(input, '2026-01-01T00:00:00.000Z');
        const b = runCaiqDraft(input, '2026-01-01T00:00:00.000Z');
        expect(a.skillId).toBe('caiq.draft');
        expect(a.inputHash).toBe(b.inputHash);
        expect(a.output.canCloseDecision).toBe(false);
    });
});
