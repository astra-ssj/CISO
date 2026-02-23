"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendorRiskStore, VendorCategory, VendorRiskTier, VendorStatus } from "@/lib/vendor-risk-store";
import CAIQWizard from "@/components/caiq/CAIQWizard";
import {
    Building2, ShieldAlert, Search, Plus, AlertTriangle, CheckCircle,
    Clock, XCircle, TrendingUp, Users, FileWarning, ChevronDown, ChevronUp,
    FileSpreadsheet
} from "lucide-react";

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const RISK_TIER_COLORS: Record<VendorRiskTier, string> = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const STATUS_ICONS: Record<VendorStatus, React.ReactNode> = {
    APPROVED: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    UNDER_REVIEW: <Clock className="h-4 w-4 text-yellow-400" />,
    REJECTED: <XCircle className="h-4 w-4 text-red-400" />,
    PENDING: <AlertTriangle className="h-4 w-4 text-orange-400" />,
};

const CATEGORY_LABELS: Record<VendorCategory, string> = {
    CLOUD_INFRASTRUCTURE: 'Cloud Infrastructure',
    SAAS: 'SaaS',
    SECURITY: 'Security',
    DATA_PROCESSING: 'Data Processing',
    CONSULTING: 'Consulting',
    OTHER: 'Other',
};



// ════════════════════════════════════════════
// Main Page Component
// ════════════════════════════════════════════

