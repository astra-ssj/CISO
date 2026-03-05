"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { supplyChainScenario } from "@/lib/exercises/scenarios/supply-chain";
import { insiderScenario } from "@/lib/exercises/scenarios/insider";
import { ransomwareScenario } from "@/lib/exercises/scenarios/ransomware";
import { createSession, ensureScenariosSeeded, getScenarios } from "@/lib/exercises/actions";
import type { Scenario } from "@/lib/exercises/types";
import { Shield, Siren, Ghost, Lock, Play, MessageSquare, TreeDeciduous } from "lucide-react";

const scenarios: Scenario[] = [supplyChainScenario, insiderScenario, ransomwareScenario];

const iconMap: Record<string, React.ReactNode> = {
    "🔗": <Siren className="h-6 w-6" />,
    "👻": <Ghost className="h-6 w-6" />,
    "🔒": <Lock className="h-6 w-6" />,
};

export default function ExercisesPage() {
    const router = useRouter();
    const [selected, setSelected] = useState<Scenario | null>(null);
    const [selectedMode, setSelectedMode] = useState<"decision" | "discussion" | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleLaunch = useCallback(async () => {
        if (!selected || !selectedMode) return;
        setIsCreating(true);

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

            const session = await createSession(dbScenario.id, selectedMode);
            router.push(`/exercises/${session.id}`);
        } catch (err) {
            console.error("Failed to create session:", err);
            setIsCreating(false);
        }
    }, [selected, selectedMode, router]);

    return (
        <div className="space-y-8 p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">Tabletop Exercises</h1>
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl">
                    Test your incident response capabilities with realistic cyber crisis scenarios.
                    Choose a scenario and mode to begin.
                </p>
            </div>

            {/* Scenario cards */}
            <div className="grid md:grid-cols-3 gap-4">
                {scenarios.map((scenario) => (
                    <button
                        key={scenario.slug}
                        onClick={() => { setSelected(scenario); setSelectedMode(null); }}
                        className={cn(
                            "text-left p-5 rounded-xl border transition-all duration-200 space-y-4",
                            selected?.slug === scenario.slug
                                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-lg shadow-primary/5"
                                : "border-border bg-card/30 hover:border-border/80 hover:bg-card/50"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${scenario.color}15`, color: scenario.color }}>
                                {iconMap[scenario.icon] ?? <Shield className="h-5 w-5" />}
                            </div>
                            <span className={cn(
                                "text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                                scenario.severity === "CRITICAL" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                            )}>
                                {scenario.severity}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-foreground text-sm">{scenario.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{scenario.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                            <span>€{scenario.stakes.revenue}M rev</span>
                            <span>•</span>
                            <span>{scenario.stakes.customers} customers</span>
                            <span>•</span>
                            <span>{scenario.steps.length} steps</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Mode selector & launch */}
            {selected && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                    {/* Briefing */}
                    <div className="bg-card/50 border border-border rounded-xl p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-foreground">{selected.title} — Briefing</h3>
                        <p className="text-sm text-foreground/80 leading-relaxed">{selected.briefing}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono pt-2 border-t border-border/50">
                            <span>Revenue at risk: €{selected.stakes.revenue}M</span>
                            <span>|</span>
                            <span>Customers affected: {selected.stakes.customers}</span>
                            <span>|</span>
                            <span>Entities: {selected.stakes.entities}</span>
                            <span>|</span>
                            <span>Audit in: {selected.stakes.auditIn}</span>
                        </div>
                    </div>

                    {/* Mode selector */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Select Mode</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setSelectedMode("decision")}
                                className={cn(
                                    "text-left p-4 rounded-xl border transition-all duration-200",
                                    selectedMode === "decision"
                                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                                        : "border-border bg-card/30 hover:border-border/80"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <TreeDeciduous className="h-4 w-4 text-primary" />
                                    <span className="font-semibold text-sm text-foreground">Decision Tree</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Make critical decisions at each step. See quantified financial and reputation consequences. Get graded on your crisis response.
                                </p>
                            </button>
                            <button
                                onClick={() => setSelectedMode("discussion")}
                                className={cn(
                                    "text-left p-4 rounded-xl border transition-all duration-200",
                                    selectedMode === "discussion"
                                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                                        : "border-border bg-card/30 hover:border-border/80"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    <span className="font-semibold text-sm text-foreground">Discussion</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Role-based discussion with open-ended questions, tension points, and communication drafting exercises. Capture responses for audit trail.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Launch button */}
                    {selectedMode && (
                        <div className="flex justify-center animate-in fade-in duration-200">
                            <button
                                onClick={handleLaunch}
                                disabled={isCreating}
                                className={cn(
                                    "flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
                                    isCreating
                                        ? "bg-muted text-muted-foreground cursor-wait"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                                )}
                            >
                                <Play className="h-4 w-4" />
                                {isCreating ? "Creating Session..." : "Launch Exercise"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
