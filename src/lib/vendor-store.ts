import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export interface VendorAssessment {
    vendorId: string;
    date: string;
    answers: Record<string, string>; // QId -> Answer
    score: number;
}

interface VendorState {
    vendors: Vendor[];
    addVendor: (vendor: Vendor) => void;
    updateVendor: (id: string, updates: Partial<Vendor>) => void;
    deleteVendor: (id: string) => void;
}

const MOCK_VENDORS: Vendor[] = [
    {
        id: 'v-1',
        name: 'AWS (Amazon Web Services)',
        serviceDescription: 'Core Cloud Infrastructure Provider',
        tier: 'TIER_1_CRITICAL',
        status: 'ACTIVE',
        lastAssessmentDate: '2025-11-15',
        inherentRiskScore: 92,
        contactEmail: 'aws-support@amazon.com'
    },
    {
        id: 'v-2',
        name: 'Slack',
        serviceDescription: 'Internal Communication Platform',
        tier: 'TIER_2_HIGH',
        status: 'ACTIVE',
        lastAssessmentDate: '2026-01-10',
        inherentRiskScore: 65,
        contactEmail: 'security@slack.com'
    },
    {
        id: 'v-3',
        name: 'FastFix IT Support',
        serviceDescription: 'On-demand hardware repair',
        tier: 'TIER_3_MEDIUM',
        status: 'PENDING_ASSESSMENT',
        lastAssessmentDate: '-',
        inherentRiskScore: 40,
        contactEmail: 'support@fastfix.local'
    }
];

export const useVendorStore = create<VendorState>()(
    persist(
        (set) => ({
            vendors: MOCK_VENDORS,
            addVendor: (vendor) => set((state) => ({ vendors: [...state.vendors, vendor] })),
            updateVendor: (id, updates) => set((state) => ({
                vendors: state.vendors.map(v => v.id === id ? { ...v, ...updates } : v)
            })),
            deleteVendor: (id) => set((state) => ({ vendors: state.vendors.filter(v => v.id !== id) }))
        }),
        {
            name: 'astra-vendor-store'
        }
    )
);
