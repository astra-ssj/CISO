import { create } from 'zustand';

export type RiskTier = 'TIER_1_CRITICAL' | 'TIER_2_HIGH' | 'TIER_3_MEDIUM' | 'TIER_4_LOW';
export type VendorStatus = 'ACTIVE' | 'PENDING_ASSESSMENT' | 'REJECTED' | 'DEPRECATED';

export interface Vendor {
    id: string;
    name: string;
    serviceDescription: string;
    tier: RiskTier;
    status: VendorStatus;
    lastAssessmentDate: string;
    inherentRiskScore: number; // 0-100
    contactEmail: string;
}

interface VendorState {
    vendors: Vendor[];
    isLoading: boolean;
    hasFetched: boolean;
    fetchVendors: () => Promise<void>;
    addVendor: (vendor: Vendor) => Promise<void>;
    updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
    deleteVendor: (id: string) => Promise<void>;
}

const API = '/api/vendor-list';

export const useVendorStore = create<VendorState>()((set, get) => ({
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
            console.warn('Vendor list fetch failed', e);
            set({ hasFetched: true, isLoading: false });
        }
    },

    addVendor: async (vendor) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: vendor.name,
                    serviceDescription: vendor.serviceDescription,
                    tier: vendor.tier,
                    status: vendor.status,
                    lastAssessmentDate: vendor.lastAssessmentDate,
                    inherentRiskScore: vendor.inherentRiskScore,
                    contactEmail: vendor.contactEmail,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            set((s) => ({ vendors: [created, ...s.vendors], hasFetched: true }));
        } catch (e) {
            console.warn('Vendor add failed', e);
        }
    },

    updateVendor: async (id, updates) => {
        try {
            const res = await fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            set((s) => ({
                vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...updated } : v)),
            }));
        } catch (e) {
            console.warn('Vendor update failed', e);
        }
    },

    deleteVendor: async (id) => {
        try {
            const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());
            set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) }));
        } catch (e) {
            console.warn('Vendor delete failed', e);
        }
    },
}));
