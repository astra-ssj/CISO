"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendorRiskStore, VendorCategory, VendorRiskTier, VendorStatus } from "@/lib/vendor-risk-store";
import { CAIQ_DOMAINS, type AnsweredQuestion, type ConfidenceLevel } from "@/lib/caiq/caiq-knowledge-base";
import KnowledgeTransfer from "@/components/caiq/KnowledgeTransfer";
import Link from "next/link";
import {
    Building2, ShieldAlert, Search, Plus, AlertTriangle, CheckCircle,
    Clock, XCircle, TrendingUp, Users, FileWarning, ChevronDown, ChevronUp,
    Upload, FileSpreadsheet, Brain, Zap, Download, Loader2, Edit3,
    Check, BarChart3, Sparkles, Shield, RefreshCw, ExternalLink
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

const CONFIDENCE_BADGES: Record<ConfidenceLevel, { bg: string; text: string; label: string }> = {
    high: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'High' },
    medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Medium' },
    low: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Low' },
};

// ────────────────────────────────────────────
// CAIQ Processing Result Type (from API)
// ────────────────────────────────────────────
interface CAIQResult {
    totalQuestions: number;
    answeredByKB: number;
    answeredByAI: number;
    unanswered: number;
    coveragePct: number;
    domainBreakdown: Record<string, { total: number; answered: number; pct: number }>;
    questions: AnsweredQuestion[];
}

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

    // CAIQ State
    const [caiqMode, setCaiqMode] = useState<'template' | 'ai'>('ai');
    const [caiqFile, setCaiqFile] = useState<File | null>(null);
    const [caiqLoading, setCaiqLoading] = useState(false);
    const [caiqError, setCaiqError] = useState<string | null>(null);
    const [caiqResult, setCaiqResult] = useState<CAIQResult | null>(null);
    const [caiqExportBase64, setCaiqExportBase64] = useState<string | null>(null);
    const [caiqFilterConf, setCaiqFilterConf] = useState<string>('all');
    const [caiqFilterSource, setCaiqFilterSource] = useState<string>('all');
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [editAnswer, setEditAnswer] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Org profile for AI context
    const [orgProfile, setOrgProfile] = useState({
        industry: 'Technology',
        certifications: 'SOC 2 Type II, ISO 27001',
        orgSize: 'Mid-size (500-5000 employees)',
        cloudProvider: 'AWS',
        additionalContext: '',
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

    // ── CAIQ Handlers ──

    const handleFileSelect = (file: File) => {
        setCaiqFile(file);
        setCaiqError(null);
        setCaiqResult(null);
        setCaiqExportBase64(null);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
            handleFileSelect(file);
        } else {
            setCaiqError('Please upload a .xlsx or .csv file');
        }
    }, []);

    const handleProcessQuestionnaire = async () => {
        if (!caiqFile) return;
        setCaiqLoading(true);
        setCaiqError(null);

        try {
            const formData = new FormData();
            formData.append('file', caiqFile);
            formData.append('mode', caiqMode);
            formData.append('profile', JSON.stringify({
                ...orgProfile,
                certifications: orgProfile.certifications.split(',').map(s => s.trim()),
            }));

            const res = await fetch('/api/vendors/caiq', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Processing failed');
            }

            setCaiqResult(data.result);
            setCaiqExportBase64(data.exportBase64 || null);
        } catch (err: any) {
            setCaiqError(err.message || 'Failed to process questionnaire');
        } finally {
            setCaiqLoading(false);
        }
    };

    const handleExport = () => {
        if (!caiqExportBase64) return;
        const byteChars = atob(caiqExportBase64);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteArray[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteArray], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CAIQ_Completed_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSaveEdit = (rowIndex: number) => {
        if (!caiqResult) return;
        const updated = caiqResult.questions.map(q =>
            q.rowIndex === rowIndex
                ? { ...q, answer: editAnswer, source: 'manual' as const, confidence: 'high' as ConfidenceLevel }
                : q
        );
        setCaiqResult({ ...caiqResult, questions: updated });
        setEditingRow(null);
        setEditAnswer('');
    };

    // Filter CAIQ results
    const filteredCAIQ = caiqResult?.questions.filter(q => {
        if (caiqFilterConf !== 'all' && q.confidence !== caiqFilterConf) return false;
        if (caiqFilterSource !== 'all' && q.source !== caiqFilterSource) return false;
        return true;
    }) || [];

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
                    <TabsTrigger value="transfer" className="gap-2 data-[state=active]:bg-cyan-500/20">
                        <RefreshCw className="h-4 w-4" /> Knowledge Transfer
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
                {/* TAB 2: CAIQ Automation                  */}
                {/* ═══════════════════════════════════════ */}
                <TabsContent value="caiq" className="space-y-6 mt-6">

                    {/* CAIQ Hero Banner */}
                    <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-zinc-900/60 to-indigo-950/40 p-6">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                    <Shield className="h-6 w-6 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">CAIQ Questionnaire Automation</h2>
                                    <p className="text-sm text-zinc-400">Upload a vendor risk questionnaire and auto-fill 80-85% of answers with AI</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                                <div className="flex gap-6">
                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                                        <span>CSA CAIQ v4 Knowledge Base (11 domains)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                        <Brain className="h-3.5 w-3.5 text-indigo-400" />
                                        <span>AI-Enhanced contextual answers</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                                        <span>Excel import & export</span>
                                    </div>
                                </div>
                                <Link href="/vendors/caiq" className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300">
                                    <Shield className="h-4 w-4" />
                                    Tiered assessment (4-tier engine)
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Upload + Configuration Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Upload Card */}
                        <Card className="lg:col-span-2 bg-card/30 border-zinc-800/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Upload className="h-4 w-4 text-violet-400" />
                                    Upload Questionnaire
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Drop zone */}
                                <div
                                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`
                                        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                                        transition-all duration-200
                                        ${isDragging
                                            ? 'border-violet-400 bg-violet-500/5 scale-[1.01]'
                                            : caiqFile
                                                ? 'border-emerald-500/40 bg-emerald-500/5'
                                                : 'border-zinc-700/50 hover:border-zinc-600/60 hover:bg-zinc-800/20'
                                        }
                                    `}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.csv"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileSelect(file);
                                        }}
                                    />
                                    {caiqFile ? (
                                        <div className="space-y-2">
                                            <FileSpreadsheet className="h-10 w-10 mx-auto text-emerald-400" />
                                            <p className="text-sm font-medium text-emerald-400">{caiqFile.name}</p>
                                            <p className="text-xs text-zinc-500">
                                                {(caiqFile.size / 1024).toFixed(1)} KB — Click or drop to replace
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-10 w-10 mx-auto text-zinc-500" />
                                            <p className="text-sm text-zinc-400">
                                                <span className="text-violet-400 font-medium">Click to upload</span> or drag & drop
                                            </p>
                                            <p className="text-xs text-zinc-600">Excel (.xlsx) or CSV files accepted</p>
                                        </div>
                                    )}
                                </div>

                                {/* Mode Toggle */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCaiqMode('template')}
                                        className={`flex-1 p-3 rounded-lg border text-left transition-all ${caiqMode === 'template'
                                            ? 'border-blue-500/40 bg-blue-500/10'
                                            : 'border-zinc-800/50 hover:border-zinc-700/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Zap className={`h-4 w-4 ${caiqMode === 'template' ? 'text-blue-400' : 'text-zinc-500'}`} />
                                            <span className={`text-sm font-medium ${caiqMode === 'template' ? 'text-blue-400' : 'text-zinc-400'}`}>
                                                Template Only
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500">Fast · No API needed · ~60% coverage</p>
                                    </button>
                                    <button
                                        onClick={() => setCaiqMode('ai')}
                                        className={`flex-1 p-3 rounded-lg border text-left transition-all ${caiqMode === 'ai'
                                            ? 'border-violet-500/40 bg-violet-500/10'
                                            : 'border-zinc-800/50 hover:border-zinc-700/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Brain className={`h-4 w-4 ${caiqMode === 'ai' ? 'text-violet-400' : 'text-zinc-500'}`} />
                                            <span className={`text-sm font-medium ${caiqMode === 'ai' ? 'text-violet-400' : 'text-zinc-400'}`}>
                                                AI-Enhanced
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500">AI fills gaps · 80-85% coverage</p>
                                    </button>
                                </div>

                                {/* Process Button */}
                                <Button
                                    onClick={handleProcessQuestionnaire}
                                    disabled={!caiqFile || caiqLoading}
                                    className="w-full gap-2 bg-violet-600 hover:bg-violet-500 text-white py-5"
                                >
                                    {caiqLoading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Processing Questionnaire...</>
                                    ) : (
                                        <><Sparkles className="h-4 w-4" /> Process Questionnaire</>
                                    )}
                                </Button>

                                {caiqError && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                                        {caiqError}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Organization Profile Card */}
                        <Card className="bg-card/30 border-zinc-800/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-indigo-400" />
                                    Organization Profile
                                </CardTitle>
                                <p className="text-xs text-zinc-500">Used by AI to tailor answers to your org</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-400">Industry</Label>
                                    <Input value={orgProfile.industry} className="h-8 text-sm"
                                        onChange={e => setOrgProfile({ ...orgProfile, industry: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-400">Certifications</Label>
                                    <Input value={orgProfile.certifications} className="h-8 text-sm"
                                        placeholder="SOC 2, ISO 27001"
                                        onChange={e => setOrgProfile({ ...orgProfile, certifications: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-400">Organization Size</Label>
                                    <Select value={orgProfile.orgSize} onValueChange={v => setOrgProfile({ ...orgProfile, orgSize: v })}>
                                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Small (1-100 employees)">Small (1-100)</SelectItem>
                                            <SelectItem value="Mid-size (100-1000 employees)">Mid-size (100-1000)</SelectItem>
                                            <SelectItem value="Large (1000-10000 employees)">Large (1000-10,000)</SelectItem>
                                            <SelectItem value="Enterprise (10000+ employees)">Enterprise (10,000+)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-400">Primary Cloud</Label>
                                    <Select value={orgProfile.cloudProvider} onValueChange={v => setOrgProfile({ ...orgProfile, cloudProvider: v })}>
                                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AWS">AWS</SelectItem>
                                            <SelectItem value="Azure">Azure</SelectItem>
                                            <SelectItem value="GCP">GCP</SelectItem>
                                            <SelectItem value="Multi-cloud">Multi-cloud</SelectItem>
                                            <SelectItem value="On-premise">On-premise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-400">Additional Context</Label>
                                    <Textarea value={orgProfile.additionalContext} className="text-sm min-h-[60px]"
                                        placeholder="Any specific technologies, processes, or notes..."
                                        onChange={e => setOrgProfile({ ...orgProfile, additionalContext: e.target.value })} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ═══ Results Section ═══ */}
                    {caiqResult && (
                        <>
                            {/* Results Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <Card className="bg-card/30 border-zinc-800/50">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-white">{caiqResult.totalQuestions}</p>
                                        <p className="text-xs text-zinc-500">Total Questions</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card/30 border-emerald-500/20">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-emerald-400">{caiqResult.coveragePct}%</p>
                                        <p className="text-xs text-zinc-500">Auto-Filled</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card/30 border-blue-500/20">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-blue-400">{caiqResult.answeredByKB}</p>
                                        <p className="text-xs text-zinc-500">From Knowledge Base</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card/30 border-violet-500/20">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-violet-400">{caiqResult.answeredByAI}</p>
                                        <p className="text-xs text-zinc-500">AI-Generated</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card/30 border-amber-500/20">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-amber-400">{caiqResult.unanswered}</p>
                                        <p className="text-xs text-zinc-500">Manual Review</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Domain Breakdown */}
                            {Object.keys(caiqResult.domainBreakdown).length > 0 && (
                                <Card className="bg-card/20 border-zinc-800/50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-indigo-400" />
                                            Domain Coverage
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {Object.entries(caiqResult.domainBreakdown).map(([domain, data]) => (
                                                <div key={domain} className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/30">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs text-zinc-400 truncate">{domain}</span>
                                                        <span className={`text-xs font-mono font-bold ${data.pct >= 80 ? 'text-emerald-400' : data.pct >= 50 ? 'text-amber-400' : 'text-red-400'
                                                            }`}>{data.pct}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${data.pct >= 80 ? 'bg-emerald-500' : data.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${data.pct}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-zinc-600 mt-1">{data.answered}/{data.total} answered</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Answers Table */}
                            <Card className="bg-card/20 border-zinc-800/50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">Questionnaire Answers</CardTitle>
                                        <div className="flex gap-2">
                                            {/* Filters */}
                                            <Select value={caiqFilterConf} onValueChange={setCaiqFilterConf}>
                                                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Confidence" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Confidence</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="low">Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={caiqFilterSource} onValueChange={setCaiqFilterSource}>
                                                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Sources</SelectItem>
                                                    <SelectItem value="knowledge-base">Knowledge Base</SelectItem>
                                                    <SelectItem value="ai">AI Generated</SelectItem>
                                                    <SelectItem value="manual">Manual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {/* Export */}
                                            <Button onClick={handleExport} disabled={!caiqExportBase64} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-500">
                                                <Download className="h-3.5 w-3.5" /> Export Excel
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                        <table className="w-full">
                                            <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
                                                <tr className="border-b border-border/40">
                                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase w-[40px]">#</th>
                                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Question</th>
                                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase w-[60px]">Y/N</th>
                                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Answer</th>
                                                    <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase w-[90px]">Confidence</th>
                                                    <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase w-[90px]">Source</th>
                                                    <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase w-[60px]">Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCAIQ.map((q, idx) => (
                                                    <tr key={q.rowIndex} className="border-b border-border/10 hover:bg-white/[0.02] transition-colors">
                                                        <td className="p-3 text-xs text-zinc-600 font-mono">{idx + 1}</td>
                                                        <td className="p-3 text-xs text-zinc-300 max-w-[300px]">
                                                            <p className="line-clamp-2">{q.questionText}</p>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className={`text-xs font-mono font-bold ${q.yesNo === 'Yes' ? 'text-emerald-400' :
                                                                q.yesNo === 'No' ? 'text-red-400' :
                                                                    q.yesNo === 'N/A' ? 'text-zinc-500' : 'text-zinc-700'
                                                                }`}>{q.yesNo || '—'}</span>
                                                        </td>
                                                        <td className="p-3 max-w-[400px]">
                                                            {editingRow === q.rowIndex ? (
                                                                <div className="flex gap-2">
                                                                    <Textarea
                                                                        value={editAnswer}
                                                                        onChange={e => setEditAnswer(e.target.value)}
                                                                        className="text-xs min-h-[60px]"
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex flex-col gap-1">
                                                                        <Button size="sm" className="h-7 px-2" onClick={() => handleSaveEdit(q.rowIndex)}>
                                                                            <Check className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingRow(null)}>
                                                                            <XCircle className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className={`text-xs line-clamp-3 ${q.answer ? 'text-zinc-300' : 'text-zinc-600 italic'}`}>
                                                                    {q.answer || 'No answer — requires manual input'}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {q.answer && (
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_BADGES[q.confidence].bg} ${CONFIDENCE_BADGES[q.confidence].text}`}>
                                                                    {CONFIDENCE_BADGES[q.confidence].label}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded ${q.source === 'knowledge-base' ? 'bg-blue-500/10 text-blue-400' :
                                                                q.source === 'ai' ? 'bg-violet-500/10 text-violet-400' :
                                                                    'bg-zinc-700/30 text-zinc-500'
                                                                }`}>
                                                                {q.source === 'knowledge-base' ? 'KB' : q.source === 'ai' ? 'AI' : 'Manual'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <Button
                                                                variant="ghost" size="sm"
                                                                className="h-7 w-7 p-0 hover:bg-violet-500/10"
                                                                onClick={() => {
                                                                    setEditingRow(q.rowIndex);
                                                                    setEditAnswer(q.answer || '');
                                                                }}
                                                            >
                                                                <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {filteredCAIQ.length === 0 && (
                                        <div className="p-8 text-center text-zinc-500 text-sm">
                                            No questions match the selected filters.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Empty state when no result */}
                    {!caiqResult && !caiqLoading && (
                        <div className="text-center py-12">
                            <div className="inline-flex p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10 mb-4">
                                <FileSpreadsheet className="h-12 w-12 text-violet-400/40" />
                            </div>
                            <p className="text-zinc-500 text-sm">Upload a questionnaire to get started</p>
                            <p className="text-zinc-600 text-xs mt-1">Supports CAIQ, SIG Lite, and custom vendor questionnaires</p>
                        </div>
                    )}
                </TabsContent>

                {/* ═══════════════════════════════════════ */}
                {/* TAB 3: Knowledge Transfer               */}
                {/* ═══════════════════════════════════════ */}
                <TabsContent value="transfer" className="space-y-6 mt-6">
                    <KnowledgeTransfer />
                </TabsContent>
            </Tabs>
        </div>
    );
}
