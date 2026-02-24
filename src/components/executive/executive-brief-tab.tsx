"use client";

import { useMemo, useEffect } from "react";
import { ExecutiveBriefLayout } from "@/components/executive/executive-brief-layout";
import { useDecisionStore } from "@/lib/decision-engine/router";
import { computeAllKPIs, HEALTH_META } from "@/lib/kpi-engine/kpi-engine";
import { useOKRProjectStore } from "@/lib/okr-project-store";
import { PILLAR_META, URGENCY_META, Decision } from "@/lib/decision-engine/types";
import {
    TrendingUp, TrendingDown, Minus, Target,
    AlertTriangle, CheckCircle, BarChart3, DollarSign,
    Zap, Clock
} from "lucide-react";

function Sparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 80, h = 24;
    const points = data.map((v, i) =>
        `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`
    ).join(" ");
    return (
        <svg width={w} height={h} className="opacity-80">
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
    );
}

function HeroStat({ label, value, color, sub }: { label: string; value: string; color: "emerald" | "amber" | "red"; sub: string }) {
    const colors = {
        emerald: "from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400",
        amber: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-400",
        red: "from-red-500/10 to-transparent border-red-500/20 text-red-400",
    };
    return (
        <div className={`p-4 rounded-xl bg-gradient-to-br ${colors[color]} border`}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
            <div className={`text-3xl font-bold ${color === "emerald" ? "text-emerald-400" : color === "amber" ? "text-amber-400" : "text-red-400"}`}>
                {value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{sub}</div>
        </div>
    );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h3>
        </div>
    );
}

function RiskRow({ decision }: { decision: Decision }) {
    const pillar = PILLAR_META[decision.pillar];
    const urgency = URGENCY_META[decision.urgency];
    return (
        <div className="p-3 rounded-lg border-l-2 bg-card/50 border border-border" style={{ borderLeftColor: urgency.color }}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{pillar.icon}</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: urgency.color, backgroundColor: `${urgency.color}15` }}>
                    {decision.urgency}
                </span>
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(decision.createdAt).toLocaleDateString()}
                </span>
            </div>
            <div className="text-sm font-medium text-foreground">{decision.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{decision.recommendation.summary}</div>
        </div>
    );
}

function MiniStat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
    return (
        <div className="p-2 rounded bg-card/30 border border-border text-center">
            <div className={`text-lg font-bold ${highlight ? "text-amber-400" : "text-foreground"}`}>{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
    );
}

