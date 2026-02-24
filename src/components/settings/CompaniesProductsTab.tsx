'use client';

/**
 * Companies & Products Management Tab
 *
 * Settings tab for managing:
 * - Companies: name, jurisdiction, country, certifications, product count
 * - Products per company: name, type, hosting regions, compliance scope, override count
 * - "Configure CAIQ" button per product → navigates to product-specific KB
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Building2, Package, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
    Globe, Shield, Server, Loader2, Settings2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface Company {
    id: string;
    name: string;
    legalEntity: string;
    jurisdiction: string;
    country: string;
    industry: string;
    size: string;
    certifications: string;
    primaryCloud: string;
    additionalContext?: string | null;
    products?: Product[];
}

interface Product {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    dataTypes: string;
    hostingRegions: string;
    complianceScope: string;
    techStack?: string | null;
    companyId: string;
    _count?: { knowledgeOverrides: number };
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const JURISDICTIONS = ['EU', 'US', 'UK', 'APAC', 'GLOBAL'];
const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Government', 'Retail', 'Manufacturing', 'Other'];
const SIZES = ['Startup', 'SMB', 'Mid-Market', 'Enterprise'];
const PRODUCT_TYPES = ['SaaS', 'PaaS', 'IaaS', 'On-Premise', 'Hybrid', 'Mobile', 'API'];
const CLOUD_PROVIDERS = ['AWS', 'Azure', 'GCP', 'Multi-Cloud', 'On-Premise', 'Hybrid'];

const EMPTY_COMPANY = {
    name: '', legalEntity: '', jurisdiction: 'EU', country: '',
    industry: 'Technology', size: 'Enterprise', certifications: '[]',
    primaryCloud: 'AWS', additionalContext: '',
};

const EMPTY_PRODUCT = {
    name: '', description: '', type: 'SaaS',
    dataTypes: '[]', hostingRegions: '[]', complianceScope: '[]', techStack: '[]',
};

// ════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════

export function CompaniesProductsTab() {
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

    // Company form
    const [showCompanyForm, setShowCompanyForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY);

    // Product form
    const [showProductForm, setShowProductForm] = useState<string | null>(null); // companyId
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState(EMPTY_PRODUCT);

    const fetchCompanies = useCallback(async () => {
        try {
            const res = await fetch('/api/companies');
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            }
        } catch { /* */ }
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

    // ─── Company CRUD ─────────────────────────

    const handleSaveCompany = async () => {
        const url = editingCompany ? `/api/companies/${editingCompany.id}` : '/api/companies';
        const method = editingCompany ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyForm),
            });
            if (res.ok) {
                await fetchCompanies();
                setShowCompanyForm(false);
                setEditingCompany(null);
                setCompanyForm(EMPTY_COMPANY);
            }
        } catch { /* */ }
    };

    const handleDeleteCompany = async (id: string) => {
        if (!confirm('Delete this company and all its products?')) return;
        try {
            await fetch(`/api/companies/${id}`, { method: 'DELETE' });
            await fetchCompanies();
        } catch { /* */ }
    };

    const handleEditCompany = (company: Company) => {
        setEditingCompany(company);
        setCompanyForm({
            name: company.name, legalEntity: company.legalEntity,
            jurisdiction: company.jurisdiction, country: company.country,
            industry: company.industry, size: company.size,
            certifications: company.certifications, primaryCloud: company.primaryCloud,
            additionalContext: company.additionalContext || '',
        });
        setShowCompanyForm(true);
    };

    // ─── Product CRUD ─────────────────────────

    const handleSaveProduct = async (companyId: string) => {
        const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
        const method = editingProduct ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...productForm, companyId }),
            });
            if (res.ok) {
                await fetchCompanies();
                setShowProductForm(null);
                setEditingProduct(null);
                setProductForm(EMPTY_PRODUCT);
            }
        } catch { /* */ }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Delete this product and its overrides?')) return;
        try {
            await fetch(`/api/products/${id}`, { method: 'DELETE' });
            await fetchCompanies();
        } catch { /* */ }
    };

    const handleEditProduct = (product: Product, companyId: string) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name, description: product.description || '',
            type: product.type, dataTypes: product.dataTypes,
            hostingRegions: product.hostingRegions, complianceScope: product.complianceScope,
            techStack: product.techStack || '[]',
        });
        setShowProductForm(companyId);
    };

    const parseTags = (json: string): string[] => {
        try { return JSON.parse(json); } catch { return []; }
    };

    // ════════════════════════════════════════════
    // Render
    // ════════════════════════════════════════════

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-400" />
                        Companies & Products
                    </h3>
                    <p className="text-sm text-muted-foreground">Manage companies and their product-specific CAIQ configurations.</p>
                </div>
                <Button onClick={() => { setEditingCompany(null); setCompanyForm(EMPTY_COMPANY); setShowCompanyForm(true); }} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Company
                </Button>
            </div>

            {/* Company Form Modal */}
            {showCompanyForm && (
                <Card className="border-blue-500/20 bg-card/40 backdrop-blur-sm animate-fade-in">
                    <CardHeader>
                        <CardTitle className="text-lg">{editingCompany ? 'Edit Company' : 'Add New Company'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input placeholder="e.g. AstraLabs DE" value={companyForm.name}
                                    onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Legal Entity</Label>
                                <Input placeholder="e.g. AstraLabs GmbH" value={companyForm.legalEntity}
                                    onChange={e => setCompanyForm({ ...companyForm, legalEntity: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Jurisdiction</Label>
                                <Select value={companyForm.jurisdiction} onValueChange={v => setCompanyForm({ ...companyForm, jurisdiction: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {JURISDICTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Country</Label>
                                <Input placeholder="e.g. DE, US, UK" value={companyForm.country}
                                    onChange={e => setCompanyForm({ ...companyForm, country: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Industry</Label>
                                <Select value={companyForm.industry} onValueChange={v => setCompanyForm({ ...companyForm, industry: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Size</Label>
                                <Select value={companyForm.size} onValueChange={v => setCompanyForm({ ...companyForm, size: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Primary Cloud</Label>
                                <Select value={companyForm.primaryCloud} onValueChange={v => setCompanyForm({ ...companyForm, primaryCloud: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CLOUD_PROVIDERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Certifications (comma-separated)</Label>
                                <Input placeholder="ISO 27001, SOC 2 Type II"
                                    value={parseTags(companyForm.certifications).join(', ')}
                                    onChange={e => setCompanyForm({
                                        ...companyForm,
                                        certifications: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)),
                                    })} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Additional Context</Label>
                                <Textarea placeholder="Any additional context about this company..." value={companyForm.additionalContext || ''}
                                    onChange={e => setCompanyForm({ ...companyForm, additionalContext: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => { setShowCompanyForm(false); setEditingCompany(null); }}>Cancel</Button>
                            <Button onClick={handleSaveCompany} disabled={!companyForm.name || !companyForm.legalEntity}>
                                {editingCompany ? 'Save Changes' : 'Add Company'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Companies List */}
            {companies.length === 0 ? (
                <Card className="border-dashed border-zinc-700">
                    <CardContent className="py-12 text-center">
                        <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                        <p className="text-muted-foreground">No companies yet. Add your first company to start configuring product-specific CAIQ answers.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {companies.map(company => {
                        const certs = parseTags(company.certifications);
                        const isExpanded = expandedCompany === company.id;

                        return (
                            <Card key={company.id} className="border-zinc-800/50 bg-card/20 hover:bg-card/30 transition-colors">
                                <CardContent className="p-0">
                                    {/* Company Row */}
                                    <div className="flex items-center justify-between p-4">
                                        <button
                                            className="flex items-center gap-3 text-left flex-1"
                                            onClick={() => setExpandedCompany(isExpanded ? null : company.id)}
                                        >
                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-blue-400" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                            <Building2 className="h-5 w-5 text-blue-400" />
                                            <div>
                                                <div className="font-medium text-white">{company.name}</div>
                                                <div className="text-xs text-muted-foreground">{company.legalEntity} · {company.jurisdiction}/{company.country}</div>
                                            </div>
                                        </button>

                                        <div className="flex items-center gap-3">
                                            {certs.map(c => (
                                                <Badge key={c} variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">{c}</Badge>
                                            ))}
                                            <Badge className="bg-indigo-500/15 text-indigo-400 border-indigo-500/30">
                                                {company.products?.length || 0} products
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCompany(company)}>
                                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCompany(company.id)}>
                                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded: Products */}
                                    {isExpanded && (
                                        <div className="border-t border-zinc-800/50 bg-zinc-900/30 px-4 py-3 space-y-3 animate-fade-in">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                    <Package className="h-4 w-4" /> Products
                                                </h4>
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                                    onClick={() => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setShowProductForm(company.id); }}>
                                                    <Plus className="h-3 w-3" /> Add Product
                                                </Button>
                                            </div>

                                            {/* Product Form */}
                                            {showProductForm === company.id && (
                                                <Card className="border-emerald-500/20 bg-card/40">
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Product Name</Label>
                                                                <Input placeholder="e.g. CORTEX" value={productForm.name} className="h-8 text-sm"
                                                                    onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Type</Label>
                                                                <Select value={productForm.type} onValueChange={v => setProductForm({ ...productForm, type: v })}>
                                                                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        {PRODUCT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1 md:col-span-2">
                                                                <Label className="text-xs">Description</Label>
                                                                <Input placeholder="What this product does..." value={productForm.description} className="h-8 text-sm"
                                                                    onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Data Types (comma-separated)</Label>
                                                                <Input placeholder="PII, Financial, Health"
                                                                    value={parseTags(productForm.dataTypes).join(', ')} className="h-8 text-sm"
                                                                    onChange={e => setProductForm({
                                                                        ...productForm,
                                                                        dataTypes: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)),
                                                                    })} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Hosting Regions (comma-separated)</Label>
                                                                <Input placeholder="eu-west-1, eu-central-1"
                                                                    value={parseTags(productForm.hostingRegions).join(', ')} className="h-8 text-sm"
                                                                    onChange={e => setProductForm({
                                                                        ...productForm,
                                                                        hostingRegions: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)),
                                                                    })} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Compliance Scope (comma-separated)</Label>
                                                                <Input placeholder="GDPR, NIS2, SOC 2"
                                                                    value={parseTags(productForm.complianceScope).join(', ')} className="h-8 text-sm"
                                                                    onChange={e => setProductForm({
                                                                        ...productForm,
                                                                        complianceScope: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)),
                                                                    })} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Tech Stack (comma-separated)</Label>
                                                                <Input placeholder="Next.js, PostgreSQL, Docker"
                                                                    value={parseTags(productForm.techStack || '[]').join(', ')} className="h-8 text-sm"
                                                                    onChange={e => setProductForm({
                                                                        ...productForm,
                                                                        techStack: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)),
                                                                    })} />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 justify-end">
                                                            <Button variant="outline" size="sm" onClick={() => { setShowProductForm(null); setEditingProduct(null); }}>Cancel</Button>
                                                            <Button size="sm" onClick={() => handleSaveProduct(company.id)} disabled={!productForm.name}>
                                                                {editingProduct ? 'Save' : 'Add Product'}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Products Table */}
                                            {company.products && company.products.length > 0 ? (
                                                <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-zinc-800/50 bg-zinc-900/50">
                                                                <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">Product</th>
                                                                <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">Type</th>
                                                                <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">Regions</th>
                                                                <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">Compliance</th>
                                                                <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">Overrides</th>
                                                                <th className="text-right p-2.5 text-xs font-medium text-muted-foreground">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {company.products.map((product: any) => (
                                                                <tr key={product.id} className="border-b border-zinc-800/20 hover:bg-white/[0.02] group">
                                                                    <td className="p-2.5">
                                                                        <div className="font-medium text-white">{product.name}</div>
                                                                        {product.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</div>}
                                                                    </td>
                                                                    <td className="p-2.5">
                                                                        <Badge variant="outline" className="text-[10px]">{product.type}</Badge>
                                                                    </td>
                                                                    <td className="p-2.5">
                                                                        <div className="flex gap-1 flex-wrap">
                                                                            {parseTags(product.hostingRegions).slice(0, 2).map((r: string) => (
                                                                                <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{r}</span>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2.5">
                                                                        <div className="flex gap-1 flex-wrap">
                                                                            {parseTags(product.complianceScope).map((c: string) => (
                                                                                <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">{c}</span>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2.5">
                                                                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">
                                                                            {product._count?.knowledgeOverrides ?? 0}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="p-2.5 text-right">
                                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-blue-400"
                                                                                onClick={() => {
                                                                                    // Navigate to KB tab pre-filtered to this product
                                                                                    router.push(`/vendors?tab=knowledge&companyId=${company.id}&productId=${product.id}`);
                                                                                }}>
                                                                                <Settings2 className="h-3 w-3" /> Configure CAIQ
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditProduct(product, company.id)}>
                                                                                <Pencil className="h-3 w-3 text-muted-foreground" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteProduct(product.id)}>
                                                                                <Trash2 className="h-3 w-3 text-red-400" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-muted-foreground text-sm">
                                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                    No products yet. Add a product to configure its CAIQ answers.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
