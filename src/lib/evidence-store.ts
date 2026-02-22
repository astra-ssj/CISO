import { create } from 'zustand';

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
    fileSize: number;
    controlIds: string[];
    framework: string;
    status: EvidenceStatus;
    uploadDate: string;
    expiryDate?: string;
    uploadedBy: string;
    notes: string;
}

const API = '/api/evidence';

interface EvidenceStore {
    evidenceItems: EvidenceItem[];
    isLoading: boolean;
    hasFetched: boolean;
    fetchEvidence: () => Promise<void>;
    addEvidence: (item: Omit<EvidenceItem, 'id' | 'uploadDate' | 'status'>) => Promise<void>;
    updateEvidence: (id: string, updates: Partial<EvidenceItem>) => Promise<void>;
    removeEvidence: (id: string) => Promise<void>;
    getEvidenceByFramework: (framework: string) => EvidenceItem[];
    getEvidenceByControl: (controlId: string) => EvidenceItem[];
    getCoverageStats: () => { total: number; verified: number; expired: number; pending: number };
}

export const useEvidenceStore = create<EvidenceStore>()((set, get) => ({
    evidenceItems: [],
    isLoading: false,
    hasFetched: false,

    fetchEvidence: async () => {
        if (get().hasFetched) return;
        set({ isLoading: true });
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            set({ evidenceItems: Array.isArray(data) ? data : [], hasFetched: true, isLoading: false });
        } catch (e) {
            console.warn('Evidence fetch failed', e);
            set({ hasFetched: true, isLoading: false });
        }
    },

    addEvidence: async (item) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...item,
                    uploadDate: new Date().toISOString().split('T')[0],
                    status: 'UPLOADED',
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            set((s) => ({ evidenceItems: [created, ...s.evidenceItems], hasFetched: true }));
        } catch (e) {
            console.warn('Evidence add failed', e);
        }
    },

    updateEvidence: async (id, updates) => {
        try {
            const res = await fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            set((s) => ({
                evidenceItems: s.evidenceItems.map((e) => (e.id === id ? { ...e, ...updated } : e)),
            }));
        } catch (e) {
            console.warn('Evidence update failed', e);
        }
    },

    removeEvidence: async (id) => {
        try {
            const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());
            set((s) => ({ evidenceItems: s.evidenceItems.filter((e) => e.id !== id) }));
        } catch (e) {
            console.warn('Evidence remove failed', e);
        }
    },

    getEvidenceByFramework: (framework) => get().evidenceItems.filter((e) => e.framework === framework),
    getEvidenceByControl: (controlId) => get().evidenceItems.filter((e) => e.controlIds.includes(controlId)),
    getCoverageStats: () => {
        const items = get().evidenceItems;
        return {
            total: items.length,
            verified: items.filter((e) => e.status === 'VERIFIED').length,
            expired: items.filter((e) => e.status === 'EXPIRED').length,
            pending: items.filter((e) => e.status === 'UPLOADED').length,
        };
    },
}));
