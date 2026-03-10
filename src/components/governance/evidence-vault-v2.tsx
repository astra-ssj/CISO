/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Search, Upload, FileText, Image, FileSpreadsheet, File, Archive,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Download, Link2, Trash2, Eye, Clock, CheckCircle, AlertTriangle,
    XCircle, LayoutGrid, List, X, Plus, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───

interface EvidenceLink {
    id: string;
    evidenceId: string;
    linkType: string;
    linkId: string;
    linkName: string;
    createdAt: string;
}

interface EvidenceItem {
    id: string;
    title: string;
    description: string | null;
    fileName: string;
    fileSize: number;
    mimeType: string;
    filePath: string;
    category: string;
    status: string;
    expiresAt: string | null;
    uploadedBy: string;
    uploadedByName: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    tags: string[];
    frameworks: string[];
    companyId: string | null;
    metadata: Record<string, unknown> | null;
    links: EvidenceLink[];
    createdAt: string;
    updatedAt: string;
}

interface EvidenceStats {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    totalSize: number;
}

// ─── Style constants ───

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    POLICY: <FileText className="h-5 w-5" />,
    CERTIFICATE: <Shield className="h-5 w-5" />,
    REPORT: <FileSpreadsheet className="h-5 w-5" />,
    SCREENSHOT: <Image className="h-5 w-5" />,
    CONFIG: <File className="h-5 w-5" />,
    ASSESSMENT: <CheckCircle className="h-5 w-5" />,
    TRAINING: <FileText className="h-5 w-5" />,
    CONTRACT: <FileText className="h-5 w-5" />,
    AUDIT_REPORT: <Shield className="h-5 w-5" />,
    PENETRATION_TEST: <AlertTriangle className="h-5 w-5" />,
    OTHER: <Archive className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
    POLICY: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    CERTIFICATE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    REPORT: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    SCREENSHOT: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    CONFIG: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    ASSESSMENT: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    TRAINING: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    CONTRACT: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    AUDIT_REPORT: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    PENETRATION_TEST: "bg-red-500/15 text-red-400 border-red-500/30",
    OTHER: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const STATUS_STYLES: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    ACTIVE: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Active" },
    EXPIRED: { icon: <XCircle className="h-3.5 w-3.5" />, color: "bg-red-500/15 text-red-400 border-red-500/30", label: "Expired" },
    ARCHIVED: { icon: <Archive className="h-3.5 w-3.5" />, color: "bg-slate-500/15 text-slate-400 border-slate-500/30", label: "Archived" },
    PENDING_REVIEW: { icon: <Clock className="h-3.5 w-3.5" />, color: "bg-amber-500/15 text-amber-400 border-amber-500/30", label: "Pending Review" },
};

const CATEGORIES = [
    "POLICY", "CERTIFICATE", "REPORT", "SCREENSHOT", "CONFIG",
    "ASSESSMENT", "TRAINING", "CONTRACT", "AUDIT_REPORT", "PENETRATION_TEST", "OTHER",
];

// ─── Helpers ───

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function expiryIndicator(expiresAt: string | null): { color: string; label: string } | null {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return { color: "bg-zinc-800 text-zinc-300", label: "Expired" };
    if (days <= 7) return { color: "bg-red-500/15 text-red-400", label: `${days}d left` };
    if (days <= 30) return { color: "bg-orange-500/15 text-orange-400", label: `${days}d left` };
    if (days <= 90) return { color: "bg-amber-500/15 text-amber-400", label: `${days}d left` };
    return { color: "bg-emerald-500/10 text-emerald-400", label: `${days}d left` };
}

// ─── Main Component ───

