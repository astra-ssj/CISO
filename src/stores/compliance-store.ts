import { create } from 'zustand';
import { FrameworkControl, generateMockControls } from '@/lib/compliance-data';

interface ComplianceState {
    controls: FrameworkControl[];
    overallScore: number;
    auditMode: boolean;
    initialize: () => void;
    toggleAuditMode: (active: boolean) => void;
    fixControl: (id: string) => void;
    breakControl: (id: string) => void;
    refreshStatus: () => void;
}

export const useComplianceStore = create<ComplianceState>((set, get) => ({
    controls: [],
    overallScore: 0,
    auditMode: false,

    initialize: () => {
        const initialControls = generateMockControls();
        set({
            controls: initialControls,
            overallScore: calculateScore(initialControls)
        });
    },

    toggleAuditMode: (active) => set({ auditMode: active }),

    fixControl: (id) => {
        set((state) => {
            const newControls = state.controls.map(c =>
                c.id === id ? { ...c, status: 'COMPLIANT' as const, failureReason: undefined, evidenceCount: c.evidenceCount + 1 } : c
            );
            return { controls: newControls, overallScore: calculateScore(newControls) };
        });
    },

    breakControl: (id) => {
        set((state) => {
            const newControls = state.controls.map(c =>
                c.id === id ? { ...c, status: 'NON_COMPLIANT' as const, failureReason: 'Simulated failure triggered' } : c
            );
            return { controls: newControls, overallScore: calculateScore(newControls) };
        });
    },

    refreshStatus: () => {
        // Randomly flip a few controls to simulate live environment noise
        set((state) => {
            const newControls = state.controls.map(c => {
                if (Math.random() > 0.95) { // 5% chance to change status
                    const roll = Math.random();
                    if (roll > 0.8) return { ...c, status: 'NON_COMPLIANT' as const, failureReason: 'Random chaos monkey failure' };
                    return { ...c, status: 'COMPLIANT' as const, failureReason: undefined };
                }
                return c;
            });
            return { controls: newControls, overallScore: calculateScore(newControls) };
        });
    }
}));

const calculateScore = (controls: FrameworkControl[]) => {
    if (controls.length === 0) return 0;
    const compliant = controls.filter(c => c.status === 'COMPLIANT').length;
    return Math.round((compliant / controls.length) * 100);
};
