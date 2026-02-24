"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    ROADMAP,
    getOverallStats,
    getReleaseProgress,
    getAllCategories,
    type FeatureStatus,
    type Priority,
    type Category,
    type Release,
    type Feature,
} from "@/lib/roadmap-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Map,
    CheckCircle2,
    Loader2,
    ClipboardList,
    Lightbulb,
    ChevronDown,
    ChevronRight,
    Rocket,
    Target,
    Zap,
    TrendingUp,
    Filter,
    BarChart3,
    Calendar,
    Timer,
    Sparkles,
} from "lucide-react";

/* ── colour maps ─────────────────────────────────────────── */

const STATUS_META: Record<FeatureStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string; ring: string }> = {
    COMPLETED: { label: "Completed", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/15", ring: "ring-emerald-500/30" },
    IN_PROGRESS: { label: "In Progress", icon: Loader2, color: "text-sky-400", bg: "bg-sky-500/15", ring: "ring-sky-500/30" },
    PLANNED: { label: "Planned", icon: ClipboardList, color: "text-violet-400", bg: "bg-violet-500/15", ring: "ring-violet-500/30" },
    BACKLOG: { label: "Backlog", icon: Lightbulb, color: "text-zinc-500", bg: "bg-zinc-500/10", ring: "ring-zinc-500/20" },
};

const PRIORITY_META: Record<Priority, { color: string; bg: string }> = {
    CRITICAL: { color: "text-red-400", bg: "bg-red-500/15" },
    HIGH: { color: "text-orange-400", bg: "bg-orange-500/15" },
    MEDIUM: { color: "text-amber-400", bg: "bg-amber-500/15" },
    LOW: { color: "text-zinc-400", bg: "bg-zinc-500/15" },
};

const CATEGORY_COLORS: Record<string, string> = {
    Core: "bg-sky-500/15 text-sky-400",
    Auth: "bg-indigo-500/15 text-indigo-400",
    Compliance: "bg-emerald-500/15 text-emerald-400",
    Integrations: "bg-purple-500/15 text-purple-400",
    AI: "bg-pink-500/15 text-pink-400",
    Platform: "bg-cyan-500/15 text-cyan-400",
    Cloud: "bg-blue-500/15 text-blue-400",
    AppSec: "bg-rose-500/15 text-rose-400",
    Intelligence: "bg-amber-500/15 text-amber-400",
    Reporting: "bg-lime-500/15 text-lime-400",
    Data: "bg-teal-500/15 text-teal-400",
    UX: "bg-fuchsia-500/15 text-fuchsia-400",
};

/* ── sub-components ──────────────────────────────────────── */

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: typeof Rocket; accent: string }) {
    return (
        <div className="relative group">
            <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Card className="relative bg-card/60 backdrop-blur border-border/50 hover:border-primary/30 transition-colors duration-300">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-lg", accent)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ProgressBar({ percent, className }: { percent: number; className?: string }) {
    return (
        <div className={cn("h-2 w-full rounded-full bg-secondary/50 overflow-hidden", className)}>
            <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-primary transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: FeatureStatus }) {
    const meta = STATUS_META[status];
    const Icon = meta.icon;
    return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ring-1", meta.bg, meta.color, meta.ring)}>
            <Icon className={cn("h-3 w-3", status === "IN_PROGRESS" && "animate-spin")} />
            {meta.label}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: Priority }) {
    const meta = PRIORITY_META[priority];
    return (
        <span className={cn("text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded", meta.bg, meta.color)}>
            {priority}
        </span>
    );
}

function CategoryTag({ category }: { category: Category }) {
    return (
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded", CATEGORY_COLORS[category] || "bg-secondary text-muted-foreground")}>
            {category}
        </span>
    );
}

