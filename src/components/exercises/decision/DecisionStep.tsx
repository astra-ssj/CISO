"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Step, Decision, RoleId } from "@/lib/exercises/types";
import { RoleBadge } from "../shared/RoleBadge";
import { DeadlineTracker } from "../shared/DeadlineTracker";
import { formatDollars } from "@/lib/exercises/scoring";

interface DecisionStepProps {
    step: Step;
    onDecision: (decision: Decision) => void;
    hasDecided: boolean;
    selectedChoiceId?: string;
}

export function DecisionStep({ step, onDecision, hasDecided, selectedChoiceId }: DecisionStepProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const selectedDecision = step.decisions?.find((d) => d.id === selectedChoiceId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Step header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{step.time}</span>
                    <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
                </div>
                {step.deadline && <DeadlineTracker deadline={step.deadline} />}
            </div>

            {/* Inject event */}
            {step.inject && (
                <div className={cn(
                    "px-4 py-3 rounded-lg border-l-4 animate-in slide-in-from-right duration-300",
                    step.inject.severity === "CRITICAL" ? "border-l-red-500 bg-red-500/10 text-red-300" :
                        step.inject.severity === "POSITIVE" ? "border-l-emerald-500 bg-emerald-500/10 text-emerald-300" :
                            "border-l-amber-500 bg-amber-500/10 text-amber-300"
                )}>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider opacity-70 mb-1">
                        <span>⚡ Inject Event</span>
                        <span>— {step.inject.time}</span>
                    </div>
                    <p className="text-sm">{step.inject.event}</p>
                </div>
            )}

            {/* Situation */}
            <div className="bg-card/50 border border-border rounded-xl p-5">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Situation</h3>
                <p className="text-sm leading-relaxed text-foreground/90">{step.situation}</p>
            </div>

            {/* Decision cards */}
            {!hasDecided && step.decisions && (
                <div className="space-y-3">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Choose Your Response</h3>
                    <div className="grid gap-3">
                        {step.decisions.map((decision) => (
                            <button
                                key={decision.id}
                                onClick={() => onDecision(decision)}
                                onMouseEnter={() => setHoveredId(decision.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className={cn(
                                    "text-left w-full p-4 rounded-xl border transition-all duration-200",
                                    "hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5",
                                    hoveredId === decision.id ? "border-primary/40 bg-primary/5" : "border-border bg-card/30",
                                    decision.isBlunder && "hover:border-amber-500/30"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                                        {decision.id}
                                    </span>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <RoleBadge role={decision.role as RoleId} size="sm" />
                                            {decision.isBlunder && (
                                                <span className="text-[9px] text-amber-500/60 font-mono">⚠ attention needed</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-foreground">{decision.label}</p>
                                        <div className="flex items-center gap-4 text-[10px] font-mono">
                                            <span className={decision.dollars < 0 ? "text-red-400" : decision.dollars > 0 ? "text-emerald-400" : "text-muted-foreground"}>
                                                {formatDollars(decision.dollars)}
                                            </span>
                                            <span className={decision.repInt < 0 ? "text-red-400" : decision.repInt > 0 ? "text-emerald-400" : "text-muted-foreground"}>
                                                INT {decision.repInt > 0 ? "+" : ""}{decision.repInt}
                                            </span>
                                            <span className={decision.repExt < 0 ? "text-red-400" : decision.repExt > 0 ? "text-emerald-400" : "text-muted-foreground"}>
                                                EXT {decision.repExt > 0 ? "+" : ""}{decision.repExt}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Consequence reveal */}
            {hasDecided && selectedDecision && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                    <div className={cn(
                        "p-5 rounded-xl border",
                        selectedDecision.isBlunder ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"
                    )}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                                {selectedDecision.id}
                            </span>
                            <span className="text-xs font-medium text-foreground">{selectedDecision.label}</span>
                        </div>
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Consequence</h3>
                        <p className="text-sm leading-relaxed text-foreground/90">{selectedDecision.consequence}</p>
                        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border/50 text-sm font-mono">
                            <span className={selectedDecision.dollars < 0 ? "text-red-400" : "text-emerald-400"}>
                                {formatDollars(selectedDecision.dollars)}
                            </span>
                            <span className={selectedDecision.repInt < 0 ? "text-red-400" : "text-emerald-400"}>
                                Internal Rep: {selectedDecision.repInt > 0 ? "+" : ""}{selectedDecision.repInt}
                            </span>
                            <span className={selectedDecision.repExt < 0 ? "text-red-400" : "text-emerald-400"}>
                                External Rep: {selectedDecision.repExt > 0 ? "+" : ""}{selectedDecision.repExt}
                            </span>
                        </div>
                    </div>
                    {selectedDecision.isBlunder && (
                        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-xs text-red-400 font-medium">
                                🚨 Communication blunder detected — This choice had disproportionate reputation damage. In practice, communication failures often cause more lasting damage than the incident itself.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
