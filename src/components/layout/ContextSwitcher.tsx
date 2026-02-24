'use client';

/**
 * Context Switcher — Company → Product selector
 *
 * Always visible in the Vendor Risk module header.
 * Default: "All Companies (Common KB)" → shows generic entries.
 * When switched, the entire Vendor Risk module filters to that company/product.
 *
 * Features:
 *   - Empty-state onboarding CTA when no companies exist
 *   - Inline setup modal for first company + product
 *   - "+ Add New" button linking to Settings → Companies & Products
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useCompanyProductStore } from '@/lib/company-product-store';
import { Building2, Package, Globe, Plus, Zap, Loader2 } from 'lucide-react';

// ────────────────────────────────────────────
// Setup Modal (Company + Product creation)
// ────────────────────────────────────────────

function SetupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { createCompany, createProduct, setContext, fetchCompanies } = useCompanyProductStore();
    const [saving, setSaving] = useState(false);

    // Company fields
    const [companyName, setCompanyName] = useState('');
    const [legalEntity, setLegalEntity] = useState('');
    const [jurisdiction, setJurisdiction] = useState('EU');
    const [country, setCountry] = useState('');
    const [industry, setIndustry] = useState('Technology');
    const [size, setSize] = useState('Enterprise');
    const [certifications, setCertifications] = useState('');
    const [primaryCloud, setPrimaryCloud] = useState('AWS');

    // Product fields
    const [productName, setProductName] = useState('');
    const [productType, setProductType] = useState('SaaS');
    const [productDescription, setProductDescription] = useState('');
    const [dataTypes, setDataTypes] = useState('');
    const [hostingRegions, setHostingRegions] = useState('');
    const [complianceScope, setComplianceScope] = useState('');

    const canSave = companyName.trim() && legalEntity.trim() && country.trim() && productName.trim();

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            const company = await createCompany({
                name: companyName.trim(),
                legalEntity: legalEntity.trim(),
                jurisdiction,
                country: country.trim(),
                industry,
                size,
                certifications: JSON.stringify(certifications.split(',').map(s => s.trim()).filter(Boolean)),
                primaryCloud,
            });

            if (company) {
                const product = await createProduct({
                    name: productName.trim(),
                    description: productDescription.trim() || null,
                    type: productType,
                    dataTypes: JSON.stringify(dataTypes.split(',').map(s => s.trim()).filter(Boolean)),
                    hostingRegions: JSON.stringify(hostingRegions.split(',').map(s => s.trim()).filter(Boolean)),
                    complianceScope: JSON.stringify(complianceScope.split(',').map(s => s.trim()).filter(Boolean)),
                    companyId: company.id,
                });

                // Auto-select the newly created company + product
                setContext(company.id, product?.id || null);
                await fetchCompanies();
            }

            onClose();
        } catch {
            // Error handled by store
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Set Up Your First Company & Product
                    </DialogTitle>
                    <DialogDescription>
                        Configure your company details and the product you&apos;re filling the CAIQ for.
                    </DialogDescription>
                </DialogHeader>

                {/* Company Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary flex items-center gap-2 pt-2">
                        <Building2 className="h-4 w-4" /> Company Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Company Name *</Label>
                            <Input placeholder="e.g. AstraLabs DE" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Legal Entity *</Label>
                            <Input placeholder="e.g. AstraLabs GmbH" value={legalEntity} onChange={e => setLegalEntity(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Jurisdiction</Label>
                            <Select value={jurisdiction} onValueChange={setJurisdiction}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['EU', 'US', 'UK', 'APAC', 'Global'].map(j => (
                                        <SelectItem key={j} value={j}>{j}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Country *</Label>
                            <Input placeholder="e.g. DE" value={country} onChange={e => setCountry(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Industry</Label>
                            <Select value={industry} onValueChange={setIndustry}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Government', 'Education', 'Other'].map(i => (
                                        <SelectItem key={i} value={i}>{i}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Size</Label>
                            <Select value={size} onValueChange={setSize}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['Startup', 'SMB', 'Mid-Market', 'Enterprise'].map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Certifications (comma-separated)</Label>
                            <Input placeholder="e.g. ISO 27001, SOC 2 Type II" value={certifications} onChange={e => setCertifications(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Primary Cloud</Label>
                            <Select value={primaryCloud} onValueChange={setPrimaryCloud}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['AWS', 'Azure', 'GCP', 'Multi-Cloud', 'On-Premise', 'Hybrid'].map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Separator */}
                <div className="border-t border-border my-2" />

                {/* Product Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                        <Package className="h-4 w-4" /> Product Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Product Name *</Label>
                            <Input placeholder="e.g. CORTEX" value={productName} onChange={e => setProductName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Type</Label>
                            <Select value={productType} onValueChange={setProductType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['SaaS', 'PaaS', 'IaaS', 'On-Premise', 'Hybrid', 'Mobile', 'API'].map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs">Description</Label>
                            <Textarea placeholder="e.g. Zero Trust AI Platform for compliance" value={productDescription} onChange={e => setProductDescription(e.target.value)} className="h-16" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Data Types (comma-separated)</Label>
                            <Input placeholder="e.g. PII, Financial, Health" value={dataTypes} onChange={e => setDataTypes(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Hosting Regions (comma-separated)</Label>
                            <Input placeholder="e.g. eu-west-1, eu-central-1" value={hostingRegions} onChange={e => setHostingRegions(e.target.value)} />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs">Compliance Scope (comma-separated)</Label>
                            <Input placeholder="e.g. GDPR, NIS2, SOC 2" value={complianceScope} onChange={e => setComplianceScope(e.target.value)} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!canSave || saving} className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {saving ? 'Creating…' : 'Create & Select'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ────────────────────────────────────────────
// Context Switcher Component
// ────────────────────────────────────────────

export function ContextSwitcher({ compact = false }: { compact?: boolean }) {
    const router = useRouter();
    const {
        companies, products,
        selectedCompanyId, selectedProductId,
        setContext, resetContext,
        fetchCompanies, fetchProducts,
        isLoading,
    } = useCompanyProductStore();

    const [showSetup, setShowSetup] = useState(false);

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

    // ─── Empty State: No companies yet ───
    if (!isLoading && companies.length === 0) {
        return (
            <>
                <button
                    onClick={() => setShowSetup(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all group cursor-pointer"
                >
                    <div className="p-2 rounded-lg bg-amber-500/15 group-hover:bg-amber-500/25 transition-colors">
                        <Zap className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium text-amber-300">Set up your first company and product to get started</p>
                        <p className="text-xs text-muted-foreground">Configure company details and product context for CAIQ questionnaires</p>
                    </div>
                    <Plus className="h-5 w-5 text-amber-500/50 group-hover:text-amber-400 ml-auto transition-colors" />
                </button>
                <SetupModal open={showSetup} onClose={() => setShowSetup(false)} />
            </>
        );
    }

    // ─── Normal State: Company/Product selector ───
    return (
        <>
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

                {/* + Add New button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                    onClick={() => router.push('/settings?tab=companies')}
                >
                    <Plus className="h-3.5 w-3.5" />
                    {!compact && 'Add New'}
                </Button>
            </div>

            <SetupModal open={showSetup} onClose={() => setShowSetup(false)} />
        </>
    );
}
