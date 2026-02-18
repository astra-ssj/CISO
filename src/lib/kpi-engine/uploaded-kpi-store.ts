import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KPICategory, KPIHealth, KPITrend } from './kpi-engine';

export interface UploadedKPI {
    id: string;
    name: string;
    value: number;
    unit: string;
    target: number;
    category: KPICategory;
    health: KPIHealth;
    trend: KPITrend;
    sourceFile: string;
    uploadedAt: string;
}

interface UploadedKPIState {
    uploadedKPIs: UploadedKPI[];
    addKPIs: (kpis: UploadedKPI[]) => void;
    removeKPI: (id: string) => void;
    updateKPI: (id: string, updates: Partial<UploadedKPI>) => void;
    clearAll: () => void;
}

export const useUploadedKPIStore = create<UploadedKPIState>()(
    persist(
        (set) => ({
            uploadedKPIs: [],

            addKPIs: (kpis) => set(state => ({
                uploadedKPIs: [
                    ...state.uploadedKPIs,
                    ...kpis.filter(k => !state.uploadedKPIs.some(existing => existing.id === k.id)),
                ],
            })),

            removeKPI: (id) => set(state => ({
                uploadedKPIs: state.uploadedKPIs.filter(k => k.id !== id),
            })),

            updateKPI: (id, updates) => set(state => ({
                uploadedKPIs: state.uploadedKPIs.map(k =>
                    k.id === id ? { ...k, ...updates } : k
                ),
            })),

            clearAll: () => set({ uploadedKPIs: [] }),
        }),
        { name: 'astra-uploaded-kpis' }
    )
);
