import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_POLICIES } from './policy-data';

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
    // New Fields for Governance 2.0
    dependencies: string[]; // IDs of policies this ones depends on
    acknowledgment: {
        status: 'ACTIVE' | 'PENDING' | 'COMPLETED';
        totalUsers: number;
        signedUsers: number;
        dueDate?: string;
    };
    changelog: {
        version: string;
        date: string;
        author: string;
        notes: string;
    }[];
}

interface PolicyState {
    policies: Policy[];
    addPolicy: (policy: Policy) => void;
    updatePolicy: (id: string, updates: Partial<Policy>) => void;
    deletePolicy: (id: string) => void;
    getPoliciesByStatus: (status: PolicyStatus) => Policy[];
    getPolicyById: (id: string) => Policy | undefined;
}

export const usePolicyStore = create<PolicyState>()(
    persist(
        (set, get) => ({
            policies: SEED_POLICIES,
            addPolicy: (policy) => set((state) => ({ policies: [...state.policies, policy] })),
            updatePolicy: (id, updates) =>
                set((state) => ({
                    policies: state.policies.map((p) => (p.id === id ? { ...p, ...updates } : p)),
                })),
            deletePolicy: (id) =>
                set((state) => ({ policies: state.policies.filter((p) => p.id !== id) })),
            getPoliciesByStatus: (status) => get().policies.filter((p) => p.status === status),
            getPolicyById: (id) => get().policies.find((p) => p.id === id),
        }),
        {
            name: 'astra-content-store'
        }
    )
);
