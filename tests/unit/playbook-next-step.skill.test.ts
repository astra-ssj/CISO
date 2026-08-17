import { describe, expect, it } from 'vitest';
import { nextPlaybookStep, runPlaybookNextStep } from '@/lib/skills/playbook-next-step';

const phases = [
    {
        id: 'p1',
        title: 'Triage',
        steps: [
            { id: '1.1', instruction: 'Verify scope', isCompleted: true },
            { id: '1.2', instruction: 'Assign commander', isCompleted: false },
        ],
    },
    {
        id: 'p2',
        title: 'Contain',
        steps: [{ id: '2.1', instruction: 'Isolate hosts', isCompleted: false }],
    },
];

describe('skill playbook.nextStep@1.0.0', () => {
    it('returns the first incomplete checkbox', () => {
        const out = nextPlaybookStep({ playbookId: 'pb-1', phases });
        expect(out.done).toBe(false);
        expect(out.stepId).toBe('1.2');
        expect(out.instruction).toBe('Assign commander');
    });

    it('is done when every step is complete', () => {
        const done = nextPlaybookStep({
            playbookId: 'pb-1',
            phases: phases.map((p) => ({
                ...p,
                steps: p.steps.map((s) => ({ ...s, isCompleted: true })),
            })),
        });
        expect(done.done).toBe(true);
        expect(done.stepId).toBeNull();
    });

    it('same input hash for the same phases', () => {
        const a = runPlaybookNextStep({ playbookId: 'pb-1', phases }, '2026-01-01T00:00:00.000Z');
        const b = runPlaybookNextStep({ playbookId: 'pb-1', phases }, '2026-01-01T00:00:00.000Z');
        expect(a.inputHash).toBe(b.inputHash);
        expect(a.output).toEqual(b.output);
    });
});
