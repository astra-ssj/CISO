import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

interface VendorRiskStore {
    vendors: Vendor[];
    addVendor: (vendor: Omit<Vendor, 'id' | 'createdAt' | 'assessmentHistory' | 'riskTier'>) => void;
    updateVendor: (id: string, updates: Partial<Vendor>) => void;
    removeVendor: (id: string) => void;
    addAssessment: (vendorId: string, assessment: Omit<VendorAssessment, 'id'>) => void;
    getVendorsByRiskTier: (tier: VendorRiskTier) => Vendor[];
    getCriticalVendorCount: () => number;
    getAverageRiskScore: () => number;
    getPendingReviewCount: () => number;
}

const calculateRiskTier = (score: number): VendorRiskTier => {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
};

// ────────────────────────────────────────────
// Sample Vendors for Demo
// ────────────────────────────────────────────

const DEMO_VENDORS: Vendor[] = [
    {
        id: 'v-001', name: 'CloudScale AWS', category: 'CLOUD_INFRASTRUCTURE',
        description: 'Primary cloud infrastructure provider (IaaS). Hosts all production workloads.',
        status: 'APPROVED', riskTier: 'MEDIUM', riskScore: 42,
        dataAccess: ['PII', 'FINANCIAL', 'OPERATIONAL'],
        complianceCertifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP'],
        contractExpiry: '2027-03-15', lastAssessment: '2026-01-10',
        assessmentHistory: [{ id: 'a-001', date: '2026-01-10', score: 42, findings: ['Shared responsibility gaps in encryption key management'], assessor: 'Internal Audit' }],
        contactName: 'Sarah Chen', contactEmail: 'sarah.chen@cloudscale.example', notes: 'Tier 1 critical vendor.', createdAt: '2025-06-01'
    },
    {
        id: 'v-002', name: 'DataFlow Analytics', category: 'DATA_PROCESSING',
        description: 'Third-party analytics and business intelligence platform processing customer data.',
        status: 'UNDER_REVIEW', riskTier: 'HIGH', riskScore: 68,
        dataAccess: ['PII', 'FINANCIAL'],
        complianceCertifications: ['SOC 2 Type I'],
        contractExpiry: '2026-06-30', lastAssessment: '2025-11-15',
        assessmentHistory: [{ id: 'a-002', date: '2025-11-15', score: 68, findings: ['Missing SOC 2 Type II', 'No encryption at rest', 'Data retention policy exceeds our requirements'], assessor: 'CISO Office' }],
        contactName: 'Marcus Webb', contactEmail: 'mwebb@dataflow.example', notes: 'Renewal review — require SOC 2 Type II before renewal.', createdAt: '2024-12-01'
    },
    {
        id: 'v-003', name: 'SecureGuard MDR', category: 'SECURITY',
        description: 'Managed Detection and Response provider with 24/7 SOC monitoring.',
        status: 'APPROVED', riskTier: 'LOW', riskScore: 18,
        dataAccess: ['OPERATIONAL'],
        complianceCertifications: ['SOC 2 Type II', 'ISO 27001', 'CREST'],
        contractExpiry: '2027-01-01', lastAssessment: '2026-02-01',
        assessmentHistory: [{ id: 'a-003', date: '2026-02-01', score: 18, findings: [], assessor: 'CISO Office' }],
        contactName: 'James Liu', contactEmail: 'jliu@secureguard.example', notes: 'Excellent partner. Consider expanding MSA.', createdAt: '2025-01-15'
    },
    {
        id: 'v-004', name: 'QuickSign HR', category: 'SAAS',
        description: 'HR management and electronic signature platform for employee onboarding.',
        status: 'PENDING', riskTier: 'HIGH', riskScore: 55,
        dataAccess: ['PII'],
        complianceCertifications: ['ISO 27001'],
        contractExpiry: '2026-12-31', lastAssessment: '2025-09-20',
        assessmentHistory: [{ id: 'a-004', date: '2025-09-20', score: 55, findings: ['No GDPR DPA signed', 'Missing incident notification clause'], assessor: 'Legal' }],
        contactName: 'Elena Petrova', contactEmail: 'elena@quicksign.example', notes: 'Onboarding blocked until DPA is signed.', createdAt: '2025-08-01'
    },
    {
        id: 'v-005', name: 'NovaCrypt Payments', category: 'DATA_PROCESSING',
        description: 'Payment processing gateway handling PCI DSS cardholder data.',
        status: 'APPROVED', riskTier: 'CRITICAL', riskScore: 78,
        dataAccess: ['PII', 'FINANCIAL'],
        complianceCertifications: ['PCI DSS Level 1', 'SOC 2 Type II'],
        contractExpiry: '2026-09-01', lastAssessment: '2025-12-05',
        assessmentHistory: [{ id: 'a-005', date: '2025-12-05', score: 78, findings: ['Critical: uses TLS 1.0 on one endpoint', 'No vulnerability disclosure program'], assessor: 'Penetration Test Team' }],
        contactName: 'Rashid Ali', contactEmail: 'rali@novacrypt.example', notes: 'Critical risk — TLS 1.0 remediation due by Q1 2026.', createdAt: '2024-06-01'
    }
];

export const useVendorRiskStore = create<VendorRiskStore>()(
    persist(
        (set, get) => ({
            vendors: DEMO_VENDORS,

            addVendor: (vendor) => set((state) => ({
                vendors: [...state.vendors, {
                    ...vendor,
                    id: `v-${Date.now()}`,
                    createdAt: new Date().toISOString().split('T')[0],
                    assessmentHistory: [],
                    riskTier: calculateRiskTier(vendor.riskScore)
                }]
            })),

            updateVendor: (id, updates) => set((state) => ({
                vendors: state.vendors.map(v =>
                    v.id === id ? { ...v, ...updates, riskTier: updates.riskScore !== undefined ? calculateRiskTier(updates.riskScore) : v.riskTier } : v
                )
            })),

            removeVendor: (id) => set((state) => ({
                vendors: state.vendors.filter(v => v.id !== id)
            })),

            addAssessment: (vendorId, assessment) => set((state) => ({
                vendors: state.vendors.map(v => {
                    if (v.id !== vendorId) return v;
                    const newAssessment = { ...assessment, id: `a-${Date.now()}` };
                    return {
                        ...v,
                        assessmentHistory: [...v.assessmentHistory, newAssessment],
                        lastAssessment: assessment.date,
                        riskScore: assessment.score,
                        riskTier: calculateRiskTier(assessment.score)
                    };
                })
            })),

            getVendorsByRiskTier: (tier) => get().vendors.filter(v => v.riskTier === tier),
            getCriticalVendorCount: () => get().vendors.filter(v => v.riskTier === 'CRITICAL' || v.riskTier === 'HIGH').length,
            getAverageRiskScore: () => {
                const vendors = get().vendors;
                if (vendors.length === 0) return 0;
                return Math.round(vendors.reduce((sum, v) => sum + v.riskScore, 0) / vendors.length);
            },
            getPendingReviewCount: () => get().vendors.filter(v => v.status === 'PENDING' || v.status === 'UNDER_REVIEW').length,
        }),
        { name: 'aegis-vendor-risk-store' }
    )
);
