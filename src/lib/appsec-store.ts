import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SASTFinding } from './sast-engine';

interface AppSecState {
    findings: SASTFinding[];
    setFindings: (findings: SASTFinding[]) => void;
    clearFindings: () => void;
    // Helper to get stats
    getStats: () => {
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
    };
}

export const useAppSecStore = create<AppSecState>()(
    persist(
        (set, get) => ({
            findings: [],
            setFindings: (findings) => set({ findings }),
            clearFindings: () => set({ findings: [] }),
            getStats: () => {
                const { findings } = get();
                return {
                    critical: findings.filter(f => f.severity === 'CRITICAL').length,
                    high: findings.filter(f => f.severity === 'HIGH').length,
                    medium: findings.filter(f => f.severity === 'MEDIUM').length,
                    low: findings.filter(f => f.severity === 'LOW').length,
                    total: findings.length
                };
            }
        }),
        {
            name: 'astra-appsec-store'
        }
    )
);
