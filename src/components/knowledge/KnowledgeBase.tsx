'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    BookOpen, Search, Filter, CheckCircle2, Clock, TrendingUp,
    Database, ChevronDown, ChevronUp, Shield, Trash2,
    Plus, Download, Upload, RefreshCw, Pencil, X, Save, BarChart3,
    Globe, Building2, Package, Layers, FileJson
} from 'lucide-react';
import { useCompanyProductStore } from '@/lib/company-product-store';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface KnowledgeEntry {
    id: string;
    questionText: string;
    questionNormalized: string;
    keywords: string;
    domain: string;
    category: string;
    answerType: string;
    answerText: string;
    evidence?: string;
    frameworks?: string;
    source: string;
    approvedBy?: string;
    approvedAt?: string;
    confidence: number;
    usageCount: number;
    lastUsed?: string;
    jurisdiction?: string;
    tags?: string;
    createdAt: string;
    updatedAt: string;
}

interface KnowledgeStats {
    total: number;
    approved: number;
    domainBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    avgConfidence: number;
    totalUsage: number;
    topUsed: { id: string; questionText: string; usageCount: number; domain: string }[];
    growthBreakdown?: Record<string, number>;
}

interface SearchResult {
    entries: KnowledgeEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
    'A&A': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'AIS': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    'BCR': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'CCC': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'CEK': 'bg-red-500/15 text-red-400 border-red-500/30',
    'DSP': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    'GRC': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    'HRS': 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    'IAM': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    'IVS': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    'SEF': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'CUSTOM': 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    'Cloud Security': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    'Application Security': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
};

const CONFIDENCE_COLORS: Record<string, string> = {
    high: 'bg-emerald-500/15 text-emerald-400',
    medium: 'bg-amber-500/15 text-amber-400',
    low: 'bg-red-500/15 text-red-400',
};

function getConfidenceLabel(c: number): string {
    if (c >= 0.8) return 'high';
    if (c >= 0.5) return 'medium';
    return 'low';
}

// ════════════════════════════════════════════
// KnowledgeBase Component (Tab embedded)
// ════════════════════════════════════════════