export default function VendorsPage() {
    const { vendors, addVendor, removeVendor, getCriticalVendorCount, getAverageRiskScore, getPendingReviewCount } = useVendorRiskStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTier, setFilterTier] = useState<string>('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

    // New vendor form state
    const [newVendor, setNewVendor] = useState({
        name: '', category: 'SAAS' as VendorCategory, description: '',
        status: 'PENDING' as VendorStatus, riskScore: 50,
        dataAccess: [] as string[], complianceCertifications: [] as string[],
        contractExpiry: '', lastAssessment: '', contactName: '', contactEmail: '', notes: ''
    });


    const filteredVendors = vendors.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = filterTier === 'all' || v.riskTier === filterTier;
        return matchesSearch && matchesTier;
    });

    const handleAddVendor = () => {
        addVendor({
            ...newVendor,
            dataAccess: newVendor.dataAccess as any[],
            complianceCertifications: newVendor.complianceCertifications
        });
        setShowAddForm(false);
        setNewVendor({
            name: '', category: 'SAAS', description: '',
            status: 'PENDING', riskScore: 50,
            dataAccess: [], complianceCertifications: [],
            contractExpiry: '', lastAssessment: '', contactName: '', contactEmail: '', notes: ''
        });
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <Building2 className="h-8 w-8 text-primary" />
                            Vendor Risk Management
                        </h1>
                        <p className="text-muted-foreground">Assess, monitor, and manage third-party vendor risk across your supply chain.</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="vendors" className="w-full">
                <TabsList className="bg-zinc-900/60 border border-zinc-800/50">
                    <TabsTrigger value="vendors" className="gap-2 data-[state=active]:bg-primary/20">
                        <Building2 className="h-4 w-4" /> Vendor Registry
                    </TabsTrigger>
                    <TabsTrigger value="caiq" className="gap-2 data-[state=active]:bg-violet-500/20">
                        <FileSpreadsheet className="h-4 w-4" /> CAIQ Automation
                    </TabsTrigger>
                </TabsList>

                {/* ═══════════════════════════════════════ */}
                {/* TAB 1: Vendor Registry (Original)       */}
                {/* ═══════════════════════════════════════ */}
                <TabsContent value="vendors" className="space-y-6 mt-6">
                    {/* Hero Metrics */}
                    <div className="flex justify-end">
                        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
                            <Plus className="h-4 w-4" /> Add Vendor
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-card/30 border-primary/20 backdrop-blur-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{vendors.length}</p>
                                    <p className="text-xs text-muted-foreground">Total Vendors</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-red-500/20 backdrop-blur-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10"><ShieldAlert className="h-5 w-5 text-red-400" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-red-400">{getCriticalVendorCount()}</p>
                                    <p className="text-xs text-muted-foreground">High/Critical Risk</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-yellow-500/20 backdrop-blur-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-yellow-500/10"><TrendingUp className="h-5 w-5 text-yellow-400" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-yellow-400">{getAverageRiskScore()}</p>
                                    <p className="text-xs text-muted-foreground">Avg Risk Score</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-orange-500/20 backdrop-blur-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10"><FileWarning className="h-5 w-5 text-orange-400" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-orange-400">{getPendingReviewCount()}</p>
                                    <p className="text-xs text-muted-foreground">Pending Review</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Add Vendor Form */}
                    {showAddForm && (
                        <Card className="bg-card/40 border-primary/20 backdrop-blur-sm animate-fade-in">
                            <CardHeader><CardTitle className="text-lg">Add New Vendor</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Vendor Name</Label>
                                        <Input placeholder="e.g. Acme Cloud Services" value={newVendor.name}
                                            onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select value={newVendor.category} onValueChange={v => setNewVendor({ ...newVendor, category: v as VendorCategory })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                                                    <SelectItem key={k} value={k}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Description</Label>
                                        <Textarea placeholder="What does this vendor provide?" value={newVendor.description}
                                            onChange={e => setNewVendor({ ...newVendor, description: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Initial Risk Score (0-100)</Label>
                                        <Input type="number" min={0} max={100} value={newVendor.riskScore}
                                            onChange={e => setNewVendor({ ...newVendor, riskScore: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contract Expiry</Label>
                                        <Input type="date" value={newVendor.contractExpiry}
                                            onChange={e => setNewVendor({ ...newVendor, contractExpiry: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contact Name</Label>
                                        <Input placeholder="e.g. John Smith" value={newVendor.contactName}
                                            onChange={e => setNewVendor({ ...newVendor, contactName: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contact Email</Label>
                                        <Input type="email" placeholder="e.g. john@vendor.com" value={newVendor.contactEmail}
                                            onChange={e => setNewVendor({ ...newVendor, contactEmail: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                                    <Button onClick={handleAddVendor} disabled={!newVendor.name}>Add Vendor</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Search & Filter */}
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search vendors..." className="pl-10" value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <Select value={filterTier} onValueChange={setFilterTier}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by risk" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Risk Tiers</SelectItem>
                                <SelectItem value="CRITICAL">Critical</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Vendor Table */}
                    <Card className="bg-card/20 border-primary/10">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/40">
                                            <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendor</th>
                                            <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                                            <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk</th>
                                            <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                            <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Access</th>
                                            <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Assessed</th>
                                            <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVendors.map(vendor => (
                                            <tr key={vendor.id} className="border-b border-border/20 hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4">
                                                    <button onClick={() => setExpandedVendor(expandedVendor === vendor.id ? null : vendor.id)}
                                                        className="flex items-center gap-2 text-left group-hover:text-primary transition-colors">
                                                        {expandedVendor === vendor.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 opacity-40" />}
                                                        <div>
                                                            <div className="font-medium text-white">{vendor.name}</div>
                                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{vendor.description}</div>
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs px-2 py-1 rounded bg-secondary/50 text-secondary-foreground">
                                                        {CATEGORY_LABELS[vendor.category]}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <Badge className={`${RISK_TIER_COLORS[vendor.riskTier]} border font-mono`}>
                                                        {vendor.riskScore} — {vendor.riskTier}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <span className="flex items-center gap-1.5 text-sm">
                                                        {STATUS_ICONS[vendor.status]}
                                                        {vendor.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {vendor.dataAccess.map(d => (
                                                            <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                                                {d}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-muted-foreground">{vendor.lastAssessment || '—'}</td>
                                                <td className="p-4 text-right">
                                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeVendor(vendor.id)}>Remove</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Expanded Detail Panel */}
                            {expandedVendor && (() => {
                                const vendor = vendors.find(v => v.id === expandedVendor);
                                if (!vendor) return null;
                                return (
                                    <div className="p-6 border-t border-border/20 bg-background/30 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Contact</h4>
                                                <p className="text-white">{vendor.contactName}</p>
                                                <p className="text-primary text-sm">{vendor.contactEmail}</p>
                                                <p className="text-xs text-muted-foreground mt-2">Contract expires: {vendor.contractExpiry}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Certifications</h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {vendor.complianceCertifications.map(c => (
                                                        <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Assessment History ({vendor.assessmentHistory.length})</h4>
                                                {vendor.assessmentHistory.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {vendor.assessmentHistory.map(a => (
                                                            <div key={a.id} className="text-xs p-2 rounded bg-background/40 border border-border/20">
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">{a.date}</span>
                                                                    <Badge className={RISK_TIER_COLORS[a.score >= 75 ? 'CRITICAL' : a.score >= 50 ? 'HIGH' : a.score >= 25 ? 'MEDIUM' : 'LOW']}>
                                                                        Score: {a.score}
                                                                    </Badge>
                                                                </div>
                                                                {a.findings.length > 0 && (
                                                                    <ul className="mt-1 text-muted-foreground space-y-0.5">
                                                                        {a.findings.map((f, i) => <li key={i}>• {f}</li>)}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : <p className="text-xs text-muted-foreground">No assessments yet.</p>}
                                            </div>
                                        </div>
                                        {vendor.notes && (
                                            <div className="mt-4 p-3 rounded bg-yellow-500/5 border border-yellow-500/10">
                                                <span className="text-xs text-yellow-400">Notes: </span>
                                                <span className="text-xs text-muted-foreground">{vendor.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {filteredVendors.length === 0 && (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No vendors match your search criteria.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══════════════════════════════════════ */}
                {/* TAB 2: CAIQ Automation (New Wizard)     */}
                {/* ═══════════════════════════════════════ */}
                <TabsContent value="caiq" className="mt-6">
                    <CAIQWizard />
                </TabsContent>

            </Tabs>
        </div>
    );
}