export function ExecutiveBriefTab() {
    const kpis = useMemo(() => computeAllKPIs(), []);
    const { decisions, getStats } = useDecisionStore();
    const { objectives, projects, getOverallOKRHealth, fetchOKR } = useOKRProjectStore();
    const stats = getStats();
    useEffect(() => { fetchOKR(); }, [fetchOKR]);

    const postureKPI = kpis.find(k => k.id === "kpi-posture-overall");
    const postureScore = postureKPI?.value ?? 74;

    const criticalDecisions = decisions
        .filter(d => d.status === "PENDING" && (d.urgency === "CRITICAL" || d.urgency === "HIGH"))
        .slice(0, 5);

    const spotlightKPIs = kpis.filter(k =>
        ["kpi-risk-ale", "kpi-compliance-score", "kpi-incident-mttr", "kpi-vuln-patch", "kpi-budget-util", "kpi-posture-overall"]
            .includes(k.id)
    );

    const okrHealth = getOverallOKRHealth();
    const okrHealthPct = objectives.length > 0 ? Math.round((okrHealth.onTrack / objectives.length) * 100) : 0;
    const totalBudget = projects.reduce((s, p) => s + p.budgetAllocated, 0);
    const spentBudget = projects.reduce((s, p) => s + p.budgetSpent, 0);
    const budgetPct = totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0;

    const trendIcon = (t: string) =>
        t === "improving" ? <TrendingUp className="w-3 h-3 text-emerald-400" /> :
            t === "declining" ? <TrendingDown className="w-3 h-3 text-red-400" /> :
                <Minus className="w-3 h-3 text-muted-foreground" />;

    return (
        <ExecutiveBriefLayout>
            <div className="flex flex-col gap-8 pb-20">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <HeroStat label="Security Posture" value={`${postureScore}%`} color={Number(postureScore) >= 80 ? "emerald" : Number(postureScore) >= 60 ? "amber" : "red"} sub="Composite score across all domains" />
                    <HeroStat label="Pending Decisions" value={stats.pending.toString()} color={stats.pending > 3 ? "red" : stats.pending > 0 ? "amber" : "emerald"} sub={`${stats.avgConfidence}% avg AI confidence`} />
                    <HeroStat label="OKR Health" value={`${okrHealthPct}%`} color={okrHealthPct >= 70 ? "emerald" : okrHealthPct >= 50 ? "amber" : "red"} sub={`${objectives.length} objectives tracked`} />
                    <HeroStat label="Budget Utilization" value={`${budgetPct}%`} color={budgetPct > 90 ? "red" : budgetPct > 70 ? "amber" : "emerald"} sub={`$${(spentBudget / 1000).toFixed(0)}k / $${(totalBudget / 1000).toFixed(0)}k`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 space-y-6">
                        <SectionHeader icon={<AlertTriangle className="w-4 h-4 text-red-400" />} title="Critical Decisions Requiring Action" />
                        {criticalDecisions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/30" />
                                No critical decisions pending
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {criticalDecisions.map(d => <RiskRow key={d.id} decision={d} />)}
                            </div>
                        )}

                        <div className="pt-4 border-t border-border">
                            <SectionHeader icon={<Target className="w-4 h-4 text-blue-400" />} title="Objective Progress" />
                            <div className="space-y-3 mt-3">
                                {objectives.map(obj => {
                                    const progress = obj.keyResults.length > 0
                                        ? Math.round(obj.keyResults.reduce((s, kr) => s + kr.currentValue / kr.targetValue * 100, 0) / obj.keyResults.length)
                                        : 0;
                                    return (
                                        <div key={obj.id} className="p-3 rounded-lg bg-card/50 border border-border">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-foreground truncate">{obj.title}</span>
                                                <span className={`text-xs font-bold ${progress >= 70 ? "text-emerald-400" : progress >= 40 ? "text-amber-400" : "text-red-400"}`}>
                                                    {progress}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${progress >= 70 ? "bg-emerald-500" : progress >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-4 lg:border-l lg:border-border lg:pl-6">
                        <SectionHeader icon={<BarChart3 className="w-4 h-4 text-cyan-400" />} title="KPI Spotlight" />
                        {spotlightKPIs.map(kpi => (
                            <div key={kpi.id} className="p-3 rounded-lg bg-card/30 border border-border hover:border-primary/30 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">{kpi.name}</span>
                                    <div className="flex items-center gap-1">
                                        {trendIcon(kpi.trend)}
                                        <span className={`text-[10px] font-mono ${kpi.health === "GREEN" ? "text-emerald-400" : kpi.health === "AMBER" ? "text-amber-400" : "text-red-400"}`}>
                                            {HEALTH_META[kpi.health]?.label || kpi.health}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <span className="text-xl font-bold text-foreground">{kpi.value}</span>
                                        <span className="text-xs text-muted-foreground ml-1">{kpi.unit}</span>
                                        <span className="text-xs text-muted-foreground/50 ml-2">target: {kpi.target}</span>
                                    </div>
                                    <Sparkline data={kpi.sparkline} color={kpi.health === "GREEN" ? "#10b981" : kpi.health === "AMBER" ? "#f59e0b" : "#ef4444"} />
                                </div>
                                {kpi.boardTranslation && (
                                    <div className="mt-2 text-[10px] text-muted-foreground italic border-t border-border pt-1">
                                        📋 Board: {kpi.boardTranslation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-3 space-y-4 lg:border-l lg:border-border lg:pl-6">
                        <SectionHeader icon={<DollarSign className="w-4 h-4 text-amber-400" />} title="Program Health" />
                        {projects.map(proj => {
                            const pct = proj.budgetAllocated > 0 ? Math.round((proj.budgetSpent / proj.budgetAllocated) * 100) : 0;
                            const isOver = pct > 85;
                            return (
                                <div key={proj.id} className="p-3 rounded-lg bg-card/30 border border-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-foreground truncate">{proj.title}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${proj.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400" : "bg-secondary text-muted-foreground"}`}>
                                            {proj.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">Budget: ${(proj.budgetSpent / 1000).toFixed(0)}k / ${(proj.budgetAllocated / 1000).toFixed(0)}k</span>
                                        <span className={isOver ? "text-red-400 font-bold" : "text-foreground"}>{pct}%</span>
                                    </div>
                                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${isOver ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                    </div>
                                </div>
                            );
                        })}

                        <div className="pt-4 border-t border-border">
                            <SectionHeader icon={<Zap className="w-4 h-4 text-amber-400" />} title="Decision Velocity" />
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <MiniStat label="Total" value={stats.total} />
                                <MiniStat label="Pending" value={stats.pending} highlight={stats.pending > 0} />
                                <MiniStat label="Approved" value={stats.approved} />
                                <MiniStat label="Avg Confidence" value={`${stats.avgConfidence}%`} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ExecutiveBriefLayout>
    );
}