export function KnowledgeBase() {
    // State
    const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
    const [stats, setStats] = useState<KnowledgeStats | null>(null);
    const [filterOptions, setFilterOptions] = useState<{ domains: string[]; categories: string[]; sources: string[] }>({ domains: [], categories: [], sources: [] });
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [domainFilter, setDomainFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Expanded & Edit row
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    // Import / Export
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Add Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEntry, setNewEntry] = useState({ question: '', answer: '', category: 'General', domain: 'CUSTOM' });

    // Analytics Dashboard Toggle
    const [showAnalytics, setShowAnalytics] = useState(false);

    // 3-Layer Override State
    const { selectedCompanyId, selectedProductId, contextLabel } = useCompanyProductStore();
    const [overrideStats, setOverrideStats] = useState({ company: 0, product: 0 });
    const [viewMode, setViewMode] = useState<'merged' | 'layers'>('merged');
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideBase, setOverrideBase] = useState<KnowledgeEntry | null>(null);
    const [overrideForm, setOverrideForm] = useState({ answerType: 'YES', answerText: '', notes: '' });

    // ─── Data Fetching ───────────────────────

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/knowledge?stats=true');
            if (res.ok) setStats(await res.json());
        } catch (e) { console.error('Failed to fetch stats', e); }
    }, []);

    const fetchFilters = useCallback(async () => {
        try {
            const res = await fetch('/api/knowledge?filters=true');
            if (res.ok) setFilterOptions(await res.json());
        } catch (e) { console.error('Failed to fetch filters', e); }
    }, []);

    const fetchEntries = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(p));
            params.set('pageSize', '30');
            if (searchQuery) params.set('q', searchQuery);
            if (domainFilter) params.set('domain', domainFilter);
            if (categoryFilter) params.set('category', categoryFilter);
            if (sourceFilter) params.set('source', sourceFilter);

            const res = await fetch(`/api/knowledge?${params}`);
            if (res.ok) {
                const data: SearchResult = await res.json();
                setEntries(data.entries);
                setTotal(data.total);
                setPage(data.page);
                setTotalPages(data.totalPages);
            }
        } catch (e) { console.error('Failed to fetch entries', e); }
        setLoading(false);
    }, [searchQuery, domainFilter, categoryFilter, sourceFilter]);

    useEffect(() => { fetchStats(); fetchFilters(); }, [fetchStats, fetchFilters]);
    useEffect(() => { fetchEntries(1); }, [fetchEntries]);

    // Fetch override counts for current context
    useEffect(() => {
        const fetchOverrideStats = async () => {
            try {
                let companyOverrides = 0;
                let productOverrides = 0;
                if (selectedCompanyId) {
                    const res = await fetch(`/api/knowledge-overrides?scope=COMPANY&companyId=${selectedCompanyId}`);
                    if (res.ok) { const data = await res.json(); companyOverrides = data.length; }
                }
                if (selectedProductId) {
                    const res = await fetch(`/api/knowledge-overrides?scope=PRODUCT&productId=${selectedProductId}`);
                    if (res.ok) { const data = await res.json(); productOverrides = data.length; }
                }
                setOverrideStats({ company: companyOverrides, product: productOverrides });
            } catch { /* silent */ }
        };
        fetchOverrideStats();
    }, [selectedCompanyId, selectedProductId]);

    // ─── Actions ─────────────────────────────

    const handleApprove = async (id: string, customPayload?: any) => {
        try {
            await fetch(`/api/knowledge/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customPayload || { action: 'approve', approvedBy: 'CISO' }),
            });
            fetchEntries(page);
            fetchStats();
        } catch (e) { console.error('Failed to update', e); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this knowledge entry?')) return;
        try {
            await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
            fetchEntries(page);
            fetchStats();
        } catch (e) { console.error('Failed to delete', e); }
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setEditingId(null);
        await handleApprove(editingId, { answerText: editContent });
    };

    const handleAddEntry = async () => {
        if (!newEntry.question || !newEntry.answer) return alert('Question and Answer required');
        try {
            await fetch('/api/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionText: newEntry.question,
                    answerText: newEntry.answer,
                    domain: newEntry.domain,
                    category: newEntry.category,
                    answerType: newEntry.answer.toLowerCase().startsWith('yes') ? 'YES' : 'CONDITIONAL',
                    confidence: 1.0,
                    source: 'Manual Entry'
                }),
            });
            setShowAddModal(false);
            setNewEntry({ question: '', answer: '', category: 'General', domain: 'CUSTOM' });
            fetchEntries(1);
            fetchStats();
            fetchFilters();
        } catch (e) { console.error('Failed to add entry', e); }
    };

    const handleExport = async (format: 'xlsx' | 'json' = 'xlsx') => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            if (format === 'json') params.set('format', 'json');
            if (selectedCompanyId) params.set('companyId', selectedCompanyId);
            if (selectedProductId) params.set('productId', selectedProductId);
            const res = await fetch(`/api/knowledge/export?${params}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = format === 'json' ? 'knowledge_base_export.json' : 'knowledge_base_export.xlsx';
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (e) { console.error('Export failed', e); }
        setIsExporting(false);
    };

    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleImportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/knowledge/import', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchEntries(1);
                fetchStats();
                fetchFilters();
            } else {
                alert(`Import failed: ${data.error}`);
            }
        } catch (err) {
            console.error('Import error', err);
            alert('An error occurred during import.');
        }
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ─── Render ──────────────────────────────

    return (
        <>
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <section className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <BookOpen className="h-7 w-7 text-primary" />
                            Organizational Knowledge Repository
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Permanent intelligence layer — {stats?.total || 0} entries across {Object.keys(stats?.domainBreakdown || {}).length} domains
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .json" onChange={handleImportUpload} />
                        <Button variant="outline" size="sm" onClick={handleImportClick} disabled={isImporting} className="gap-2">
                            <Upload className="h-4 w-4" /> {isImporting ? 'Importing...' : 'Import'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')} disabled={isExporting} className="gap-2">
                            <Download className="h-4 w-4" /> Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExport('json')} disabled={isExporting} className="gap-2">
                            <FileJson className="h-4 w-4" /> JSON
                        </Button>
                        <Button variant="default" size="sm" className="bg-primary text-primary-foreground gap-2" onClick={() => setShowAddModal(true)}>
                            <Plus className="h-4 w-4" /> New Entry
                        </Button>
                    </div>
                </section>

                {/* 3-Layer Stats Bar */}
                {stats && (
                    <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        <StatCard label="Common Entries" value={stats.total} icon={<Globe className="h-4 w-4" />} color="text-blue-400" />
                        <StatCard label="Company Overrides" value={overrideStats.company} icon={<Building2 className="h-4 w-4" />} color="text-indigo-400" />
                        <StatCard label="Product Overrides" value={overrideStats.product} icon={<Package className="h-4 w-4" />} color="text-emerald-400" />
                        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle2 className="h-4 w-4" />} color="text-emerald-400" />
                        <StatCard label="Time Saved" value={`${Math.round((stats.totalUsage * 5) / 60)} hrs`} icon={<Clock className="h-4 w-4" />} color="text-amber-400" />
                        <StatCard label="Total Reuses" value={stats.totalUsage} icon={<RefreshCw className="h-4 w-4" />} color="text-cyan-400" />
                        <div
                            className="bg-card/50 backdrop-blur-sm border rounded-xl flex flex-col justify-center items-center cursor-pointer hover:bg-card hover:border-primary/50 transition-colors"
                            onClick={() => setShowAnalytics(!showAnalytics)}
                        >
                            <BarChart3 className="h-5 w-5 text-primary mb-1" />
                            <span className="text-sm font-medium">Analytics</span>
                        </div>
                    </section>
                )}

                {/* Analytics Dashboard (Collapsible) */}
                {showAnalytics && stats && (
                    <section className="bg-card border border-border/50 rounded-xl p-6 space-y-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Repository Analytics</h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Domain Breakdown */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground">Entries by Domain</h4>
                                <div className="space-y-2">
                                    {Object.entries(stats.domainBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([d, c]) => (
                                        <div key={d} className="flex items-center gap-3">
                                            <div className="w-24 text-xs truncate" title={d}>{d}</div>
                                            <div className="flex-1 bg-muted/50 rounded-full h-2">
                                                <div className={`${DOMAIN_COLORS[d]?.split(' ')[0] || 'bg-primary'} h-2 rounded-full`} style={{ width: `${(c / stats.total) * 100}%` }} />
                                            </div>
                                            <div className="w-8 text-xs text-right text-muted-foreground">{c}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Reused Questions */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground">Most Reused Answers (ROI)</h4>
                                <div className="max-h-[200px] overflow-y-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/50 text-muted-foreground uppercase sticky top-0 z-10 backdrop-blur-md">
                                            <tr>
                                                <th className="px-3 py-2">Question Pattern</th>
                                                <th className="px-3 py-2 w-16 text-center">Uses</th>
                                                <th className="px-3 py-2 w-24">Domain</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/20">
                                            {stats.topUsed?.map(tu => (
                                                <tr key={tu.id} className="hover:bg-muted/20">
                                                    <td className="px-3 py-2 truncate max-w-[200px]" title={tu.questionText}>{tu.questionText}</td>
                                                    <td className="px-3 py-2 text-center font-medium text-primary">{tu.usageCount}</td>
                                                    <td className="px-3 py-2"><Badge variant="outline" className="text-[9px] px-1 py-0">{tu.domain}</Badge></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Growth & Coverage Gaps */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Repository Growth</h4>
                            <div className="space-y-2 border border-border/50 rounded-md p-3 bg-background/50">
                                {stats.growthBreakdown && Object.keys(stats.growthBreakdown).length > 0 ? (
                                    Object.entries(stats.growthBreakdown)
                                        .sort((a, b) => b[0].localeCompare(a[0])) // latest first
                                        .slice(0, 5) // show last 5 months
                                        .map(([month, count]) => (
                                            <div key={month} className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-zinc-300">{month}</span>
                                                <span className="text-emerald-400">+{count} entries</span>
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-xs text-muted-foreground text-center py-2">No growth data</div>
                                )}
                            </div>

                            <h4 className="text-sm font-medium text-muted-foreground mt-4">Coverage Gaps (&lt; 10 Entries)</h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(stats.domainBreakdown)
                                    .filter(([_, count]) => count < 10)
                                    .sort((a, b) => a[1] - b[1])
                                    .map(([d, count]) => (
                                        <Badge key={d} variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 text-xs py-0.5">
                                            {d} ({count})
                                        </Badge>
                                    ))}
                                {Object.entries(stats.domainBreakdown).filter(([_, c]) => c < 10).length === 0 && (
                                    <span className="text-xs text-muted-foreground">No significant coverage gaps to display.</span>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* Domain Chips */}
                {
                    stats && Object.keys(stats.domainBreakdown).length > 0 && (
                        <section className="flex flex-wrap gap-2">
                            {Object.entries(stats.domainBreakdown)
                                .sort((a, b) => b[1] - a[1])
                                .map(([domain, count]) => (
                                    <button
                                        key={domain}
                                        onClick={() => setDomainFilter(domainFilter === domain ? '' : domain)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${DOMAIN_COLORS[domain] || DOMAIN_COLORS['CUSTOM']
                                            } ${domainFilter === domain ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : 'opacity-80 hover:opacity-100'}`}
                                    >
                                        {domain} · {count}
                                    </button>
                                ))}
                        </section>
                    )
                }

                {/* Search & Filters */}
                <section className="space-y-3">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search questions, answers, keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1">
                            <Filter className="h-4 w-4" /> Filters
                            {(domainFilter || categoryFilter || sourceFilter) && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                                    {[domainFilter, categoryFilter, sourceFilter].filter(Boolean).length}
                                </Badge>
                            )}
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg border border-border/50 bg-card/50">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Domain</label>
                                <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                                    <option value="">All Domains</option>
                                    {filterOptions.domains.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                                    <option value="">All Categories</option>
                                    {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Source</label>
                                <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                                    <option value="">All Sources</option>
                                    {filterOptions.sources.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </section>

                {/* Results Count */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{total} entries found</span>
                    <span>Page {page} of {totalPages}</span>
                </div>

                {/* Entries Table */}
                <section className="space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>
                    ) : entries.length === 0 ? (
                        <Card><CardContent className="py-16 text-center text-muted-foreground"><Database className="h-12 w-12 mx-auto mb-4 opacity-30" /><p className="font-medium">No knowledge entries found</p></CardContent></Card>
                    ) : (
                        entries.map(entry => (
                            <Card key={entry.id} className={`transition-all hover:border-primary/30 ${expandedId === entry.id ? 'border-primary/50 shadow-lg ring-1 ring-primary/20' : ''}`}>
                                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                                    <div className="flex items-start gap-3">
                                        <Badge variant="outline" className={`shrink-0 text-[10px] font-bold px-2 py-0.5 ${DOMAIN_COLORS[entry.domain] || DOMAIN_COLORS['CUSTOM']}`}>{entry.domain}</Badge>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-snug line-clamp-2">{entry.questionText}</p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                                <span>{entry.category}</span>
                                                <span>·</span>
                                                <span className={CONFIDENCE_COLORS[getConfidenceLabel(entry.confidence)]}>{Math.round(entry.confidence * 100)}% confidence</span>
                                                <span>·</span>
                                                <span>Used {entry.usageCount}×</span>
                                                {entry.approvedAt && (
                                                    <><span className="hidden sm:inline">·</span><span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</span></>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-2">
                                            {/* Layer Source Badge */}
                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-violet-500/30 text-violet-300">
                                                <Globe className="h-2.5 w-2.5 mr-0.5" /> Common
                                            </Badge>
                                            {expandedId === entry.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {expandedId === entry.id && (
                                    <div className="border-t border-border/50 p-4 bg-muted/5 space-y-4">
                                        {/* Answer Section with Inline Edit */}
                                        <div className="relative group">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Approved Answer ({entry.answerType})
                                                </h4>
                                                {editingId !== entry.id && (
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setEditingId(entry.id); setEditContent(entry.answerText); }}>
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>

                                            {editingId === entry.id ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        className="w-full min-h-[100px] bg-background border border-border rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" className="bg-primary" onClick={handleSaveEdit}><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
                                                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.answerText}</p>
                                            )}
                                        </div>

                                        {/* Metadata Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-background/50 p-3 rounded-md border border-border/30">
                                            <div><span className="text-muted-foreground">Source</span><p className="font-medium mt-0.5 truncate" title={entry.source}>{entry.source}</p></div>
                                            <div><span className="text-muted-foreground">Evidence</span><p className="font-medium mt-0.5 truncate" title={entry.evidence}>{entry.evidence || '—'}</p></div>
                                            <div><span className="text-muted-foreground">Jurisdiction</span><p className="font-medium mt-0.5">{entry.jurisdiction || 'Global'}</p></div>
                                            <div><span className="text-muted-foreground">Last Used</span><p className="font-medium mt-0.5">{entry.lastUsed ? new Date(entry.lastUsed).toLocaleDateString() : 'Never'}</p></div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2 border-t border-border/30">
                                            {!entry.approvedAt && (
                                                <Button size="sm" variant="outline" className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handleApprove(entry.id)}>
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                                                </Button>
                                            )}
                                            {(selectedCompanyId || selectedProductId) && (
                                                <Button size="sm" variant="outline" className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
                                                    onClick={() => { setOverrideBase(entry); setOverrideForm({ answerType: entry.answerType, answerText: entry.answerText, notes: '' }); setShowOverrideModal(true); }}>
                                                    <Layers className="h-3.5 w-3.5 mr-1" /> Create Override
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => handleDelete(entry.id)}>
                                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </section>

                {/* Pagination */}
                {
                    totalPages > 1 && (
                        <section className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchEntries(page - 1)}>Previous</Button>
                            <span className="text-sm text-muted-foreground px-4">Page {page} of {totalPages}</span>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchEntries(page + 1)}>Next</Button>
                        </section>
                    )
                }

                {/* Add New Entry Modal overlay (simple modal without Dialog import) */}
                {
                    showAddModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                            <Card className="w-full max-w-lg shadow-2xl border-primary/20">
                                <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
                                    <CardTitle>Add Knowledge Entry</CardTitle>
                                    <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}><X className="h-4 w-4" /></Button>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Question</label>
                                        <Input placeholder="e.g. Do you have a SOC 2 report?" value={newEntry.question} onChange={e => setNewEntry({ ...newEntry, question: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Answer</label>
                                        <textarea className="w-full min-h-[100px] bg-background border border-border rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="Detailed response..." value={newEntry.answer} onChange={e => setNewEntry({ ...newEntry, answer: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Domain</label>
                                            <Input placeholder="e.g. GRC" value={newEntry.domain} onChange={e => setNewEntry({ ...newEntry, domain: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Category</label>
                                            <Input placeholder="e.g. Compliance" value={newEntry.category} onChange={e => setNewEntry({ ...newEntry, category: e.target.value })} />
                                        </div>
                                    </div>
                                    <Button className="w-full mt-4" onClick={handleAddEntry}>Save Entry</Button>
                                </CardContent>
                            </Card>
                        </div>
                    )
                }
            </div >

            {/* Override Creation Modal */}
            {
                showOverrideModal && overrideBase && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <Card className="w-full max-w-lg shadow-2xl border-indigo-500/20">
                            <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-indigo-400" />
                                    Create {selectedProductId ? 'Product' : 'Company'} Override
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setShowOverrideModal(false)}><X className="h-4 w-4" /></Button>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1">Base Question (Common KB)</p>
                                    <p className="text-sm font-medium">{overrideBase?.questionText}</p>
                                    <p className="text-xs text-muted-foreground mt-2">Common Answer: {overrideBase?.answerText?.slice(0, 100)}...</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Override Answer Type</label>
                                    <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={overrideForm.answerType}
                                        onChange={e => setOverrideForm({ ...overrideForm, answerType: e.target.value })}>
                                        <option value="YES">YES</option>
                                        <option value="NO">NO</option>
                                        <option value="NA">N/A</option>
                                        <option value="CONDITIONAL">CONDITIONAL</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Override Answer</label>
                                    <textarea className="w-full min-h-[100px] bg-background border border-border rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="Your company/product-specific answer..." value={overrideForm.answerText}
                                        onChange={e => setOverrideForm({ ...overrideForm, answerText: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Notes (why this differs)</label>
                                    <Input placeholder="e.g. Different due to regional requirements" value={overrideForm.notes}
                                        onChange={e => setOverrideForm({ ...overrideForm, notes: e.target.value })} />
                                </div>
                                <Button className="w-full" onClick={async () => {
                                    if (!overrideBase) return;
                                    try {
                                        await fetch('/api/knowledge-overrides', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                knowledgeEntryId: overrideBase.id,
                                                scope: selectedProductId ? 'PRODUCT' : 'COMPANY',
                                                companyId: selectedCompanyId,
                                                productId: selectedProductId,
                                                questionText: overrideBase.questionText,
                                                answerType: overrideForm.answerType,
                                                answerText: overrideForm.answerText,
                                                notes: overrideForm.notes,
                                            }),
                                        });
                                        setShowOverrideModal(false);
                                        setOverrideBase(null);
                                        alert('Override created successfully!');
                                    } catch { alert('Failed to create override'); }
                                }}>Create Override</Button>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </>
    );
}

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
    return (
        <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className={`${color} mb-2`}>{icon}</span>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</p>
            </CardContent>
        </Card>
    );
}
