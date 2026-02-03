import { create } from 'zustand';

export interface ActiveConstraint {
    id: string;
    sourceClauseId: string;
    name: string;
    description: string;
    // For demo purposes, we will hardcode which nodes are affected
    affectedNodeIds: string[];
    severity: 'critical' | 'high' | 'medium' | 'low';
}

interface UnificationState {
    activeConstraints: ActiveConstraint[];
    enforceConstraint: (constraint: ActiveConstraint) => void;
    clearConstraints: () => void;
}

export const useUnificationStore = create<UnificationState>((set) => ({
    activeConstraints: [],
    enforceConstraint: (constraint) => set((state) => ({
        activeConstraints: [...state.activeConstraints, constraint]
    })),
    clearConstraints: () => set({ activeConstraints: [] }),
}));
