/**
 * Aegis v2 — OKR & Project Store (API-backed, no localStorage)
 */

import { create } from 'zustand';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export type OKRStatus = 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED' | 'CANCELLED';
export type ProjectPhaseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface KeyResult {
    id: string;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    linkedKPI?: string;
    isAutoTracked: boolean;
    status: OKRStatus;
    notes?: string;
}

export interface Objective {
    id: string;
    title: string;
    description: string;
    quarter: Quarter;
    year: number;
    owner: string;
    status: OKRStatus;
    keyResults: KeyResult[];
    linkedRisks?: string[];
}

export interface Milestone {
    id: string;
    title: string;
    dueDate: string;
    completedDate?: string;
    status: ProjectPhaseStatus;
}

export interface ProjectPhase {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: ProjectPhaseStatus;
    milestones: Milestone[];
    progress: number;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    owner: string;
    status: ProjectPhaseStatus;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    budgetAllocated: number;
    budgetSpent: number;
    phases: ProjectPhase[];
    linkedObjectives: string[];
    linkedRisks: string[];
    startDate: string;
    targetEndDate: string;
    tags: string[];
}

const API = '/api/okr';

interface OKRProjectStore {
    objectives: Objective[];
    projects: Project[];
    isLoading: boolean;
    hasFetched: boolean;
    fetchOKR: () => Promise<void>;
    addObjective: (obj: Objective) => Promise<void>;
    updateKeyResult: (objId: string, krId: string, value: number) => Promise<void>;
    addProject: (proj: Project) => Promise<void>;
    updateProjectPhase: (projId: string, phaseId: string, status: ProjectPhaseStatus, progress: number) => Promise<void>;
    getOKRProgress: (objId: string) => number;
    getOverallOKRHealth: () => { onTrack: number; atRisk: number; behind: number };
    getProjectBurndown: (projId: string) => { allocated: number; spent: number; percentage: number };
}

export const useOKRProjectStore = create<OKRProjectStore>()((set, get) => ({
    objectives: [],
    projects: [],
    isLoading: false,
    hasFetched: false,

    fetchOKR: async () => {
        if (get().hasFetched) return;
        set({ isLoading: true });
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            set({
                objectives: data.objectives ?? [],
                projects: data.projects ?? [],
                hasFetched: true,
                isLoading: false,
            });
        } catch (e) {
            console.warn('OKR fetch failed', e);
            set({ hasFetched: true, isLoading: false });
        }
    },

    addObjective: async (obj) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ objective: obj }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            if (data.objectives?.[0]) set((s) => ({ objectives: [data.objectives[0], ...s.objectives], hasFetched: true }));
        } catch (e) {
            console.warn('OKR addObjective failed', e);
        }
    },

    updateKeyResult: async (objId, krId, value) => {
        const obj = get().objectives.find((o) => o.id === objId);
        if (!obj) return;
        const keyResults = obj.keyResults.map((kr) => (kr.id === krId ? { ...kr, currentValue: value } : kr));
        try {
            const res = await fetch(`${API}/objectives/${objId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyResults }),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            set((s) => ({
                objectives: s.objectives.map((o) => (o.id === objId ? { ...o, keyResults: updated.keyResults } : o)),
            }));
        } catch (e) {
            console.warn('OKR updateKeyResult failed', e);
        }
    },

    addProject: async (proj) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: {
                        ...proj,
                        linkedObjectives: proj.linkedObjectives ?? [],
                        linkedRisks: proj.linkedRisks ?? [],
                        tags: proj.tags ?? [],
                        phases: proj.phases ?? [],
                    },
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            if (data.projects?.[0]) set((s) => ({ projects: [data.projects[0], ...s.projects], hasFetched: true }));
        } catch (e) {
            console.warn('OKR addProject failed', e);
        }
    },

    updateProjectPhase: async (projId, phaseId, status, progress) => {
        const proj = get().projects.find((p) => p.id === projId);
        if (!proj) return;
        const phases = proj.phases.map((ph) => (ph.id === phaseId ? { ...ph, status, progress } : ph));
        try {
            const res = await fetch(`${API}/projects/${projId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phases }),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            set((s) => ({
                projects: s.projects.map((p) => (p.id === projId ? { ...p, phases: updated.phases } : p)),
            }));
        } catch (e) {
            console.warn('OKR updateProjectPhase failed', e);
        }
    },

    getOKRProgress: (objId) => {
        const obj = get().objectives.find((o) => o.id === objId);
        if (!obj || obj.keyResults.length === 0) return 0;
        return Math.round(
            obj.keyResults.reduce((sum, kr) => {
                const progress = Math.min(100, (kr.currentValue / kr.targetValue) * 100);
                return sum + progress;
            }, 0) / obj.keyResults.length
        );
    },

    getOverallOKRHealth: () => {
        const objs = get().objectives;
        return {
            onTrack: objs.filter((o) => o.status === 'ON_TRACK').length,
            atRisk: objs.filter((o) => o.status === 'AT_RISK').length,
            behind: objs.filter((o) => o.status === 'BEHIND').length,
        };
    },

    getProjectBurndown: (projId) => {
        const proj = get().projects.find((p) => p.id === projId);
        if (!proj) return { allocated: 0, spent: 0, percentage: 0 };
        return {
            allocated: proj.budgetAllocated,
            spent: proj.budgetSpent,
            percentage: Math.round((proj.budgetSpent / proj.budgetAllocated) * 100) || 0,
        };
    },
}));
