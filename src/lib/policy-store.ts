import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PolicyStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ACTIVE' | 'RETIRED';

export interface PolicySection {
    id: string;
    title: string;
    content: string;
}

export interface FrameworkMapping {
    frameworkId: string;
    controlId: string;
    coverage: 'FULL' | 'PARTIAL' | 'NONE';
}

export interface Policy {
    id: string;
    title: string;
    type: 'ISMS' | 'PRIVACY' | 'AI_GOV' | 'ACCESS' | 'INCIDENT';
    version: string;
    status: PolicyStatus;
    owner: string;
    lastUpdated: string;
    sections: PolicySection[];
    mappings: FrameworkMapping[];
}

interface PolicyState {
    policies: Policy[];
    addPolicy: (policy: Policy) => void;
    updatePolicy: (id: string, updates: Partial<Policy>) => void;
    deletePolicy: (id: string) => void;
    getPoliciesByStatus: (status: PolicyStatus) => Policy[];
}

const MOCK_POLICIES: Policy[] = [
    {
        id: 'pol-001',
        title: 'Global Information Security Policy',
        type: 'ISMS',
        version: '1.0.0',
        status: 'ACTIVE',
        owner: 'CISO Office',
        lastUpdated: new Date().toISOString(),
        sections: [
            { id: 's1', title: 'Purpose', content: 'To protect the confidentiality, integrity, and availability of assets.' },
            { id: 's2', title: 'Scope', content: 'Applies to all employees, contractors, and third parties.' },
            { id: 's3', title: 'Roles & Responsibilities', content: 'The CISO is accountable for the maintenance of this policy.' }
        ],
        mappings: [
            { frameworkId: 'ISO_27001_2022', controlId: '5.1', coverage: 'FULL' },
            { frameworkId: 'NIST_CSF_2.0', controlId: 'GV.PO-01', coverage: 'FULL' }
        ]
    },
    {
        id: 'pol-002',
        title: 'Generative AI Acceptable Use Policy',
        type: 'AI_GOV',
        version: '0.9.0',
        status: 'DRAFT',
        owner: 'G. Head of AI Ethics',
        lastUpdated: new Date().toISOString(),
        sections: [
            { id: 's1', title: 'Overview', content: 'Guidelines for the safe usage of LLMs and GenAI tools.' },
            { id: 's2', title: 'Prohibited Uses', content: 'Do not input PII or PHI into public models.' }
        ],
        mappings: [
            { frameworkId: 'EU_AI_ACT', controlId: 'Art. 9', coverage: 'PARTIAL' },
            { frameworkId: 'ISO_42001', controlId: 'A.6.2', coverage: 'PARTIAL' }
        ]
    }
];

export const usePolicyStore = create<PolicyState>()(
    persist(
        (set, get) => ({
            policies: MOCK_POLICIES,
            addPolicy: (policy) => set((state) => ({ policies: [...state.policies, policy] })),
            updatePolicy: (id, updates) =>
                set((state) => ({
                    policies: state.policies.map((p) => (p.id === id ? { ...p, ...updates } : p)),
                })),
            deletePolicy: (id) =>
                set((state) => ({ policies: state.policies.filter((p) => p.id !== id) })),
            getPoliciesByStatus: (status) => get().policies.filter((p) => p.status === status),
        }),
        {
            name: 'astra-content-store'
        }
    )
);
