import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSecFinding } from './appsec/types';

interface AppSecState {
    findings: AppSecFinding[];
    setFindings: (findings: AppSecFinding[]) => void;
    addFindings: (newFindings: AppSecFinding[]) => void;
    clearFindings: () => void;
    getMetrics: () => {
        openCriticals: number;
        grade: string;
        mttf: string; // Mean Time to Fix
        total: number;
    };
}

export const useAppSecStore = create<AppSecState>()(
    persist(
        (set, get) => ({
            findings: [],
            setFindings: (findings) => set({ findings }),
            addFindings: (newFindings) => set((state) => {
                // simple deduplication by ID
                const existingIds = new Set(state.findings.map(f => f.id));
                const filtered = newFindings.filter(f => !existingIds.has(f.id));
                return { findings: [...state.findings, ...filtered] };
            }),
            clearFindings: () => set({ findings: [] }),
            getMetrics: () => {
                const { findings } = get();
                const openCriticals = findings.filter(f => f.severity === 'CRITICAL').length;
                const high = findings.filter(f => f.severity === 'HIGH').length;

                // Calculate Grade
                let grade = 'A+';
                if (openCriticals > 5) grade = 'F';
                else if (openCriticals > 0) grade = 'D';
                else if (high > 10) grade = 'C';
                else if (high > 0) grade = 'B';

                return {
                    openCriticals,
                    grade,
                    mttf: findings.length > 0 ? '24h' : 'N/A', // Static for now 
                    total: findings.length
                };
            }
        }),
        {
            name: 'astra-appsec-store-v2' // V2 to clear out old SAST state from localstorage
        }
    )
);
