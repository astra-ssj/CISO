import { create } from 'zustand';

export type StepType = 'CHECKBOX' | 'TEXT_INPUT' | 'Manual_ACTION';

export interface PlaybookStep {
    id: string;
    instruction: string;
    type: StepType;
    isCompleted: boolean;
    evidence?: string;
}

export interface PlaybookPhase {
    id: string;
    title: string;
    steps: PlaybookStep[];
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface Playbook {
    id: string;
    title: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    phases: PlaybookPhase[];
    startTime?: number;
    endTime?: number;
    status: 'READY' | 'ACTIVE' | 'RESOLVED';
    evidenceLog: { timestamp: number; message: string }[];
}

const API = '/api/playbooks';

interface PlaybookState {
    playbooks: Playbook[];
    activePlaybookId: string | null; // UI-only, not persisted
    isLoading: boolean;
    hasFetched: boolean;
    fetchPlaybooks: () => Promise<void>;
    startPlaybook: (id: string) => Promise<void>;
    resolvePlaybook: (id: string) => Promise<void>;
    toggleStep: (playbookId: string, phaseId: string, stepId: string, evidence?: string) => Promise<void>;
    logEvidence: (playbookId: string, message: string) => Promise<void>;
    resetPlaybook: (id: string) => Promise<void>;
    createPlaybook: (playbook: Playbook) => Promise<void>;
}

export const usePlaybookStore = create<PlaybookState>()((set, get) => ({
    playbooks: [],
    activePlaybookId: null,
    isLoading: false,
    hasFetched: false,

    fetchPlaybooks: async () => {
        if (get().hasFetched) return;
        set({ isLoading: true });
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            set({ playbooks: Array.isArray(data) ? data : [], hasFetched: true, isLoading: false });
        } catch (e) {
            console.warn('Playbooks fetch failed', e);
            set({ hasFetched: true, isLoading: false });
        }
    },

    startPlaybook: async (id) => {
        const playbook = get().playbooks.find((p) => p.id === id);
        if (!playbook) return;
        set({ activePlaybookId: id });
        try {
            const res = await fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ACTIVE', startTime: Date.now() }),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            set((s) => ({
                playbooks: s.playbooks.map((p) => (p.id === id ? { ...p, ...updated, status: 'ACTIVE' as const, startTime: Date.now() } : p)),
            }));
        } catch (e) {
            console.warn('Playbook start failed', e);
        }
    },

    resolvePlaybook: async (id) => {
        set((s) => (s.activePlaybookId === id ? { activePlaybookId: null } : {}));
        try {
            const res = await fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'RESOLVED', endTime: Date.now() }),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            set((s) => ({
                playbooks: s.playbooks.map((p) => (p.id === id ? { ...p, ...updated, status: 'RESOLVED' as const, endTime: Date.now() } : p)),
            }));
        } catch (e) {
            console.warn('Playbook resolve failed', e);
        }
    },

    toggleStep: async (playbookId, phaseId, stepId, evidence) => {
        const playbook = get().playbooks.find((p) => p.id === playbookId);
        if (!playbook) return;
        const phases = playbook.phases.map((phase) => {
            if (phase.id !== phaseId) return phase;
            const updatedSteps = phase.steps.map((s) =>
                s.id === stepId ? { ...s, isCompleted: !s.isCompleted, evidence: evidence ?? s.evidence } : s
            );
            const allComplete = updatedSteps.every((s) => s.isCompleted);
            return {
                ...phase,
                steps: updatedSteps,
                status: (allComplete ? 'COMPLETED' : 'IN_PROGRESS') as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
            };
        });
        try {
            const res = await fetch(`${API}/${playbookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phases }),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            set((s) => ({
                playbooks: s.playbooks.map((p) => (p.id === playbookId ? { ...p, phases: updated.phases } : p)),
            }));
        } catch (e) {
            console.warn('Playbook toggleStep failed', e);
        }
    },

    logEvidence: async (playbookId, message) => {
        const playbook = get().playbooks.find((p) => p.id === playbookId);
        if (!playbook) return;
        const evidenceLog = [...playbook.evidenceLog, { timestamp: Date.now(), message }];
        try {
            const res = await fetch(`${API}/${playbookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evidenceLog }),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            set((s) => ({
                playbooks: s.playbooks.map((p) => (p.id === playbookId ? { ...p, evidenceLog: updated.evidenceLog } : p)),
            }));
        } catch (e) {
            console.warn('Playbook logEvidence failed', e);
        }
    },

    resetPlaybook: async (id) => {
        const playbook = get().playbooks.find((p) => p.id === id);
        if (!playbook) return;
        const phases = playbook.phases.map((ph) => ({
            ...ph,
            status: 'PENDING' as const,
            steps: ph.steps.map((s) => ({ ...s, isCompleted: false, evidence: undefined })),
        }));
        try {
            await fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phases, status: 'READY', startTime: null, endTime: null, evidenceLog: [] }),
            });
            set((s) => ({
                playbooks: s.playbooks.map((p) =>
                    p.id === id
                        ? {
                              ...p,
                              phases,
                              status: 'READY' as const,
                              startTime: undefined,
                              endTime: undefined,
                              evidenceLog: [],
                          }
                        : p
                ),
            }));
        } catch (e) {
            console.warn('Playbook reset failed', e);
        }
    },

    createPlaybook: async (playbook) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: playbook.title,
                    description: playbook.description,
                    severity: playbook.severity,
                    status: playbook.status ?? 'READY',
                    phases: playbook.phases,
                    evidenceLog: playbook.evidenceLog ?? [],
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            set((s) => ({ playbooks: [created, ...s.playbooks], hasFetched: true }));
        } catch (e) {
            console.warn('Playbook create failed', e);
        }
    },
}));
