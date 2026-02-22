import { create } from 'zustand';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export type VendorRiskTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type VendorStatus = 'APPROVED' | 'UNDER_REVIEW' | 'REJECTED' | 'PENDING';
export type VendorCategory = 'CLOUD_INFRASTRUCTURE' | 'SAAS' | 'SECURITY' | 'DATA_PROCESSING' | 'CONSULTING' | 'OTHER';

export interface VendorAssessment {
    id: string;
    date: string;
    score: number;
    findings: string[];
    assessor: string;
}

export interface Vendor {
    id: string;
    name: string;
    category: VendorCategory;
    description: string;
    status: VendorStatus;
    riskTier: VendorRiskTier;
    riskScore: number; // 0-100
    dataAccess: ('PII' | 'FINANCIAL' | 'INTELLECTUAL_PROPERTY' | 'OPERATIONAL' | 'NONE')[];
    complianceCertifications: string[];
    contractExpiry: string;
    lastAssessment: string;
    assessmentHistory: VendorAssessment[];
    contactName: string;
    contactEmail: string;
    notes: string;
    createdAt: string;
}

const API = '/api/vendor-risk';

interface VendorRiskStore {
    vendors: Vendor[];
    isLoading: boolean;
    hasFetched: boolean;
    fetchVendors: () => Promise<void>;
    addVendor: (vendor: Omit<Vendor, 'id' | 'createdAt' | 'assessmentHistory' | 'riskTier'>) => Promise<void>;
    updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
    removeVendor: (id: string) => Promise<void>;
    addAssessment: (vendorId: string, assessment: Omit<VendorAssessment, 'id'>) => Promise<void>;
    getVendorsByRiskTier: (tier: VendorRiskTier) => Vendor[];
    getCriticalVendorCount: () => number;
    getAverageRiskScore: () => number;
    getPendingReviewCount: () => number;
}

export const useVendorRiskStore = create<VendorRiskStore>()((set, get) => ({
    vendors: [],
    isLoading: false,
    hasFetched: false,

    fetchVendors: async () => {
        if (get().hasFetched) return;
        set({ isLoading: true });
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            set({ vendors: Array.isArray(data) ? data : [], hasFetched: true, isLoading: false });
        } catch (e) {
            console.warn('Vendor risk fetch failed', e);
            set({ hasFetched: true, isLoading: false });
        }
    },

    addVendor: async (vendor) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...vendor,
                    dataAccess: vendor.dataAccess ?? [],
                    complianceCertifications: vendor.complianceCertifications ?? [],
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            set((s) => ({ vendors: [created, ...s.vendors], hasFetched: true }));
        } catch (e) {
            console.warn('Vendor risk add failed', e);
        }
    },

    updateVendor: async (id, updates) => {
        try {
            const res = await fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...updates,
                    ...(updates.dataAccess != null && { dataAccess: updates.dataAccess }),
                    ...(updates.complianceCertifications != null && { complianceCertifications: updates.complianceCertifications }),
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            set((s) => ({
                vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...updated } : v)),
            }));
        } catch (e) {
            console.warn('Vendor risk update failed', e);
        }
    },

    removeVendor: async (id) => {
        try {
            const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());
            set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) }));
        } catch (e) {
            console.warn('Vendor risk remove failed', e);
        }
    },

    addAssessment: async (vendorId, assessment) => {
        try {
            const res = await fetch(`${API}/${vendorId}/assessments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assessment),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            set((s) => ({
                vendors: s.vendors.map((v) => (v.id === vendorId ? updated : v)),
            }));
        } catch (e) {
            console.warn('Vendor assessment add failed', e);
        }
    },

    getVendorsByRiskTier: (tier) => get().vendors.filter((v) => v.riskTier === tier),
    getCriticalVendorCount: () => get().vendors.filter((v) => v.riskTier === 'CRITICAL' || v.riskTier === 'HIGH').length,
    getAverageRiskScore: () => {
        const vendors = get().vendors;
        if (vendors.length === 0) return 0;
        return Math.round(vendors.reduce((sum, v) => sum + v.riskScore, 0) / vendors.length);
    },
    getPendingReviewCount: () => get().vendors.filter((v) => v.status === 'PENDING' || v.status === 'UNDER_REVIEW').length,
}));
