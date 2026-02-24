/**
 * Company & Product Context Store
 *
 * Zustand store managing:
 * - Selected company/product context (filter for entire Vendor Risk module)
 * - CRUD state for companies and products
 * - Persisted to sessionStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface Company {
    id: string;
    name: string;
    legalEntity: string;
    jurisdiction: string;
    country: string;
    industry: string;
    size: string;
    certifications: string; // JSON array
    primaryCloud: string;
    additionalContext?: string | null;
    products?: Product[];
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    dataTypes: string;       // JSON array
    hostingRegions: string;  // JSON array
    complianceScope: string; // JSON array
    techStack?: string | null; // JSON array
    companyId: string;
    createdAt: string;
    updatedAt: string;
    _count?: { knowledgeOverrides: number };
}

export interface CompanyProductState {
    // Data
    companies: Company[];
    products: Product[];

    // Context selection
    selectedCompanyId: string | null;
    selectedProductId: string | null;

    // Loading state
    isLoading: boolean;

    // Actions
    fetchCompanies: () => Promise<void>;
    fetchProducts: (companyId?: string) => Promise<void>;
    setContext: (companyId: string | null, productId: string | null) => void;
    resetContext: () => void;

    // Company CRUD
    createCompany: (data: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'products'>) => Promise<Company | null>;
    updateCompany: (id: string, data: Partial<Company>) => Promise<Company | null>;
    deleteCompany: (id: string) => Promise<boolean>;

    // Product CRUD
    createProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | '_count'>) => Promise<Product | null>;
    updateProduct: (id: string, data: Partial<Product>) => Promise<Product | null>;
    deleteProduct: (id: string) => Promise<boolean>;

    // Computed
    selectedCompany: () => Company | null;
    selectedProduct: () => Product | null;
    contextLabel: () => string;
}

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

export const useCompanyProductStore = create<CompanyProductState>()(
    persist(
        (set, get) => ({
            companies: [],
            products: [],
            selectedCompanyId: null,
            selectedProductId: null,
            isLoading: false,

            // ─── Fetch ───
            fetchCompanies: async () => {
                set({ isLoading: true });
                try {
                    const res = await fetch('/api/companies');
                    if (res.ok) {
                        const data = await res.json();
                        set({ companies: data, isLoading: false });
                    } else {
                        set({ isLoading: false });
                    }
                } catch {
                    set({ isLoading: false });
                }
            },

            fetchProducts: async (companyId?: string) => {
                try {
                    const url = companyId
                        ? `/api/products?companyId=${companyId}`
                        : '/api/products';
                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        set({ products: data });
                    }
                } catch { /* silent */ }
            },

            // ─── Context ───
            setContext: (companyId, productId) => {
                set({ selectedCompanyId: companyId, selectedProductId: productId });
            },

            resetContext: () => {
                set({ selectedCompanyId: null, selectedProductId: null });
            },

            // ─── Company CRUD ───
            createCompany: async (data) => {
                try {
                    const res = await fetch('/api/companies', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (res.ok) {
                        const company = await res.json();
                        set({ companies: [...get().companies, company] });
                        return company;
                    }
                } catch { /* silent */ }
                return null;
            },

            updateCompany: async (id, data) => {
                try {
                    const res = await fetch(`/api/companies/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (res.ok) {
                        const updated = await res.json();
                        set({
                            companies: get().companies.map(c => c.id === id ? updated : c),
                        });
                        return updated;
                    }
                } catch { /* silent */ }
                return null;
            },

            deleteCompany: async (id) => {
                try {
                    const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        set({
                            companies: get().companies.filter(c => c.id !== id),
                            // Reset context if deleted company was selected
                            ...(get().selectedCompanyId === id
                                ? { selectedCompanyId: null, selectedProductId: null }
                                : {}),
                        });
                        return true;
                    }
                } catch { /* silent */ }
                return false;
            },

            // ─── Product CRUD ───
            createProduct: async (data) => {
                try {
                    const res = await fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (res.ok) {
                        const product = await res.json();
                        set({ products: [...get().products, product] });
                        return product;
                    }
                } catch { /* silent */ }
                return null;
            },

            updateProduct: async (id, data) => {
                try {
                    const res = await fetch(`/api/products/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (res.ok) {
                        const updated = await res.json();
                        set({
                            products: get().products.map(p => p.id === id ? updated : p),
                        });
                        return updated;
                    }
                } catch { /* silent */ }
                return null;
            },

            deleteProduct: async (id) => {
                try {
                    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        set({
                            products: get().products.filter(p => p.id !== id),
                            ...(get().selectedProductId === id
                                ? { selectedProductId: null }
                                : {}),
                        });
                        return true;
                    }
                } catch { /* silent */ }
                return false;
            },

            // ─── Computed ───
            selectedCompany: () => {
                const { companies, selectedCompanyId } = get();
                return companies.find(c => c.id === selectedCompanyId) || null;
            },

            selectedProduct: () => {
                const { products, selectedProductId } = get();
                return products.find(p => p.id === selectedProductId) || null;
            },

            contextLabel: () => {
                const company = get().selectedCompany();
                const product = get().selectedProduct();
                if (!company) return 'All Companies (Common KB)';
                if (!product) return company.name;
                return `${company.name} → ${product.name}`;
            },
        }),
        {
            name: 'company-product-context',
            storage: createJSONStorage(() => {
                if (typeof window !== 'undefined') return sessionStorage;
                // SSR fallback
                return {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                };
            }),
            partialize: (state) => ({
                selectedCompanyId: state.selectedCompanyId,
                selectedProductId: state.selectedProductId,
            }),
        }
    )
);
