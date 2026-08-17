import { hashCanonical } from './hash';
import { SKILL_IDS, type SkillRunResult } from './types';
import { calculateGrade, generateAssessment } from '@/lib/exercises/scoring';
import type { FinalAssessment, Scenario, SessionState } from '@/lib/exercises/types';

export const TABLETOP_SCORE_VERSION = '1.0.0';

export interface TabletopScoreInput {
    state: SessionState;
    scenario: Pick<Scenario, 'id' | 'slug' | 'title'>;
}

export interface TabletopScoreOutput {
    grade: FinalAssessment['grade'];
    totalDollars: number;
    finalRepInternal: number;
    finalRepExternal: number;
    strengths: string[];
    failures: string[];
    recommendations: string[];
}

/**
 * Deterministic tabletop score from stored session decisions.
 * Clock is not used. Same history → same grade and lists.
 */
export function scoreTabletop(input: TabletopScoreInput): TabletopScoreOutput {
    const assessment = generateAssessment(input.state, input.scenario as Scenario);
    return {
        grade: assessment.grade,
        totalDollars: assessment.totalDollars,
        finalRepInternal: assessment.finalRepInternal,
        finalRepExternal: assessment.finalRepExternal,
        strengths: assessment.strengths,
        failures: assessment.failures,
        recommendations: assessment.recommendations,
    };
}

export function runTabletopScore(input: TabletopScoreInput, asOf: string = '1970-01-01T00:00:00.000Z'): SkillRunResult<TabletopScoreOutput> {
    const output = scoreTabletop(input);
    return {
        skillId: SKILL_IDS.TABLETOP_SCORE,
        skillVersion: TABLETOP_SCORE_VERSION,
        inputHash: hashCanonical({
            skillVersion: TABLETOP_SCORE_VERSION,
            scenarioId: input.scenario.id,
            dollars: input.state.dollars,
            repInternal: input.state.repInternal,
            repExternal: input.state.repExternal,
            history: input.state.history.map((h) => ({
                stepId: h.stepId,
                choiceId: h.choiceId,
                dollars: h.dollars,
                repInt: h.repInt,
                repExt: h.repExt,
            })),
        }),
        output,
        asOf,
    };
}

export { calculateGrade };
