export type CanonicalAssessmentAnswer = 'YES' | 'NO' | 'PARTIAL' | 'NA' | 'UNKNOWN';

export interface AssessmentAnswerInput {
    answer?: unknown;
    answerType?: unknown;
}

/**
 * Convert a questionnaire answer to a canonical scoring state.
 *
 * Negative phrases are intentionally checked before positive phrases so
 * "not implemented" and "non-compliant" can never be classified as passes.
 * Ambiguous prose remains UNKNOWN and requires explicit normalization.
 */
export function canonicalizeAssessmentAnswer(input: AssessmentAnswerInput): CanonicalAssessmentAnswer {
    const raw = String(input.answerType ?? input.answer ?? '').trim().toUpperCase();

    if (['NO', 'FALSE', 'NOT IMPLEMENTED', 'NON-COMPLIANT', 'NONCOMPLIANT'].includes(raw)) return 'NO';
    if (['PARTIAL', 'PARTIALLY IMPLEMENTED', 'CONDITIONAL'].includes(raw)) return 'PARTIAL';
    if (['YES', 'TRUE', 'IMPLEMENTED', 'COMPLIANT'].includes(raw)) return 'YES';
    if (['NA', 'N/A', 'NOT APPLICABLE'].includes(raw)) return 'NA';
    return 'UNKNOWN';
}
