import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export type EvidenceStatus = 'UPLOADED' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';
export type EvidenceType = 'POLICY' | 'REPORT' | 'SCREENSHOT' | 'LOG' | 'CERTIFICATE' | 'ASSESSMENT' | 'OTHER';

export interface EvidenceItem {
    id: string;
    name: string;
    type: EvidenceType;
    fileName: string;
    fileSize: number; // bytes
    controlIds: string[]; // mapped control IDs from compliance-frameworks
    framework: string;
    status: EvidenceStatus;
    uploadDate: string;
    expiryDate?: string;
    uploadedBy: string;
    notes: string;
}

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

interface EvidenceStore {
    evidenceItems: EvidenceItem[];
    addEvidence: (item: Omit<EvidenceItem, 'id' | 'uploadDate' | 'status'>) => void;
    updateEvidence: (id: string, updates: Partial<EvidenceItem>) => void;
    removeEvidence: (id: string) => void;
    getEvidenceByFramework: (framework: string) => EvidenceItem[];
    getEvidenceByControl: (controlId: string) => EvidenceItem[];
    getCoverageStats: () => { total: number; verified: number; expired: number; pending: number };
}

const DEMO_EVIDENCE: EvidenceItem[] = [
    {
        id: 'ev-001', name: 'Information Security Policy v3.1', type: 'POLICY',
        fileName: 'infosec-policy-v3.1.pdf', fileSize: 245000,
        controlIds: ['A.5.1', 'GV.OC-01'], framework: 'ISO_27001_2022',
        status: 'VERIFIED', uploadDate: '2026-01-15', uploadedBy: 'CISO Office',
        notes: 'Annual review completed and approved by board.'
    },
    {
        id: 'ev-002', name: 'SOC 2 Type II Report 2025', type: 'REPORT',
        fileName: 'soc2-typeii-2025.pdf', fileSize: 1800000,
        controlIds: ['PR.AA-01', 'PR.DS-01', 'DE.CM-01'], framework: 'NIST_CSF_2_0',
        status: 'VERIFIED', uploadDate: '2025-12-20', expiryDate: '2026-12-20', uploadedBy: 'External Auditor',
        notes: 'No exceptions noted.'
    },
    {
        id: 'ev-003', name: 'Penetration Test Results Q1 2026', type: 'ASSESSMENT',
        fileName: 'pentest-q1-2026.pdf', fileSize: 3200000,
        controlIds: ['ID.RA-01', 'A.8.8'], framework: 'NIST_CSF_2_0',
        status: 'UPLOADED', uploadDate: '2026-02-10', uploadedBy: 'Security Team',
        notes: 'Awaiting verification from compliance officer.'
    },
    {
        id: 'ev-004', name: 'GDPR DPIA - Customer Portal', type: 'ASSESSMENT',
        fileName: 'dpia-customer-portal.docx', fileSize: 580000,
        controlIds: ['ART-35', 'ART-32'], framework: 'GDPR',
        status: 'VERIFIED', uploadDate: '2026-01-28', uploadedBy: 'DPO',
        notes: 'DPIA completed — no high residual risks identified.'
    },
    {
        id: 'ev-005', name: 'Backup Recovery Test Log', type: 'LOG',
        fileName: 'dr-test-log-jan2026.csv', fileSize: 45000,
        controlIds: ['RC.RP-01', 'NIS2-ART-21.2.c'], framework: 'NIS2',
        status: 'VERIFIED', uploadDate: '2026-01-30', uploadedBy: 'IT Operations',
        notes: 'RTO achieved: 2h 15m (target: 4h). RPO: 30m.'
    },
    {
        id: 'ev-006', name: 'Security Awareness Training Completion', type: 'CERTIFICATE',
        fileName: 'training-completion-q4-2025.xlsx', fileSize: 120000,
        controlIds: ['PR.AT-01', 'NIS2-ART-21.2.g'], framework: 'NIST_CSF_2_0',
        status: 'EXPIRED', uploadDate: '2025-10-15', expiryDate: '2026-01-15', uploadedBy: 'HR',
        notes: 'Q1 2026 training cycle overdue.'
    }
];

export const useEvidenceStore = create<EvidenceStore>()(
    persist(
        (set, get) => ({
            evidenceItems: DEMO_EVIDENCE,

            addEvidence: (item) => set((state) => ({
                evidenceItems: [...state.evidenceItems, {
                    ...item,
                    id: `ev-${Date.now()}`,
                    uploadDate: new Date().toISOString().split('T')[0],
                    status: 'UPLOADED' as const
                }]
            })),

            updateEvidence: (id, updates) => set((state) => ({
                evidenceItems: state.evidenceItems.map(e => e.id === id ? { ...e, ...updates } : e)
            })),

            removeEvidence: (id) => set((state) => ({
                evidenceItems: state.evidenceItems.filter(e => e.id !== id)
            })),

            getEvidenceByFramework: (framework) => get().evidenceItems.filter(e => e.framework === framework),
            getEvidenceByControl: (controlId) => get().evidenceItems.filter(e => e.controlIds.includes(controlId)),

            getCoverageStats: () => {
                const items = get().evidenceItems;
                return {
                    total: items.length,
                    verified: items.filter(e => e.status === 'VERIFIED').length,
                    expired: items.filter(e => e.status === 'EXPIRED').length,
                    pending: items.filter(e => e.status === 'UPLOADED').length,
                };
            }
        }),
        { name: 'aegis-evidence-store' }
    )
);
