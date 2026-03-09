"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createSession, ensureScenariosSeeded, getScenarios } from "@/lib/exercises/actions";
import type { Scenario } from "@/lib/exercises/types";
import { Shield, Siren, Ghost, Lock, Play, MessageSquare, TreeDeciduous, Zap, Mail, Clock } from "lucide-react";
import { formatDollars } from "@/lib/exercises/scoring";

const iconMap: Record<string, React.ReactNode> = {
    "🔗": <Siren className="h-6 w-6" />,
    "👻": <Ghost className="h-6 w-6" />,
    "🔒": <Lock className="h-6 w-6" />,
};

function getTimelinePreview(scenario: Scenario) {
    return {
        steps: scenario.steps.map(s => ({ time: s.time, title: s.title })),
        injectCount: scenario.steps.filter(s => s.inject).length,
        commsCount: scenario.steps.filter(s => s.comms).length,
    };
}

const gradeColors: Record<string, string> = {
    A: "text-emerald-400 bg-emerald-500/10",
    B: "text-blue-400 bg-blue-500/10",
    C: "text-amber-400 bg-amber-500/10",
    D: "text-orange-400 bg-orange-500/10",
    F: "text-red-400 bg-red-500/10",
};

interface ScenarioLibraryClientProps {
    scenarios: Scenario[];
    lastRuns: Record<string, {
        mode: string;
        grade: string | null;
        totalDollars: number;
        completedAt: Date | null;
    }>;
}

