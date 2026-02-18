/**
 * Aegis v2 — OKR & Project Store
 * 
 * Tracks Objectives, Key Results, Projects, and Milestones.
 * Key Results auto-link to KPIs where applicable.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    unit: string;               // '%', 'count', 'days', 'score'
    linkedKPI?: string;         // Auto-populates from KPI engine
    isAutoTracked: boolean;     // If true, value comes from KPI
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
    progress: number;           // 0-100
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

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

interface OKRProjectStore {
    objectives: Objective[];
    projects: Project[];
    addObjective: (obj: Objective) => void;
    updateKeyResult: (objId: string, krId: string, value: number) => void;
    addProject: (proj: Project) => void;
    updateProjectPhase: (projId: string, phaseId: string, status: ProjectPhaseStatus, progress: number) => void;
    getOKRProgress: (objId: string) => number;
    getOverallOKRHealth: () => { onTrack: number; atRisk: number; behind: number };
    getProjectBurndown: (projId: string) => { allocated: number; spent: number; percentage: number };
}

// ────────────────────────────────────────────
// Demo Data
// ────────────────────────────────────────────

const DEMO_OBJECTIVES: Objective[] = [
    {
        id: 'OBJ-001',
        title: 'Reduce aggregate risk exposure by 30%',
        description: 'Lower total ALE from $4.2M to under $3M through targeted risk treatments.',
        quarter: 'Q1',
        year: 2026,
        owner: 'CISO',
        status: 'ON_TRACK',
        keyResults: [
            { id: 'KR-001-1', title: 'Achieve 95% patch SLA compliance', targetValue: 95, currentValue: 82, unit: '%', linkedKPI: 'kpi-patch-sla', isAutoTracked: true, status: 'AT_RISK' },
            { id: 'KR-001-2', title: 'Complete FAIR analysis for top 20 assets', targetValue: 20, currentValue: 14, unit: 'count', isAutoTracked: false, status: 'ON_TRACK' },
            { id: 'KR-001-3', title: 'Reduce avg critical vuln age to <7 days', targetValue: 7, currentValue: 12, unit: 'days', linkedKPI: 'kpi-vuln-critical-age', isAutoTracked: true, status: 'BEHIND' }
        ],
        linkedRisks: ['RS-001', 'RS-002']
    },
    {
        id: 'OBJ-002',
        title: 'Achieve SOC 2 Type II certification',
        description: 'Complete all SOC 2 controls, evidence collection, and pass the Type II audit.',
        quarter: 'Q2',
        year: 2026,
        owner: 'Head of GRC',
        status: 'AT_RISK',
        keyResults: [
            { id: 'KR-002-1', title: 'Close 100% critical control gaps', targetValue: 100, currentValue: 75, unit: '%', isAutoTracked: false, status: 'AT_RISK' },
            { id: 'KR-002-2', title: 'Achieve 85+ audit readiness score', targetValue: 85, currentValue: 68, unit: 'score', linkedKPI: 'kpi-audit-readiness', isAutoTracked: true, status: 'BEHIND' },
            { id: 'KR-002-3', title: 'Complete evidence for all controls', targetValue: 100, currentValue: 62, unit: '%', isAutoTracked: false, status: 'BEHIND' }
        ]
    },
    {
        id: 'OBJ-003',
        title: 'Build a security-first culture',
        description: 'Drive security awareness, reduce human risk, and establish champion program.',
        quarter: 'Q1',
        year: 2026,
        owner: 'Security Awareness Lead',
        status: 'ON_TRACK',
        keyResults: [
            { id: 'KR-003-1', title: 'Achieve 95% training completion', targetValue: 95, currentValue: 89, unit: '%', linkedKPI: 'kpi-training-completion', isAutoTracked: true, status: 'ON_TRACK' },
            { id: 'KR-003-2', title: 'Reduce phishing click rate to <5%', targetValue: 5, currentValue: 8.2, unit: '%', linkedKPI: 'kpi-phishing-rate', isAutoTracked: true, status: 'AT_RISK' },
            { id: 'KR-003-3', title: 'Recruit 15 security champions', targetValue: 15, currentValue: 11, unit: 'count', isAutoTracked: false, status: 'ON_TRACK' }
        ]
    }
];

const DEMO_PROJECTS: Project[] = [
    {
        id: 'PROJ-001',
        title: 'Zero Trust Network Migration',
        description: 'Implement zero trust architecture across all business units.',
        owner: 'CISO',
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        budgetAllocated: 450000,
        budgetSpent: 185000,
        linkedObjectives: ['OBJ-001'],
        linkedRisks: ['RS-001', 'RS-003'],
        startDate: '2026-01-15',
        targetEndDate: '2026-09-30',
        tags: ['infrastructure', 'zero-trust', 'network'],
        phases: [
            {
                id: 'P1',
                title: 'Identity & Access Foundation',
                startDate: '2026-01-15',
                endDate: '2026-03-31',
                status: 'IN_PROGRESS',
                progress: 72,
                milestones: [
                    { id: 'M1', title: 'IAM policy framework defined', dueDate: '2026-02-01', completedDate: '2026-01-28', status: 'COMPLETED' },
                    { id: 'M2', title: 'MFA rollout complete', dueDate: '2026-02-28', completedDate: '2026-02-20', status: 'COMPLETED' },
                    { id: 'M3', title: 'Conditional access policies deployed', dueDate: '2026-03-31', status: 'IN_PROGRESS' }
                ]
            },
            {
                id: 'P2',
                title: 'Network Micro-Segmentation',
                startDate: '2026-04-01',
                endDate: '2026-06-30',
                status: 'NOT_STARTED',
                progress: 0,
                milestones: [
                    { id: 'M4', title: 'Network topology mapped', dueDate: '2026-04-15', status: 'NOT_STARTED' },
                    { id: 'M5', title: 'Segmentation rules deployed (prod)', dueDate: '2026-06-30', status: 'NOT_STARTED' }
                ]
            },
            {
                id: 'P3',
                title: 'Data Protection & Encryption',
                startDate: '2026-07-01',
                endDate: '2026-09-30',
                status: 'NOT_STARTED',
                progress: 0,
                milestones: [
                    { id: 'M6', title: 'Data classification complete', dueDate: '2026-07-31', status: 'NOT_STARTED' },
                    { id: 'M7', title: 'Encryption at rest enabled (all DBs)', dueDate: '2026-09-30', status: 'NOT_STARTED' }
                ]
            }
        ]
    },
    {
        id: 'PROJ-002',
        title: 'SOC 2 Type II Certification',
        description: 'Achieve SOC 2 Type II certification by Q2 2026.',
        owner: 'Head of GRC',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        budgetAllocated: 120000,
        budgetSpent: 45000,
        linkedObjectives: ['OBJ-002'],
        linkedRisks: [],
        startDate: '2025-10-01',
        targetEndDate: '2026-06-30',
        tags: ['compliance', 'soc2', 'audit'],
        phases: [
            {
                id: 'P1',
                title: 'Gap Assessment & Remediation',
                startDate: '2025-10-01',
                endDate: '2026-01-31',
                status: 'COMPLETED',
                progress: 100,
                milestones: [
                    { id: 'M1', title: 'Gap assessment complete', dueDate: '2025-11-15', completedDate: '2025-11-12', status: 'COMPLETED' },
                    { id: 'M2', title: 'Remediation plan approved', dueDate: '2025-12-01', completedDate: '2025-12-03', status: 'COMPLETED' }
                ]
            },
            {
                id: 'P2',
                title: 'Evidence Collection & Control Testing',
                startDate: '2026-02-01',
                endDate: '2026-04-30',
                status: 'IN_PROGRESS',
                progress: 45,
                milestones: [
                    { id: 'M3', title: 'Evidence vault populated (80%)', dueDate: '2026-03-15', status: 'IN_PROGRESS' },
                    { id: 'M4', title: 'Internal control testing complete', dueDate: '2026-04-30', status: 'NOT_STARTED' }
                ]
            },
            {
                id: 'P3',
                title: 'Audit & Certification',
                startDate: '2026-05-01',
                endDate: '2026-06-30',
                status: 'NOT_STARTED',
                progress: 0,
                milestones: [
                    { id: 'M5', title: 'Auditor onsite assessment', dueDate: '2026-05-15', status: 'NOT_STARTED' },
                    { id: 'M6', title: 'SOC 2 Type II report issued', dueDate: '2026-06-30', status: 'NOT_STARTED' }
                ]
            }
        ]
    },
    {
        id: 'PROJ-003',
        title: 'SIEM/EDR Consolidation',
        description: 'Evaluate and consolidate overlapping SIEM and EDR capabilities to reduce cost.',
        owner: 'Security Engineering Lead',
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        budgetAllocated: 50000,
        budgetSpent: 0,
        linkedObjectives: [],
        linkedRisks: [],
        startDate: '2026-03-01',
        targetEndDate: '2026-05-31',
        tags: ['budget', 'optimization', 'tools'],
        phases: [
            {
                id: 'P1',
                title: 'Capability Mapping & Evaluation',
                startDate: '2026-03-01',
                endDate: '2026-03-31',
                status: 'NOT_STARTED',
                progress: 0,
                milestones: [
                    { id: 'M1', title: 'Tool capability matrix complete', dueDate: '2026-03-15', status: 'NOT_STARTED' },
                    { id: 'M2', title: 'Vendor demo scheduled', dueDate: '2026-03-31', status: 'NOT_STARTED' }
                ]
            },
            {
                id: 'P2',
                title: '30-Day Parallel Trial',
                startDate: '2026-04-01',
                endDate: '2026-04-30',
                status: 'NOT_STARTED',
                progress: 0,
                milestones: [
                    { id: 'M3', title: 'Trial deployment complete', dueDate: '2026-04-07', status: 'NOT_STARTED' },
                    { id: 'M4', title: 'Detection parity validated', dueDate: '2026-04-30', status: 'NOT_STARTED' }
                ]
            }
        ]
    }
];

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

export const useOKRProjectStore = create<OKRProjectStore>()(
    persist(
        (set, get) => ({
            objectives: DEMO_OBJECTIVES,
            projects: DEMO_PROJECTS,

            addObjective: (obj) => set(state => ({
                objectives: [...state.objectives, obj]
            })),

            updateKeyResult: (objId, krId, value) => set(state => ({
                objectives: state.objectives.map(obj =>
                    obj.id === objId
                        ? {
                            ...obj,
                            keyResults: obj.keyResults.map(kr =>
                                kr.id === krId ? { ...kr, currentValue: value } : kr
                            )
                        }
                        : obj
                )
            })),

            addProject: (proj) => set(state => ({
                projects: [...state.projects, proj]
            })),

            updateProjectPhase: (projId, phaseId, status, progress) => set(state => ({
                projects: state.projects.map(proj =>
                    proj.id === projId
                        ? {
                            ...proj,
                            phases: proj.phases.map(phase =>
                                phase.id === phaseId ? { ...phase, status, progress } : phase
                            )
                        }
                        : proj
                )
            })),

            getOKRProgress: (objId) => {
                const obj = get().objectives.find(o => o.id === objId);
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
                    onTrack: objs.filter(o => o.status === 'ON_TRACK').length,
                    atRisk: objs.filter(o => o.status === 'AT_RISK').length,
                    behind: objs.filter(o => o.status === 'BEHIND').length,
                };
            },

            getProjectBurndown: (projId) => {
                const proj = get().projects.find(p => p.id === projId);
                if (!proj) return { allocated: 0, spent: 0, percentage: 0 };
                return {
                    allocated: proj.budgetAllocated,
                    spent: proj.budgetSpent,
                    percentage: Math.round((proj.budgetSpent / proj.budgetAllocated) * 100)
                };
            }
        }),
        { name: 'aegis-okr-project-store' }
    )
);