function FeatureRow({ feature }: { feature: Feature }) {
    const [expanded, setExpanded] = useState(false);
    const meta = STATUS_META[feature.status];
    const Icon = meta.icon;

    return (
        <div
            className={cn(
                "group border border-transparent rounded-lg transition-all duration-200 cursor-pointer",
                "hover:bg-muted/30 hover:border-border/50",
                expanded && "bg-muted/20 border-border/40"
            )}
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-center gap-3 px-4 py-3">
                <Icon className={cn("h-4 w-4 shrink-0", meta.color, feature.status === "IN_PROGRESS" && "animate-spin")} />
                <span className="flex-1 text-sm font-medium text-foreground truncate">{feature.name}</span>
                <div className="hidden sm:flex items-center gap-2">
                    <CategoryTag category={feature.category} />
                    <PriorityBadge priority={feature.priority} />
                    {feature.effort && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {feature.effort}
                        </span>
                    )}
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0", expanded && "rotate-180")} />
            </div>
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-out",
                    expanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="px-4 pb-3 pl-11">
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    <div className="flex items-center gap-2 mt-2 sm:hidden">
                        <CategoryTag category={feature.category} />
                        <PriorityBadge priority={feature.priority} />
                        {feature.effort && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {feature.effort}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReleaseCard({ release, statusFilter, categoryFilter }: { release: Release; statusFilter: FeatureStatus | "ALL"; categoryFilter: Category | "ALL" }) {
    const [expanded, setExpanded] = useState(release.status === "IN_PROGRESS");
    const { completed, total, percent } = getReleaseProgress(release);
    const meta = STATUS_META[release.status];

    const filteredFeatures = release.features.filter(f => {
        if (statusFilter !== "ALL" && f.status !== statusFilter) return false;
        if (categoryFilter !== "ALL" && f.category !== categoryFilter) return false;
        return true;
    });

    if (filteredFeatures.length === 0 && (statusFilter !== "ALL" || categoryFilter !== "ALL")) return null;

    return (
        <Card className={cn(
            "relative overflow-hidden border-border/50 bg-card/40 backdrop-blur transition-all duration-300",
            "hover:border-primary/20",
            expanded && "border-primary/30"
        )}>
            {/* Glow line at top */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-px",
                release.status === "COMPLETED" && "bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent",
                release.status === "IN_PROGRESS" && "bg-gradient-to-r from-transparent via-sky-500/60 to-transparent",
                release.status === "PLANNED" && "bg-gradient-to-r from-transparent via-violet-500/40 to-transparent",
                release.status === "BACKLOG" && "bg-gradient-to-r from-transparent via-zinc-500/30 to-transparent",
            )} />

            <CardHeader
                className="cursor-pointer select-none hover:bg-muted/20 transition-colors duration-200"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                            "flex items-center justify-center h-10 min-w-[2.5rem] rounded-lg font-mono font-bold text-sm ring-1",
                            meta.bg, meta.color, meta.ring
                        )}>
                            v{release.version}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-base">{release.title}</CardTitle>
                                <StatusBadge status={release.status} />
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {release.target && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {release.target}
                                    </span>
                                )}
                                <span>{completed}/{total} features</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex flex-col items-end gap-1 w-32">
                            <span className="text-xs font-medium tabular-nums">{percent}%</span>
                            <ProgressBar percent={percent} />
                        </div>
                        <ChevronRight className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", expanded && "rotate-90")} />
                    </div>
                </div>
            </CardHeader>

            <div className={cn(
                "overflow-hidden transition-all duration-500 ease-out",
                expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <CardContent className="pt-0 pb-4">
                    <div className="border-t border-border/30 pt-3 space-y-0.5">
                        {filteredFeatures.map(feature => (
                            <FeatureRow key={feature.id} feature={feature} />
                        ))}
                        {filteredFeatures.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No features match your filters.</p>
                        )}
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}

/* ── page ─────────────────────────────────────────────────── */