export function ScenarioLibraryClient({ scenarios, lastRuns }: ScenarioLibraryClientProps) {
    const router = useRouter();
    const [selected, setSelected] = useState<Scenario | null>(null);
    const [launchingMode, setLaunchingMode] = useState<"decision" | "discussion" | null>(null);

    const handleLaunch = useCallback(async (mode: "decision" | "discussion") => {
        if (!selected) return;
        setLaunchingMode(mode);

        try {
            // Seed scenarios if needed
            await ensureScenariosSeeded(scenarios.map((s: Scenario) => ({
                slug: s.slug, title: s.title, subtitle: s.subtitle,
                severity: s.severity, briefing: s.briefing, icon: s.icon,
                color: s.color, stakes: s.stakes, steps: s.steps, modes: s.modes,
            })));

            // Find the DB scenario by slug
            const dbScenarios = await getScenarios();
            const dbScenario = dbScenarios.find((s: { slug: string }) => s.slug === selected.slug);

            if (!dbScenario) throw new Error("Scenario not found in database");

            const session = await createSession(dbScenario.id, mode);
            router.push(`/exercises/${session.id}`);
        } catch (err) {
            console.error("Failed to create session:", err);
            setLaunchingMode(null);
        }
    }, [selected, router, scenarios]);

    return (
        <div className="space-y-8">
            {/* Scenario cards */}
            <div className="grid md:grid-cols-3 gap-4">
                {scenarios.map((scenario) => {
                    const lastRun = lastRuns[scenario.slug];
                    return (
                        <button
                            key={scenario.slug}
                            onClick={() => setSelected(scenario)}
                            className={cn(
                                "text-left p-5 rounded-xl border transition-all duration-200 space-y-4 relative overflow-hidden",
                                selected?.slug === scenario.slug
                                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-lg shadow-primary/5"
                                    : "border-border bg-card/30 hover:border-border/80 hover:bg-card/50"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-card shadow-sm border border-border/50 text-foreground">
                                    {iconMap[scenario.icon] ?? <Shield className="h-5 w-5" />}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                                    scenario.severity === "CRITICAL" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                                )}>
                                    {scenario.severity}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-foreground text-sm">{scenario.title}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2">{scenario.subtitle}</p>
                            </div>

                            {/* Last Run Data */}
                            <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                                {lastRun ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">📊</span>
                                        <span>
                                            Last: {lastRun.completedAt ? new Date(lastRun.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "—"} · <span className="capitalize">{lastRun.mode}</span>
                                            {lastRun.mode === "decision" && lastRun.grade && (
                                                <>
                                                    {" · "}Grade <span className={cn("font-medium", gradeColors[lastRun.grade]?.split(" ")[0] || "text-foreground")}>{lastRun.grade}</span>
                                                    {" · "}<span className={lastRun.totalDollars < 0 ? "text-red-400 font-medium" : "text-emerald-400 font-medium"}>
                                                        {lastRun.totalDollars < 0 ? "-" : ""}{formatDollars(Math.abs(lastRun.totalDollars))}
                                                    </span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 opacity-60">
                                        <span className="text-sm grayscale">📊</span>
                                        <span>Not yet attempted</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Expanded Scenario Panel */}
            {selected && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6 bg-card/30 border border-border rounded-2xl p-6 shadow-sm">
                    {/* Panel header */}
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-foreground">{selected.title}</h2>
                            <p className="text-sm text-muted-foreground">{selected.subtitle}</p>
                        </div>
                        <span className={cn(
                            "text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded",
                            selected.severity === "CRITICAL" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                            {selected.severity}
                        </span>
                    </div>

                    {/* Mode cards with embedded launch */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Decision Tree mode */}
                        <div className="p-5 rounded-xl border border-border bg-card/50 space-y-4 flex flex-col">
                            <div className="flex items-center gap-2">
                                <TreeDeciduous className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">Decision Tree</h3>
                            </div>
                            <div className="space-y-2 flex-1">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    3 choices per step. Every decision has € cost + reputation impact. Final grade A–F.
                                </p>
                                <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
                                    <span>⏱ ~60–90 min</span>
                                    <span>👤 Solo or team</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleLaunch("decision")}
                                disabled={launchingMode !== null}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border",
                                    launchingMode === "decision"
                                        ? "bg-muted text-muted-foreground border-transparent cursor-wait"
                                        : "bg-card hover:bg-muted border-border hover:border-border/80 text-foreground"
                                )}
                            >
                                <Play className="h-4 w-4" />
                                {launchingMode === "decision" ? "Creating Session..." : "Start Decision Mode →"}
                            </button>
                        </div>

                        {/* Discussion mode */}
                        <div className="p-5 rounded-xl border border-border bg-card/50 space-y-4 flex flex-col">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">Discussion</h3>
                            </div>
                            <div className="space-y-2 flex-1">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Open-ended role-based questions. Draft comms under time pressure. Responses captured for audit trail.
                                </p>
                                <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
                                    <span>⏱ ~2–3 hrs</span>
                                    <span>👥 Best with 3–5 people</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleLaunch("discussion")}
                                disabled={launchingMode !== null}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border",
                                    launchingMode === "discussion"
                                        ? "bg-muted text-muted-foreground border-transparent cursor-wait"
                                        : "bg-card hover:bg-muted border-border hover:border-border/80 text-foreground"
                                )}
                            >
                                <Play className="h-4 w-4" />
                                {launchingMode === "discussion" ? "Creating Session..." : "Start Discussion →"}
                            </button>
                        </div>
                    </div>

                    {/* Briefing */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span className="h-px flex-1 bg-border" />
                            Briefing
                            <span className="h-px flex-1 bg-border" />
                        </h3>
                        <p className="text-sm text-foreground/80 leading-relaxed">{selected.briefing}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono pt-2 border-t border-border/50">
                            <span>Revenue: €{selected.stakes.revenue}M</span>
                            <span>·</span>
                            <span>Customers: {selected.stakes.customers}</span>
                            <span>·</span>
                            <span>Entities: {selected.stakes.entities}</span>
                            <span>·</span>
                            <span>Audit: {selected.stakes.auditIn}</span>
                        </div>
                    </div>

                    {/* Timeline Preview */}
                    {(() => {
                        const timeline = getTimelinePreview(selected);
                        return (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <span className="h-px flex-1 bg-border" />
                                    Timeline Preview
                                    <span className="h-px flex-1 bg-border" />
                                </h3>
                                <div className="flex items-center gap-1 overflow-x-auto pb-2 pt-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                                    {timeline.steps.map((step, i) => (
                                        <div key={i} className="flex items-center gap-1 group relative flex-shrink-0">
                                            <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded cursor-help transition-colors group-hover:bg-primary/20 group-hover:text-primary">
                                                {step.time}
                                            </span>
                                            {/* Tooltip for step title */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-max max-w-xs pointer-events-none">
                                                <div className="bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded-md shadow-md border border-border whitespace-normal text-center font-medium relative">
                                                    {step.title}
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-popover border-4 border-b-transparent border-x-transparent" />
                                                </div>
                                            </div>
                                            {i < timeline.steps.length - 1 && (
                                                <span className="text-muted-foreground/40 mx-0.5">→</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Zap className="h-3 w-3 text-amber-500" />
                                        {timeline.injectCount} injects
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="h-3 w-3 text-blue-400" />
                                        {timeline.commsCount} comms exercises
                                    </span>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
