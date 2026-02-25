"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Search, Download, RefreshCw, ChevronLeft, ChevronRight,
    Clock, Shield, AlertTriangle, Filter, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───

interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string | null;
    userName: string | null;
    userRole: string | null;
    action: string;
    category: string;
    resource: string;
    resourceId: string | null;
    description: string;
    metadata: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    severity: string;
}

interface AuditStats {
    total: number;
    today: number;
    thisWeek: number;
    critical: number;
}

// ─── Action / Category color maps ───

const ACTION_COLORS: Record<string, string> = {
    CREATE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    DELETE: "bg-red-500/15 text-red-400 border-red-500/30",
    UPDATE: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    LOGIN: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    LOGOUT: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    EXPORT: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    IMPORT: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    TEST: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    APPROVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    REJECT: "bg-red-500/15 text-red-400 border-red-500/30",
    ESCALATE: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    CONFIGURE: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const CATEGORY_COLORS: Record<string, string> = {
    AUTH: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    COMPLIANCE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    RISK: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    INCIDENT: "bg-red-500/10 text-red-400 border-red-500/20",
    VENDOR: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    INTELLIGENCE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    APPSEC: "bg-green-500/10 text-green-400 border-green-500/20",
    SETTINGS: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    INTEGRATION: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    CAIQ: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    EVIDENCE: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    POLICY: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

const SEVERITY_DOT: Record<string, string> = {
    INFO: "bg-emerald-500",
    WARNING: "bg-amber-500",
    CRITICAL: "bg-red-500 animate-pulse",
};

const DATE_RANGES = [
    { label: "Last 24h", days: 1 },
    { label: "Last 7d", days: 7 },
    { label: "Last 30d", days: 30 },
    { label: "Last 90d", days: 90 },
    { label: "All", days: 0 },
];

const ACTIONS = [
    "CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "LOGOUT",
    "EXPORT", "IMPORT", "TEST", "APPROVE", "REJECT", "ESCALATE", "CONFIGURE",
];

const CATEGORIES = [
    "AUTH", "COMPLIANCE", "RISK", "INCIDENT", "VENDOR", "INTELLIGENCE",
    "APPSEC", "SETTINGS", "INTEGRATION", "CAIQ", "EVIDENCE", "POLICY",
];

const SEVERITIES = ["INFO", "WARNING", "CRITICAL"];

// ─── Helpers ───

function relativeTime(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
}

function absoluteTime(ts: string): string {
    return new Date(ts).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
}

// ─── Component ───

export function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [stats, setStats] = useState<AuditStats>({ total: 0, today: 0, thisWeek: 0, critical: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;

    // Filters
    const [dateRange, setDateRange] = useState(0);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedActions, setSelectedActions] = useState<string[]>([]);
    const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Auto-refresh
    const [autoRefresh, setAutoRefresh] = useState(true);
    const refreshRef = useRef<NodeJS.Timeout | null>(null);
    const [newEventsCount, setNewEventsCount] = useState(0);
    const latestTimestamp = useRef<string | null>(null);

    const buildQueryString = useCallback(() => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (dateRange > 0) {
            const startDate = new Date(Date.now() - dateRange * 86400000).toISOString();
            params.set("startDate", startDate);
        }
        if (selectedCategories.length > 0) params.set("category", selectedCategories.join(","));
        if (selectedActions.length > 0) params.set("action", selectedActions.join(","));
        if (selectedSeverities.length > 0) params.set("severity", selectedSeverities.join(","));
        if (search.trim()) params.set("search", search.trim());
        return params.toString();
    }, [page, dateRange, selectedCategories, selectedActions, selectedSeverities, search]);

    const fetchLogs = useCallback(async () => {
        try {
            const qs = buildQueryString();
            const res = await fetch(`/api/audit-logs?${qs}`);
            if (!res.ok) return;
            const data = await res.json();
            setLogs(data.logs || []);
            setTotal(data.total || 0);
            if (data.logs?.length > 0 && !latestTimestamp.current) {
                latestTimestamp.current = data.logs[0].timestamp;
            }
        } catch (e) {
            console.warn("Audit log fetch failed:", e);
        } finally {
            setLoading(false);
        }
    }, [buildQueryString]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/audit-logs/stats");
            if (!res.ok) return;
            const data = await res.json();
            setStats(data);
        } catch (e) {
            console.warn("Audit stats fetch failed:", e);
        }
    }, []);

    // Check for new events (silent poll)
    const checkNewEvents = useCallback(async () => {
        if (!latestTimestamp.current) return;
        try {
            const params = new URLSearchParams({
                limit: "1",
                startDate: latestTimestamp.current,
            });
            const res = await fetch(`/api/audit-logs?${params}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.total > 0 && data.logs?.[0]?.timestamp !== latestTimestamp.current) {
                setNewEventsCount(data.total);
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [fetchLogs, fetchStats]);

    // Auto-refresh
    useEffect(() => {
        if (autoRefresh) {
            refreshRef.current = setInterval(() => {
                if (page === 1) {
                    fetchLogs();
                    fetchStats();
                } else {
                    checkNewEvents();
                }
            }, 30000);
        }
        return () => {
            if (refreshRef.current) clearInterval(refreshRef.current);
        };
    }, [autoRefresh, page, fetchLogs, fetchStats, checkNewEvents]);

    const clearFilters = () => {
        setDateRange(0);
        setSelectedCategories([]);
        setSelectedActions([]);
        setSelectedSeverities([]);
        setSearch("");
        setPage(1);
    };

    const hasFilters = dateRange > 0 || selectedCategories.length > 0 || selectedActions.length > 0 || selectedSeverities.length > 0 || search.trim() !== "";
    const totalPages = Math.ceil(total / limit);

    const handleExport = async (format: "csv" | "json") => {
        const qs = buildQueryString();
        const params = new URLSearchParams(qs);
        params.set("format", format);
        params.delete("page");
        params.delete("limit");
        window.open(`/api/audit-logs/export?${params}`, "_blank");
    };

    const toggleFilter = (arr: string[], item: string, setter: (v: string[]) => void) => {
        setter(arr.includes(item) ? arr.filter((a) => a !== item) : [...arr, item]);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Audit Trail</h2>
                    <p className="text-sm text-muted-foreground">Immutable record of all platform activity</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn("text-xs", autoRefresh && "border-emerald-500/40 text-emerald-400")}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", autoRefresh && "animate-spin")} />
                        {autoRefresh ? "Live" : "Paused"}
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleExport("csv")}>
                        <Download className="h-3.5 w-3.5 mr-1.5" />CSV
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleExport("json")}>
                        <Download className="h-3.5 w-3.5 mr-1.5" />JSON
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Total Events</span>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold font-mono mt-1">{stats.total.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Today</span>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold font-mono mt-1">{stats.today.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">This Week</span>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold font-mono mt-1">{stats.thisWeek.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Critical</span>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                        <p className="text-2xl font-bold font-mono mt-1 text-red-400">{stats.critical.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* New events banner */}
            {newEventsCount > 0 && page !== 1 && (
                <button
                    className="w-full p-2 text-sm text-center text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/15 transition-colors"
                    onClick={() => { setPage(1); setNewEventsCount(0); }}
                >
                    {newEventsCount} new event{newEventsCount > 1 ? "s" : ""} — click to refresh
                </button>
            )}

            {/* Filters */}
            <Card className="border-border">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9 text-sm"
                                placeholder="Search descriptions, resources, users..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="text-xs gap-1.5">
                            <Filter className="h-3.5 w-3.5" />
                            Filters
                            {hasFilters && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{[selectedCategories.length, selectedActions.length, selectedSeverities.length, dateRange > 0 ? 1 : 0].reduce((a, b) => a + b, 0)}</Badge>}
                        </Button>
                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1 text-muted-foreground">
                                <X className="h-3.5 w-3.5" />Clear
                            </Button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="space-y-3 pt-2 border-t border-border">
                            {/* Date Range */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-1.5">Date Range</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {DATE_RANGES.map((r) => (
                                        <button
                                            key={r.label}
                                            className={cn(
                                                "px-2.5 py-1 text-xs rounded-md border transition-colors",
                                                dateRange === r.days
                                                    ? "bg-primary/10 border-primary/40 text-primary"
                                                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                                            )}
                                            onClick={() => { setDateRange(r.days); setPage(1); }}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-1.5">Category</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat}
                                            className={cn(
                                                "px-2 py-0.5 text-[11px] rounded border transition-colors",
                                                selectedCategories.includes(cat)
                                                    ? CATEGORY_COLORS[cat]
                                                    : "border-border text-muted-foreground hover:text-foreground"
                                            )}
                                            onClick={() => toggleFilter(selectedCategories, cat, setSelectedCategories)}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-1.5">Action</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {ACTIONS.map((act) => (
                                        <button
                                            key={act}
                                            className={cn(
                                                "px-2 py-0.5 text-[11px] rounded border transition-colors",
                                                selectedActions.includes(act)
                                                    ? ACTION_COLORS[act]
                                                    : "border-border text-muted-foreground hover:text-foreground"
                                            )}
                                            onClick={() => toggleFilter(selectedActions, act, setSelectedActions)}
                                        >
                                            {act}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Severity */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-1.5">Severity</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {SEVERITIES.map((sev) => (
                                        <button
                                            key={sev}
                                            className={cn(
                                                "px-2.5 py-1 text-xs rounded-md border flex items-center gap-1.5 transition-colors",
                                                selectedSeverities.includes(sev)
                                                    ? "bg-primary/10 border-primary/40 text-primary"
                                                    : "border-border text-muted-foreground hover:text-foreground"
                                            )}
                                            onClick={() => toggleFilter(selectedSeverities, sev, setSelectedSeverities)}
                                        >
                                            <span className={cn("h-2 w-2 rounded-full", SEVERITY_DOT[sev])} />
                                            {sev}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-[140px]">Timestamp</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-[120px]">User</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-[100px]">Action</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-[100px]">Category</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Description</th>
                                <th className="text-center p-3 text-xs font-medium text-muted-foreground w-[60px]">Sev</th>
                                <th className="w-[40px]" />
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Loading audit logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No audit events found{hasFilters ? " matching your filters" : ""}.</td></tr>
                            ) : (
                                logs.map((log, i) => (
                                    <LogRow
                                        key={log.id}
                                        log={log}
                                        isNew={i === 0 && page === 1}
                                        expanded={expandedRow === log.id}
                                        onToggle={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()} events
                    </p>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = page <= 3 ? i + 1 : page + i - 2;
                            if (p < 1 || p > totalPages) return null;
                            return (
                                <Button
                                    key={p}
                                    variant={p === page ? "default" : "outline"}
                                    size="icon"
                                    className="h-8 w-8 text-xs"
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </Button>
                            );
                        })}
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Log Row Component ───

function LogRow({ log, isNew, expanded, onToggle }: {
    log: AuditLogEntry;
    isNew: boolean;
    expanded: boolean;
    onToggle: () => void;
}) {
    const metadata = log.metadata ? (() => { try { return JSON.parse(log.metadata!); } catch { return null; } })() : null;

    return (
        <>
            <tr
                className={cn(
                    "border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors",
                    isNew && "animate-pulse-once bg-cyan-500/5",
                    expanded && "bg-muted/10"
                )}
                onClick={onToggle}
            >
                <td className="p-3">
                    <span className="font-mono text-xs text-muted-foreground" title={absoluteTime(log.timestamp)}>
                        {relativeTime(log.timestamp)}
                    </span>
                </td>
                <td className="p-3">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {(log.userName || log.userId || "?")[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs truncate max-w-[80px]">{log.userName || log.userId || "System"}</span>
                    </div>
                </td>
                <td className="p-3">
                    <Badge variant="outline" className={cn("text-[10px] font-mono", ACTION_COLORS[log.action])}>
                        {log.action}
                    </Badge>
                </td>
                <td className="p-3">
                    <Badge variant="outline" className={cn("text-[10px]", CATEGORY_COLORS[log.category])}>
                        {log.category}
                    </Badge>
                </td>
                <td className="p-3">
                    <span className="text-xs text-foreground line-clamp-1">{log.description}</span>
                </td>
                <td className="p-3 text-center">
                    <span className={cn("inline-block h-2.5 w-2.5 rounded-full", SEVERITY_DOT[log.severity])} title={log.severity} />
                </td>
                <td className="p-3">
                    {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </td>
            </tr>
            {expanded && (
                <tr className="bg-muted/5">
                    <td colSpan={7} className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-muted-foreground block mb-0.5">Timestamp</span>
                                <span className="font-mono">{absoluteTime(log.timestamp)}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-0.5">Resource</span>
                                <span className="font-mono">{log.resource}{log.resourceId ? ` (${log.resourceId})` : ""}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-0.5">IP Address</span>
                                <span className="font-mono">{log.ipAddress || "—"}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-0.5">User Agent</span>
                                <span className="font-mono text-[11px] line-clamp-2">{log.userAgent || "—"}</span>
                            </div>
                        </div>
                        {metadata && (
                            <div className="mt-3 p-3 bg-background rounded-lg border border-border">
                                <span className="text-xs text-muted-foreground block mb-1">Metadata</span>
                                <pre className="text-[11px] font-mono text-foreground/80 whitespace-pre-wrap overflow-auto max-h-48">
                                    {JSON.stringify(metadata, null, 2)}
                                </pre>
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}
