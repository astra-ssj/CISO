import { hashCanonical } from './hash';
import { SKILL_IDS, type SkillRunResult } from './types';

export const PLAYBOOK_NEXT_STEP_VERSION = '1.0.0';

export interface PlaybookStep {
    id: string;
    instruction: string;
    isCompleted: boolean;
}

export interface PlaybookPhase {
    id: string;
    title: string;
    steps: PlaybookStep[];
}

export interface PlaybookNextStepInput {
    playbookId: string;
    phases: PlaybookPhase[];
}

export interface PlaybookNextStepOutput {
    playbookId: string;
    done: boolean;
    phaseId: string | null;
    phaseTitle: string | null;
    stepId: string | null;
    instruction: string | null;
}

/**
 * Next incomplete checkbox from stored Playbook.phases JSON.
 * First incomplete step in phase order. No I/O.
 */
export function nextPlaybookStep(input: PlaybookNextStepInput): PlaybookNextStepOutput {
    for (const phase of input.phases) {
        for (const step of phase.steps) {
            if (!step.isCompleted) {
                return {
                    playbookId: input.playbookId,
                    done: false,
                    phaseId: phase.id,
                    phaseTitle: phase.title,
                    stepId: step.id,
                    instruction: step.instruction,
                };
            }
        }
    }
    return {
        playbookId: input.playbookId,
        done: true,
        phaseId: null,
        phaseTitle: null,
        stepId: null,
        instruction: null,
    };
}

export function runPlaybookNextStep(input: PlaybookNextStepInput, asOf: string = '1970-01-01T00:00:00.000Z'): SkillRunResult<PlaybookNextStepOutput> {
    const output = nextPlaybookStep(input);
    return {
        skillId: SKILL_IDS.PLAYBOOK_NEXT_STEP,
        skillVersion: PLAYBOOK_NEXT_STEP_VERSION,
        inputHash: hashCanonical({
            skillVersion: PLAYBOOK_NEXT_STEP_VERSION,
            playbookId: input.playbookId,
            phases: input.phases.map((p) => ({
                id: p.id,
                title: p.title,
                steps: p.steps.map((s) => ({
                    id: s.id,
                    instruction: s.instruction,
                    isCompleted: s.isCompleted,
                })),
            })),
        }),
        output,
        asOf,
    };
}
