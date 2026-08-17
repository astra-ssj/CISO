import { hashCanonical } from './hash';
import { SKILL_IDS, type SkillRunResult } from './types';

export const CAIQ_DRAFT_VERSION = '1.0.0';

export interface CaiqDraftInput {
    questionText: string;
    draftText: string;
}

export interface CaiqDraftOutput {
    questionText: string;
    text: string;
    source: 'ai_draft';
    canCloseDecision: false;
}

/**
 * LLM output envelope. Does not call a model.
 * Callers pass model text in; this skill only labels it so it cannot become canonical.
 */
export function labelCaiqDraft(input: CaiqDraftInput): CaiqDraftOutput {
    return {
        questionText: input.questionText,
        text: input.draftText,
        source: 'ai_draft',
        canCloseDecision: false,
    };
}

export function runCaiqDraft(input: CaiqDraftInput, asOf: string = '1970-01-01T00:00:00.000Z'): SkillRunResult<CaiqDraftOutput> {
    const output = labelCaiqDraft(input);
    return {
        skillId: SKILL_IDS.CAIQ_DRAFT,
        skillVersion: CAIQ_DRAFT_VERSION,
        inputHash: hashCanonical({
            skillVersion: CAIQ_DRAFT_VERSION,
            questionText: input.questionText,
            draftText: input.draftText,
        }),
        output,
        asOf,
    };
}
