"use client";

import { useState, useMemo, useEffect } from "react";
import { useOKRProjectStore } from "@/lib/okr-project-store";
import { computeAllKPIs, KPI_CATEGORY_META, HEALTH_META } from "@/lib/kpi-engine/kpi-engine";
import {
    Target, TrendingUp, TrendingDown, Minus, Plus, Shield, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";

// ─── Sparkline ──────────────────────────────────────────────────
function Sparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
    const w = 72, h = 20;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
    return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" /></svg>;
}

export default function StrategyPage() {
    const { objectives, addObjective, getOverallOKRHealth, fetchOKR } = useOKRProjectStore();
    useEffect(() => { fetchOKR(); }, [fetchOKR]);
    const kpis = useMemo(() => computeAllKPIs(), []);

    // Modal states
    const [showAddOKR, setShowAddOKR] = useState(false);
    const [okrTitle, setOkrTitle] = useState("");
    const [okrDesc, setOkrDesc] = useState("");
    const [okrOwner, setOkrOwner] = useState("");

    // Category filter for KPIs
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const categories = Array.from(new Set(kpis.map(k => k.category)));
    const filteredKPIs = selectedCategory === "all" ? kpis : kpis.filter(k => k.category === selectedCategory);

    // FAIR risk data derived from KPIs
    const aleKPI = kpis.find(k => k.id === "kpi-risk-ale");
    const appetiteKPI = kpis.find(k => k.id === "kpi-risk-appetite");
    const okrHealth = getOverallOKRHealth();

    const handleAddOKR = () => {
        if (!okrTitle.trim()) return;
        addObjective({
            id: `OBJ-${Date.now()}`,
            title: okrTitle,
            description: okrDesc,
            owner: okrOwner || "Unassigned",
            quarter: "Q1",
            year: new Date().getFullYear(),
            status: "ON_TRACK",
            keyResults: [],
        });
        setOkrTitle(""); setOkrDesc(""); setOkrOwner("");
        setShowAddOKR(false);
    };

    const trendIcon = (t: string) =>
        t === "improving" ? <TrendingUp className="w-3 h-3 text-emerald-400" /> :
            t === "declining" ? <TrendingDown className="w-3 h-3 text-red-400" /> :
                <Minus className="w-3 h-3 text-zinc-500" />;

    return (
        <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Target className="w-8 h-8 text-blue-500" />
                        Strategy & Performance
                    </h1>
                    <p className="text-zinc-400 mt-1 max-w-2xl">
                        Unified view of objectives, key results, KPIs, and risk posture — powered by the v2 engine.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAddOKR(true)}>
                        <Plus className="w-4 h-4 mr-1" /> New Objective
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryStat label="OKR Health" value={`${okrHealth.onTrack}/${okrHealth.onTrack + okrHealth.atRisk + okrHealth.behind} on track`} color={okrHealth.onTrack >= okrHealth.atRisk ? "emerald" : "amber"} />
                <SummaryStat
                    label="Annualized Loss (ALE)"
                    value={aleKPI ? `$${(aleKPI.value / 1000000).toFixed(1)}M` : "$2.4M"}
                    color="red"
                />
                <SummaryStat
                    label="Risk Appetite Score"
                    value={appetiteKPI ? `${appetiteKPI.value}/100` : "72/100"}
                    color={appetiteKPI && appetiteKPI.value >= 80 ? "emerald" : "amber"}
                />
                <SummaryStat label="Active KPIs" value={kpis.length.toString()} color="blue" />
            </div>

            {/* ── OKRs Section ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-semibold text-white">Objectives & Key Results</h2>
                </div>

                {objectives.length === 0 ? (
                    <div className="py-12 text-center bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
                        <Target className="w-12 h-12 text-zinc-600 mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-medium text-zinc-300">No Objectives Set</h3>
                        <p className="text-zinc-500 max-w-md mx-auto mt-2">
                            Create your first objective to align security with business goals.
                        </p>
                        <Button variant="link" className="mt-4 text-blue-400" onClick={() => setShowAddOKR(true)}>
                            + Define First Objective
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {objectives.map(obj => {
                            const progress = obj.keyResults.length > 0
                                ? Math.round(obj.keyResults.reduce((s, kr) => s + (kr.currentValue / kr.targetValue) * 100, 0) / obj.keyResults.length)
                                : 0;
                            const statusColor = obj.status === "ON_TRACK" ? "emerald" : obj.status === "AT_RISK" ? "amber" : "red";
                            return (
                                <div key={obj.id} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-white">{obj.title}</h3>
                                            <p className="text-xs text-zinc-500 mt-0.5">{obj.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-${statusColor}-500/10 text-${statusColor}-400`}>
                                                {obj.status}
                                            </span>
                                            <span className="text-sm font-bold text-white">{progress}%</span>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
                                        <div
                                            className={`h-full rounded-full bg-${statusColor}-500 transition-all`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                    {/* Key Results */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        {obj.keyResults.map(kr => {
                                            const krPct = Math.round((kr.currentValue / kr.targetValue) * 100);
                                            return (
                                                <div key={kr.id} className="p-2 rounded bg-zinc-800/40 text-xs">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-zinc-400 truncate">{kr.title}</span>
                                                        <span className="text-zinc-300 font-mono">{kr.currentValue}/{kr.targetValue}</span>
                                                    </div>
                                                    <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${krPct >= 80 ? "bg-emerald-500" : krPct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                                            style={{ width: `${Math.min(krPct, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <div className="w-full h-px bg-zinc-800/50" />

            {/* ── KPIs Section ── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-xl font-semibold text-white">Key Performance Indicators</h2>
                    </div>
                </div>

                {/* Category filter */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedCategory("all")}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedCategory === "all" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-zinc-800/50 text-zinc-500 border border-zinc-800 hover:text-zinc-300"}`}
                    >
                        All ({kpis.length})
                    </button>
                    {categories.map(cat => {
                        const meta = KPI_CATEGORY_META[cat as keyof typeof KPI_CATEGORY_META];
                        const count = kpis.filter(k => k.category === cat).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedCategory === cat ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-zinc-800/50 text-zinc-500 border border-zinc-800 hover:text-zinc-300"}`}
                            >
                                {meta?.icon} {meta?.label || cat} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* KPI grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {filteredKPIs.map(kpi => {
                        const health = HEALTH_META[kpi.health];
                        return (
                            <div key={kpi.id} className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-zinc-400 truncate">{kpi.name}</span>
                                    {trendIcon(kpi.trend)}
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <span className="text-xl font-bold text-white">{kpi.value}</span>
                                        <span className="text-xs text-zinc-500 ml-1">{kpi.unit}</span>
                                    </div>
                                    <Sparkline
                                        data={kpi.sparkline}
                                        color={kpi.health === "GREEN" ? "#10b981" : kpi.health === "AMBER" ? "#f59e0b" : "#ef4444"}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] text-zinc-600">Target: {kpi.target}</span>
                                    <span className={`text-[10px] font-bold ${health?.color || "text-zinc-500"}`}>
                                        {health?.label || kpi.health}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="w-full h-px bg-zinc-800/50" />

            {/* ── FAIR Risk Summary ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    <h2 className="text-xl font-semibold text-white">Strategic Risk Analysis (FAIR Model)</h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                        <h3 className="text-zinc-400 text-xs mb-1 uppercase tracking-wide">ALE</h3>
                        <div className="text-2xl font-bold text-white">
                            {aleKPI ? `$${(aleKPI.value / 1000000).toFixed(1)}M` : "$2.4M"}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                            {aleKPI ? trendIcon(aleKPI.trend) : <TrendingUp className="w-3 h-3 text-red-400" />}
                            {aleKPI?.trendDelta ? `${aleKPI.trendDelta > 0 ? "+" : ""}${aleKPI.trendDelta}%` : "+12%"} from last quarter
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                        <h3 className="text-zinc-400 text-xs mb-1 uppercase tracking-wide">Risk Appetite</h3>
                        <div className="text-2xl font-bold text-amber-500">
                            {appetiteKPI ? `${appetiteKPI.value}/100` : "72/100"}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                            Criticality: High | Threat: High
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                        <h3 className="text-zinc-400 text-xs mb-1 uppercase tracking-wide">Top Risk Scenario</h3>
                        <div className="text-sm font-medium text-white mt-1">Ransomware on DB</div>
                        <div className="text-xs text-zinc-500">LEF: 0.2/yr | Magnitude: $5M</div>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                        <h3 className="text-zinc-400 text-xs mb-1 uppercase tracking-wide">Risk Score</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full" style={{ width: `${appetiteKPI?.value ?? 72}%` }} />
                            </div>
                            <span className="text-sm font-bold text-amber-400">{appetiteKPI?.value ?? 72}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Add OKR Dialog ── */}
            <Dialog open={showAddOKR} onOpenChange={setShowAddOKR}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-500" />
                            New Security Objective
                        </DialogTitle>
                        <DialogDescription>
                            Define a strategic objective to align your security program with business outcomes.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); handleAddOKR(); }}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="okr-title">Objective Title</Label>
                                <Input
                                    id="okr-title"
                                    placeholder="e.g. Achieve SOC 2 Type II Certification"
                                    value={okrTitle}
                                    onChange={e => setOkrTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="okr-desc">Description</Label>
                                <Textarea
                                    id="okr-desc"
                                    placeholder="What business outcome does this objective drive?"
                                    className="min-h-[80px]"
                                    value={okrDesc}
                                    onChange={e => setOkrDesc(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="okr-owner">Owner</Label>
                                <Input
                                    id="okr-owner"
                                    placeholder="e.g. VP of Security"
                                    value={okrOwner}
                                    onChange={e => setOkrOwner(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddOKR(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                <Plus className="w-4 h-4 mr-1" /> Create Objective
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Sub-components ─────────────────────────────────────────────

function SummaryStat({ label, value, color }: { label: string; value: string; color: string }) {
    const cls: Record<string, string> = {
        emerald: "from-emerald-500/10 border-emerald-500/20 text-emerald-400",
        amber: "from-amber-500/10 border-amber-500/20 text-amber-400",
        red: "from-red-500/10 border-red-500/20 text-red-400",
        blue: "from-blue-500/10 border-blue-500/20 text-blue-400",
    };
    return (
        <div className={`p-3 rounded-xl bg-gradient-to-br ${cls[color] || cls.blue} border to-transparent`}>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{label}</div>
            <div className={`text-2xl font-bold mt-0.5 ${cls[color]?.split(" ").pop() || "text-white"}`}>{value}</div>
        </div>
    );
}