export function EvidenceVaultV2() {
    const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
    const [stats, setStats] = useState<EvidenceStats>({ total: 0, active: 0, expiringSoon: 0, expired: 0, totalSize: 0 });
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"table" | "grid">("table");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;

    // Filters
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");

    // Upload modal
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadMeta, setUploadMeta] = useState({ title: "", description: "", category: "OTHER", tags: "", frameworks: "", expiresAt: "" });

    // Detail panel
    const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

    // Link modal
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkForm, setLinkForm] = useState({ linkType: "COMPLIANCE_CONTROL", linkId: "", linkName: "" });

    const fetchEvidence = useCallback(async () => {
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (search.trim()) params.set("search", search.trim());
            if (selectedCategory) params.set("category", selectedCategory);
            if (selectedStatus) params.set("status", selectedStatus);

            const res = await fetch(`/api/evidence?${params}`);
            if (!res.ok) return;
            const data = await res.json();
            setEvidence(data.evidence || []);
            setTotal(data.total || 0);
        } catch (e) {
            console.warn("Evidence fetch failed:", e);
        } finally {
            setLoading(false);
        }
    }, [page, search, selectedCategory, selectedStatus]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/evidence/stats");
            if (!res.ok) return;
            setStats(await res.json());
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchEvidence(); fetchStats(); }, [fetchEvidence, fetchStats]);

    const handleUpload = async () => {
        if (!uploadFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", uploadFile);
            formData.append("metadata", JSON.stringify({
                title: uploadMeta.title || uploadFile.name.replace(/\.[^/.]+$/, ""),
                description: uploadMeta.description || undefined,
                category: uploadMeta.category,
                tags: uploadMeta.tags ? uploadMeta.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
                frameworks: uploadMeta.frameworks ? uploadMeta.frameworks.split(",").map((f) => f.trim()).filter(Boolean) : [],
                expiresAt: uploadMeta.expiresAt || undefined,
            }));

            const res = await fetch("/api/evidence", { method: "POST", body: formData });
            if (!res.ok) throw new Error(await res.text());
            setShowUpload(false);
            setUploadFile(null);
            setUploadMeta({ title: "", description: "", category: "OTHER", tags: "", frameworks: "", expiresAt: "" });
            fetchEvidence();
            fetchStats();
        } catch (e) {
            console.error("Upload failed:", e);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/evidence/${id}`, { method: "DELETE" });
            fetchEvidence();
            fetchStats();
            if (selectedEvidence?.id === id) setSelectedEvidence(null);
        } catch { /* ignore */ }
    };

    const handleAddLink = async () => {
        if (!selectedEvidence || !linkForm.linkId || !linkForm.linkName) return;
        try {
            const res = await fetch(`/api/evidence/${selectedEvidence.id}/link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(linkForm),
            });
            if (!res.ok) return;
            // Refresh evidence detail
            const detailRes = await fetch(`/api/evidence/${selectedEvidence.id}`);
            if (detailRes.ok) setSelectedEvidence(await detailRes.json());
            setShowLinkModal(false);
            setLinkForm({ linkType: "COMPLIANCE_CONTROL", linkId: "", linkName: "" });
        } catch { /* ignore */ }
    };

    const handleRemoveLink = async (linkId: string) => {
        if (!selectedEvidence) return;
        try {
            await fetch(`/api/evidence/${selectedEvidence.id}/link/${linkId}`, { method: "DELETE" });
            const detailRes = await fetch(`/api/evidence/${selectedEvidence.id}`);
            if (detailRes.ok) setSelectedEvidence(await detailRes.json());
        } catch { /* ignore */ }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Evidence Vault</h2>
                    <p className="text-sm text-muted-foreground">Compliance artifacts and supporting documentation</p>
                </div>
                <Button size="sm" onClick={() => setShowUpload(true)} className="gap-1.5">
                    <Upload className="h-4 w-4" />Upload Evidence
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="border-border"><CardContent className="p-4">
                    <span className="text-xs text-muted-foreground block">Total Files</span>
                    <p className="text-2xl font-bold font-mono mt-1">{stats.total}</p>
                </CardContent></Card>
                <Card className="border-border"><CardContent className="p-4">
                    <span className="text-xs text-muted-foreground block">Active</span>
                    <p className="text-2xl font-bold font-mono mt-1 text-emerald-400">{stats.active}</p>
                </CardContent></Card>
                <Card className="border-border"><CardContent className="p-4">
                    <span className="text-xs text-muted-foreground block">Expiring Soon</span>
                    <p className="text-2xl font-bold font-mono mt-1 text-amber-400">{stats.expiringSoon}</p>
                </CardContent></Card>
                <Card className="border-border"><CardContent className="p-4">
                    <span className="text-xs text-muted-foreground block">Expired</span>
                    <p className="text-2xl font-bold font-mono mt-1 text-red-400">{stats.expired}</p>
                </CardContent></Card>
                <Card className="border-border"><CardContent className="p-4">
                    <span className="text-xs text-muted-foreground block">Total Size</span>
                    <p className="text-2xl font-bold font-mono mt-1">{formatSize(stats.totalSize)}</p>
                </CardContent></Card>
            </div>

            {/* Filters */}
            <Card className="border-border">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9 text-sm"
                                placeholder="Search title, description, tags..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <select
                            className="h-9 px-3 text-xs rounded-md border border-border bg-background text-foreground"
                            value={selectedCategory}
                            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                        >
                            <option value="">All Categories</option>
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                        </select>
                        <select
                            className="h-9 px-3 text-xs rounded-md border border-border bg-background text-foreground"
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                        >
                            <option value="">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="ARCHIVED">Archived</option>
                            <option value="PENDING_REVIEW">Pending Review</option>
                        </select>
                        <div className="flex border border-border rounded-md overflow-hidden">
                            <button
                                className={cn("px-2.5 py-1.5", view === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
                                onClick={() => setView("table")}
                            >
                                <List className="h-4 w-4" />
                            </button>
                            <button
                                className={cn("px-2.5 py-1.5", view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
                                onClick={() => setView("grid")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table / Grid */}
            {loading ? (
                <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground">Loading evidence...</CardContent></Card>
            ) : evidence.length === 0 ? (
                <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground">No evidence found. Upload your first file to get started.</CardContent></Card>
            ) : view === "table" ? (
                <Card className="border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">File</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Category</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Frameworks</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Expiry</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Links</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Size</th>
                                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {evidence.map((e) => {
                                    const expiry = expiryIndicator(e.expiresAt);
                                    const statusStyle = STATUS_STYLES[e.status] || STATUS_STYLES.ACTIVE;
                                    return (
                                        <tr key={e.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedEvidence(e)}>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded bg-muted/30 flex items-center justify-center text-muted-foreground">
                                                        {CATEGORY_ICONS[e.category] || <File className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium truncate max-w-[200px]">{e.title}</p>
                                                        <p className="text-[11px] text-muted-foreground">{e.fileName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className={cn("text-[10px]", CATEGORY_COLORS[e.category])}>{e.category.replace(/_/g, " ")}</Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(e.frameworks || []).slice(0, 2).map((f, i) => (
                                                        <Badge key={i} variant="outline" className="text-[10px] bg-primary/5 border-primary/20">{f}</Badge>
                                                    ))}
                                                    {(e.frameworks || []).length > 2 && (
                                                        <Badge variant="outline" className="text-[10px]">+{e.frameworks.length - 2}</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className={cn("text-[10px] gap-1", statusStyle.color)}>
                                                    {statusStyle.icon}{statusStyle.label}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                {expiry ? (
                                                    <span className={cn("text-[11px] px-1.5 py-0.5 rounded", expiry.color)}>{expiry.label}</span>
                                                ) : <span className="text-muted-foreground text-xs">—</span>}
                                            </td>
                                            <td className="p-3">
                                                {e.links.length > 0 ? (
                                                    <Badge variant="outline" className="text-[10px] gap-1"><Link2 className="h-3 w-3" />{e.links.length}</Badge>
                                                ) : <span className="text-muted-foreground text-xs">—</span>}
                                            </td>
                                            <td className="p-3"><span className="text-xs font-mono text-muted-foreground">{formatSize(e.fileSize)}</span></td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`/api/evidence/${e.id}/download`, "_blank")}>
                                                        <Download className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-500" onClick={() => handleDelete(e.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                /* Grid view */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {evidence.map((e) => {
                        const expiry = expiryIndicator(e.expiresAt);
                        const statusStyle = STATUS_STYLES[e.status] || STATUS_STYLES.ACTIVE;
                        return (
                            <Card key={e.id} className="border-border hover:border-primary/30 transition-all cursor-pointer" onClick={() => setSelectedEvidence(e)}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground flex-shrink-0">
                                            {CATEGORY_ICONS[e.category] || <File className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium truncate">{e.title}</h4>
                                            <p className="text-[11px] text-muted-foreground truncate">{e.fileName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                        <Badge variant="outline" className={cn("text-[10px]", CATEGORY_COLORS[e.category])}>{e.category.replace(/_/g, " ")}</Badge>
                                        <Badge variant="outline" className={cn("text-[10px] gap-1", statusStyle.color)}>{statusStyle.icon}{statusStyle.label}</Badge>
                                        {expiry && <span className={cn("text-[10px] px-1.5 py-0.5 rounded", expiry.color)}>{expiry.label}</span>}
                                    </div>
                                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                        <span>{formatSize(e.fileSize)}</span>
                                        <div className="flex items-center gap-2">
                                            {e.links.length > 0 && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />{e.links.length}</span>}
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(ev) => { ev.stopPropagation(); window.open(`/api/evidence/${e.id}/download`, "_blank"); }}>
                                                <Download className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                            <Search className="h-4 w-4" />
                        </Button>
                        <span className="text-xs px-2">{page} / {totalPages}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
                    <Card className="w-full max-w-lg border-border" onClick={(e) => e.stopPropagation()}>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">Upload Evidence</h3>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowUpload(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Drop zone */}
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                                    uploadFile ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:border-primary/40"
                                )}
                                onClick={() => document.getElementById("evidence-file-input")?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const f = e.dataTransfer.files[0];
                                    if (f) { setUploadFile(f); setUploadMeta((m) => ({ ...m, title: f.name.replace(/\.[^/.]+$/, "") })); }
                                }}
                            >
                                <input
                                    id="evidence-file-input"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.csv,.txt,.zip"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) { setUploadFile(f); setUploadMeta((m) => ({ ...m, title: f.name.replace(/\.[^/.]+$/, "") })); }
                                    }}
                                />
                                {uploadFile ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FileText className="h-5 w-5 text-emerald-400" />
                                        <span className="text-sm">{uploadFile.name} ({formatSize(uploadFile.size)})</span>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">Drag & drop or click to select</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">PDF, DOCX, XLSX, PNG, JPG, CSV, TXT, ZIP — max 50MB</p>
                                    </div>
                                )}
                            </div>

                            {/* Metadata form */}
                            <div className="space-y-3">
                                <Input
                                    placeholder="Title"
                                    value={uploadMeta.title}
                                    onChange={(e) => setUploadMeta((m) => ({ ...m, title: e.target.value }))}
                                />
                                <Input
                                    placeholder="Description (optional)"
                                    value={uploadMeta.description}
                                    onChange={(e) => setUploadMeta((m) => ({ ...m, description: e.target.value }))}
                                />
                                <select
                                    className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background text-foreground"
                                    value={uploadMeta.category}
                                    onChange={(e) => setUploadMeta((m) => ({ ...m, category: e.target.value }))}
                                >
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                                </select>
                                <Input
                                    placeholder="Tags (comma-separated: encryption, SOC2, ...)"
                                    value={uploadMeta.tags}
                                    onChange={(e) => setUploadMeta((m) => ({ ...m, tags: e.target.value }))}
                                />
                                <Input
                                    placeholder="Frameworks (comma-separated: ISO 27001:A.8.24, SOC 2:CC6.1, ...)"
                                    value={uploadMeta.frameworks}
                                    onChange={(e) => setUploadMeta((m) => ({ ...m, frameworks: e.target.value }))}
                                />
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Expiry Date (optional)</label>
                                    <Input
                                        type="date"
                                        value={uploadMeta.expiresAt}
                                        onChange={(e) => setUploadMeta((m) => ({ ...m, expiresAt: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <Button className="w-full" disabled={!uploadFile || uploading} onClick={handleUpload}>
                                {uploading ? "Uploading..." : "Upload Evidence"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Detail Panel */}
            {selectedEvidence && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedEvidence(null)}>
                    <Card className="w-full max-w-2xl border-border max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">{selectedEvidence.title}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedEvidence.fileName}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedEvidence(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Detail fields */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Category</span>
                                    <Badge variant="outline" className={cn("text-[10px]", CATEGORY_COLORS[selectedEvidence.category])}>
                                        {selectedEvidence.category.replace(/_/g, " ")}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Status</span>
                                    <Badge variant="outline" className={cn("text-[10px] gap-1", STATUS_STYLES[selectedEvidence.status]?.color)}>
                                        {STATUS_STYLES[selectedEvidence.status]?.icon}{STATUS_STYLES[selectedEvidence.status]?.label}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">File Size</span>
                                    <span className="font-mono">{formatSize(selectedEvidence.fileSize)}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Uploaded By</span>
                                    <span>{selectedEvidence.uploadedByName || selectedEvidence.uploadedBy}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Created</span>
                                    <span>{new Date(selectedEvidence.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Expires</span>
                                    <span>{selectedEvidence.expiresAt ? new Date(selectedEvidence.expiresAt).toLocaleDateString() : "—"}</span>
                                </div>
                            </div>

                            {selectedEvidence.description && (
                                <div>
                                    <span className="text-xs text-muted-foreground block mb-1">Description</span>
                                    <p className="text-sm">{selectedEvidence.description}</p>
                                </div>
                            )}

                            {/* Frameworks */}
                            {selectedEvidence.frameworks?.length > 0 && (
                                <div>
                                    <span className="text-xs text-muted-foreground block mb-1">Frameworks</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedEvidence.frameworks.map((f, i) => (
                                            <Badge key={i} variant="outline" className="text-[10px] bg-primary/5 border-primary/20">{f}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {selectedEvidence.tags?.length > 0 && (
                                <div>
                                    <span className="text-xs text-muted-foreground block mb-1">Tags</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedEvidence.tags.map((t, i) => (
                                            <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Linked resources */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">Linked Resources ({selectedEvidence.links.length})</span>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowLinkModal(true)}>
                                        <Plus className="h-3 w-3" />Add Link
                                    </Button>
                                </div>
                                {selectedEvidence.links.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {selectedEvidence.links.map((link) => (
                                            <div key={link.id} className="flex items-center justify-between p-2 rounded bg-muted/15 border border-border text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <Badge variant="outline" className="text-[10px]">{link.linkType.replace(/_/g, " ")}</Badge>
                                                    <span>{link.linkName}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => handleRemoveLink(link.id)}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center py-3 border border-dashed border-border rounded">No linked resources</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <Button className="flex-1 gap-1.5" onClick={() => window.open(`/api/evidence/${selectedEvidence.id}/download`, "_blank")}>
                                    <Download className="h-4 w-4" />Download
                                </Button>
                                <Button variant="destructive" className="gap-1.5" onClick={() => { handleDelete(selectedEvidence.id); setSelectedEvidence(null); }}>
                                    <Trash2 className="h-4 w-4" />Archive
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Add Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLinkModal(false)}>
                    <Card className="w-full max-w-sm border-border" onClick={(e) => e.stopPropagation()}>
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-bold">Link to Resource</h3>
                            <select
                                className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background text-foreground"
                                value={linkForm.linkType}
                                onChange={(e) => setLinkForm((f) => ({ ...f, linkType: e.target.value }))}
                            >
                                <option value="COMPLIANCE_CONTROL">Compliance Control</option>
                                <option value="RISK">Risk</option>
                                <option value="POLICY">Policy</option>
                                <option value="INCIDENT">Incident</option>
                                <option value="VENDOR">Vendor</option>
                                <option value="KNOWLEDGE_ENTRY">Knowledge Entry</option>
                            </select>
                            <Input
                                placeholder="Resource Name (e.g., ISO 27001:A.8.24)"
                                value={linkForm.linkName}
                                onChange={(e) => setLinkForm((f) => ({ ...f, linkName: e.target.value }))}
                            />
                            <Input
                                placeholder="Resource ID"
                                value={linkForm.linkId}
                                onChange={(e) => setLinkForm((f) => ({ ...f, linkId: e.target.value }))}
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowLinkModal(false)}>Cancel</Button>
                                <Button className="flex-1" onClick={handleAddLink} disabled={!linkForm.linkId || !linkForm.linkName}>Add Link</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
