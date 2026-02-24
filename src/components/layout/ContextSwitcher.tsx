'use client';

/**
 * Context Switcher — Company → Product selector
 *
 * Always visible in the Vendor Risk module header.
 * Default: "All Companies (Common KB)" → shows generic entries.
 * When switched, the entire Vendor Risk module filters to that company/product.
 */

import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompanyProductStore } from '@/lib/company-product-store';
import { Building2, Package, Globe } from 'lucide-react';

export function ContextSwitcher({ compact = false }: { compact?: boolean }) {
    const {
        companies, products,
        selectedCompanyId, selectedProductId,
        setContext, resetContext,
        fetchCompanies, fetchProducts,
    } = useCompanyProductStore();

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchProducts(selectedCompanyId);
        }
    }, [selectedCompanyId, fetchProducts]);

    const handleCompanyChange = (value: string) => {
        if (value === '__all__') {
            resetContext();
        } else {
            setContext(value, null);
            fetchProducts(value);
        }
    };

    const handleProductChange = (value: string) => {
        if (value === '__all__') {
            setContext(selectedCompanyId, null);
        } else {
            setContext(selectedCompanyId, value);
        }
    };

    const companyProducts = products.filter(p => p.companyId === selectedCompanyId);

    return (
        <div className={`flex items-center gap-2 ${compact ? '' : 'p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50'}`}>
            {!compact && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Context:</span>
                </div>
            )}

            {/* Company Selector */}
            <Select
                value={selectedCompanyId || '__all__'}
                onValueChange={handleCompanyChange}
            >
                <SelectTrigger className={`${compact ? 'w-[160px] h-8 text-xs' : 'w-[200px] h-9 text-sm'} bg-zinc-900/80 border-zinc-700/50`}>
                    <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                        <SelectValue placeholder="All Companies" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__all__">
                        <span className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-purple-400" />
                            All Companies (Common KB)
                        </span>
                    </SelectItem>
                    {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5 text-blue-400" />
                                {c.name}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Separator Arrow */}
            {selectedCompanyId && (
                <>
                    <span className="text-zinc-600 text-sm">→</span>

                    {/* Product Selector */}
                    <Select
                        value={selectedProductId || '__all__'}
                        onValueChange={handleProductChange}
                    >
                        <SelectTrigger className={`${compact ? 'w-[140px] h-8 text-xs' : 'w-[180px] h-9 text-sm'} bg-zinc-900/80 border-zinc-700/50`}>
                            <div className="flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                                <SelectValue placeholder="All Products" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">
                                <span className="flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5 text-blue-400" />
                                    All Products
                                </span>
                            </SelectItem>
                            {companyProducts.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    <span className="flex items-center gap-2">
                                        <Package className="h-3.5 w-3.5 text-emerald-400" />
                                        {p.name}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </>
            )}
        </div>
    );
}