export default function RoadmapPage() {
    const [statusFilter, setStatusFilter] = useState<FeatureStatus | "ALL">("ALL");
    const [categoryFilter, setCategoryFilter] = useState<Category | "ALL">("ALL");
    const [showCategoryFilters, setShowCategoryFilters] = useState(false);

    const stats = useMemo(() => getOverallStats(ROADMAP), []);
    const categories = useMemo(() => getAllCategories(ROADMAP), []);

    const statusFilters: { value: FeatureStatus | "ALL"; label: string }[] = [
        { value: "ALL", label: "All" },
        { value: "COMPLETED", label: "Completed" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "PLANNED", label: "Planned" },
        { value: "BACKLOG", label: "Backlog" },
    ];

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
            {/* ── Header ────────────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                            <Map className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Astra-CISO Product Roadmap</h1>
                            <p className="text-muted-foreground text-sm mt-0.5">Building the future of autonomous security operations</p>
                        </div>
                    </div>
                </div>

                {/* Overall progress */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Overall progress</span>
                        <span className="font-bold tabular-nums text-foreground">{stats.percent}%</span>
                    </div>
                    <ProgressBar percent={stats.percent} className="h-3" />
                </div>
            </section>

            {/* ── Stats ─────────────────────────────────────────── */}
            <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="Total Features" value={stats.total} icon={BarChart3} accent="bg-primary/10 text-primary" />
                <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="bg-emerald-500/15 text-emerald-400" />
                <StatCard label="In Progress" value={stats.inProgress} icon={Zap} accent="bg-sky-500/15 text-sky-400" />
                <StatCard label="Planned" value={stats.planned} icon={Target} accent="bg-violet-500/15 text-violet-400" />
                <StatCard label="Backlog" value={stats.backlog} icon={Sparkles} accent="bg-zinc-500/15 text-zinc-400" />
            </section>

            {/* ── Filters ───────────────────────────────────────── */}
            <section className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    {statusFilters.map(f => (
                        <Button
                            key={f.value}
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 text-xs font-medium rounded-full border transition-all duration-200",
                                statusFilter === f.value
                                    ? "border-primary/50 bg-primary/10 text-primary"
                                    : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                            )}
                            onClick={() => setStatusFilter(f.value)}
                        >
                            {f.label}
                            {f.value !== "ALL" && (
                                <span className="ml-1.5 tabular-nums opacity-60">
                                    {f.value === "COMPLETED" ? stats.completed : f.value === "IN_PROGRESS" ? stats.inProgress : f.value === "PLANNED" ? stats.planned : stats.backlog}
                                </span>
                            )}
                        </Button>
                    ))}

                    <div className="h-5 w-px bg-border/50 mx-1 hidden sm:block" />

                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-8 text-xs font-medium rounded-full border transition-all duration-200",
                            showCategoryFilters
                                ? "border-primary/50 bg-primary/10 text-primary"
                                : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        )}
                        onClick={() => { setShowCategoryFilters(!showCategoryFilters); if (showCategoryFilters) setCategoryFilter("ALL"); }}
                    >
                        <Filter className="h-3 w-3 mr-1" />
                        Category
                    </Button>
                </div>

                {/* Category sub-filters */}
                <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-out",
                    showCategoryFilters ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
                )}>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <button
                            className={cn(
                                "text-[11px] px-2.5 py-1 rounded-full transition-all duration-200",
                                categoryFilter === "ALL" ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setCategoryFilter("ALL")}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={cn(
                                    "text-[11px] px-2.5 py-1 rounded-full transition-all duration-200",
                                    categoryFilter === cat
                                        ? cn(CATEGORY_COLORS[cat], "ring-1 ring-current/30")
                                        : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => setCategoryFilter(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Timeline ──────────────────────────────────────── */}
            <section className="hidden md:block">
                <div className="relative flex items-center gap-0">
                    {/* Timeline line */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-px bg-border/50" />
                    {/* "You are here" marker */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-[15%] z-10 flex flex-col items-center -mt-5">
                        <span className="text-[9px] text-primary font-bold tracking-wider uppercase whitespace-nowrap mb-1">You are here</span>
                        <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20 animate-pulse" />
                    </div>
                    {ROADMAP.map((release, i) => {
                        const meta = STATUS_META[release.status];
                        const leftPercent = 10 + (i * (80 / (ROADMAP.length - 1)));
                        return (
                            <div
                                key={release.id}
                                className="absolute flex flex-col items-center"
                                style={{ left: `${leftPercent}%`, top: "50%", transform: "translate(-50%, -50%)" }}
                            >
                                <span className="text-[10px] text-muted-foreground font-mono mb-1.5 whitespace-nowrap">{release.target ?? ""}</span>
                                <div className={cn(
                                    "h-4 w-4 rounded-full ring-2 transition-all duration-300",
                                    meta.bg, meta.ring,
                                    release.status === "COMPLETED" && "bg-emerald-500",
                                    release.status === "IN_PROGRESS" && "bg-sky-500 animate-pulse",
                                    release.status === "PLANNED" && "bg-violet-500/50",
                                    release.status === "BACKLOG" && "bg-zinc-600/50",
                                )} />
                                <span className={cn("text-[10px] font-bold mt-1.5 whitespace-nowrap", meta.color)}>v{release.version}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="h-16" />
            </section>

            {/* ── Release cards ─────────────────────────────────── */}
            <section className="space-y-4">
                {ROADMAP.map(release => (
                    <ReleaseCard key={release.id} release={release} statusFilter={statusFilter} categoryFilter={categoryFilter} />
                ))}
            </section>

            {/* ── Footer ────────────────────────────────────────── */}
            <footer className="text-center pb-8 pt-4">
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/60 font-mono">
                    <Rocket className="h-3.5 w-3.5" />
                    <span>ASTRA-CISO ROADMAP • LAST UPDATED FEB 2026</span>
                </div>
            </footer>
        </div>
    );
}
