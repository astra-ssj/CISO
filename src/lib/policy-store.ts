import { create } from 'zustand';

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
    dependencies: string[];
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

const API = '/api/policies';

interface PolicyState {
    policies: Policy[];
    isLoading: boolean;
    hasFetched: boolean;
    fetchPolicies: () => Promise<void>;
    addPolicy: (policy: Policy) => Promise<Policy | void>;
    updatePolicy: (id: string, updates: Partial<Policy>) => Promise<void>;
    deletePolicy: (id: string) => Promise<void>;
    getPoliciesByStatus: (status: PolicyStatus) => Policy[];
    getPolicyById: (id: string) => Policy | undefined;
}

export const usePolicyStore = create<PolicyState>()((set, get) => ({
    policies: [],
    isLoading: false,
    hasFetched: false,

    fetchPolicies: async () => {
        if (get().hasFetched) return;
        set({ isLoading: true });
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            set({ policies: Array.isArray(data) ? data : [], hasFetched: true, isLoading: false });
        } catch (e) {
            console.warn('Policies fetch failed', e);
            set({ hasFetched: true, isLoading: false });
        }
    },

    addPolicy: async (policy) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(policy),
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            set((s) => ({ policies: [created, ...s.policies], hasFetched: true }));
            return created as Policy;
        } catch (e) {
            console.warn('Policy add failed', e);
        }
    },

    updatePolicy: async (id, updates) => {
        try {
            const res = await fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            set((s) => ({
                policies: s.policies.map((p) => (p.id === id ? { ...p, ...updated } : p)),
            }));
        } catch (e) {
            console.warn('Policy update failed', e);
        }
    },

    deletePolicy: async (id) => {
        try {
            const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());
            set((s) => ({ policies: s.policies.filter((p) => p.id !== id) }));
        } catch (e) {
            console.warn('Policy delete failed', e);
        }
    },

    getPoliciesByStatus: (status) => get().policies.filter((p) => p.status === status),
    getPolicyById: (id) => get().policies.find((p) => p.id === id),
}));
