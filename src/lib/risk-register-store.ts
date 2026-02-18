import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateRisk, type RiskScenario, type RiskAnalysisResult } from '@/lib/risk-engine/fair';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface RiskHistoryPoint {
    date: string;
    score: number;
    ale: number;
}

export interface RiskEntry {
    id: string;
    scenario: RiskScenario;
    analysis: RiskAnalysisResult;
    owner: string;
    notes: string;
    status: 'OPEN' | 'MITIGATING' | 'ACCEPTED' | 'CLOSED';
    history: RiskHistoryPoint[];
    createdAt: string;
    updatedAt: string;
}

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

interface RiskRegisterStore {
    entries: RiskEntry[];
    addEntry: (scenario: RiskScenario, owner: string, notes: string) => void;
    updateEntry: (id: string, updates: Partial<Pick<RiskEntry, 'owner' | 'notes' | 'status'>>) => void;
    removeEntry: (id: string) => void;
    recalculate: (id: string, updatedScenario: RiskScenario) => void;
    getTopRisks: (count: number) => RiskEntry[];
    getAverageScore: () => number;
}

// ────────────────────────────────────────────
// Demo Data — matches FAIR engine's RiskScenario interface
// ────────────────────────────────────────────

const DEMO_SCENARIOS: { scenario: RiskScenario; owner: string; notes: string; status: RiskEntry['status']; history: RiskHistoryPoint[] }[] = [
    {
        scenario: {
            id: 'RS-001', assetName: 'Production Infrastructure',
            threatActor: 'CYBER_CRIMINAL',
            threatEventFrequency: 2.5,
            vulnerability: 0.3,
            primaryLoss: 2000000,
            secondaryLoss: 1500000,
            controlsEffective: 0.5
        },
        owner: 'CISO', notes: 'Ransomware scenario — enhancing EDR coverage.', status: 'MITIGATING',
        history: [
            { date: '2025-11-01', score: 78, ale: 420000 },
            { date: '2025-12-01', score: 72, ale: 380000 },
            { date: '2026-01-01', score: 68, ale: 340000 },
            { date: '2026-02-01', score: 65, ale: 310000 },
        ]
    },
    {
        scenario: {
            id: 'RS-002', assetName: 'Vendor Data Pipeline',
            threatActor: 'CYBER_CRIMINAL',
            threatEventFrequency: 3.0,
            vulnerability: 0.5,
            primaryLoss: 800000,
            secondaryLoss: 700000,
            controlsEffective: 0.3
        },
        owner: 'VP Engineering', notes: 'Third-party breach risk. Vendor assessment in progress.', status: 'OPEN',
        history: [
            { date: '2025-11-01', score: 82, ale: 510000 },
            { date: '2025-12-01', score: 85, ale: 530000 },
            { date: '2026-01-01', score: 80, ale: 490000 },
            { date: '2026-02-01', score: 77, ale: 470000 },
        ]
    },
    {
        scenario: {
            id: 'RS-003', assetName: 'Confidential Employee Data',
            threatActor: 'INSIDER',
            threatEventFrequency: 1.0,
            vulnerability: 0.25,
            primaryLoss: 500000,
            secondaryLoss: 1500000,
            controlsEffective: 0.6
        },
        owner: 'HR Director', notes: 'Insider threat. DLP deployed and monitoring.', status: 'MITIGATING',
        history: [
            { date: '2025-11-01', score: 45, ale: 110000 },
            { date: '2025-12-01', score: 42, ale: 95000 },
            { date: '2026-01-01', score: 38, ale: 80000 },
            { date: '2026-02-01', score: 35, ale: 70000 },
        ]
    },
    {
        scenario: {
            id: 'RS-004', assetName: 'Cloud Infrastructure (AWS)',
            threatActor: 'SCRIPT_KIDDIE',
            threatEventFrequency: 10.0,
            vulnerability: 0.15,
            primaryLoss: 200000,
            secondaryLoss: 300000,
            controlsEffective: 0.4
        },
        owner: 'Cloud Architect', notes: 'Misconfiguration exposure. CSPM tool deployment in progress.', status: 'OPEN',
        history: [
            { date: '2026-01-01', score: 70, ale: 175000 },
            { date: '2026-02-01', score: 67, ale: 160000 },
        ]
    },
    {
        scenario: {
            id: 'RS-005', assetName: 'Customer PII Database',
            threatActor: 'NATION_STATE',
            threatEventFrequency: 0.5,
            vulnerability: 0.2,
            primaryLoss: 1000000,
            secondaryLoss: 3000000,
            controlsEffective: 0.7
        },
        owner: 'DPO', notes: 'GDPR regulatory risk. DPIA completed. Article 30 ROPA maintained.', status: 'ACCEPTED',
        history: [
            { date: '2025-11-01', score: 30, ale: 90000 },
            { date: '2025-12-01', score: 28, ale: 80000 },
            { date: '2026-01-01', score: 25, ale: 72000 },
            { date: '2026-02-01', score: 22, ale: 65000 },
        ]
    }
];

function buildEntry(data: typeof DEMO_SCENARIOS[0]): RiskEntry {
    const analysis = calculateRisk(data.scenario);
    return {
        id: data.scenario.id,
        scenario: data.scenario,
        analysis,
        owner: data.owner,
        notes: data.notes,
        status: data.status,
        history: data.history,
        createdAt: data.history[0]?.date || new Date().toISOString().split('T')[0],
        updatedAt: data.history[data.history.length - 1]?.date || new Date().toISOString().split('T')[0]
    };
}

export const useRiskRegisterStore = create<RiskRegisterStore>()(
    persist(
        (set, get) => ({
            entries: DEMO_SCENARIOS.map(buildEntry),

            addEntry: (scenario, owner, notes) => {
                const analysis = calculateRisk(scenario);
                const today = new Date().toISOString().split('T')[0];
                set((state) => ({
                    entries: [...state.entries, {
                        id: scenario.id || `RS-${Date.now()}`,
                        scenario, analysis, owner, notes,
                        status: 'OPEN' as const,
                        history: [{ date: today, score: analysis.riskScore, ale: analysis.annualizedLossExpectancy }],
                        createdAt: today, updatedAt: today
                    }]
                }));
            },

            updateEntry: (id, updates) => set((state) => ({
                entries: state.entries.map(e =>
                    e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : e
                )
            })),

            removeEntry: (id) => set((state) => ({
                entries: state.entries.filter(e => e.id !== id)
            })),

            recalculate: (id, updatedScenario) => set((state) => {
                const analysis = calculateRisk(updatedScenario);
                const today = new Date().toISOString().split('T')[0];
                return {
                    entries: state.entries.map(e => {
                        if (e.id !== id) return e;
                        return {
                            ...e, scenario: updatedScenario, analysis, updatedAt: today,
                            history: [...e.history, { date: today, score: analysis.riskScore, ale: analysis.annualizedLossExpectancy }]
                        };
                    })
                };
            }),

            getTopRisks: (count) => [...get().entries]
                .filter(e => e.status !== 'CLOSED')
                .sort((a, b) => b.analysis.riskScore - a.analysis.riskScore)
                .slice(0, count),

            getAverageScore: () => {
                const entries = get().entries.filter(e => e.status !== 'CLOSED');
                if (entries.length === 0) return 0;
                return Math.round(entries.reduce((sum, e) => sum + e.analysis.riskScore, 0) / entries.length);
            }
        }),
        { name: 'aegis-risk-register-store' }
    )
);
