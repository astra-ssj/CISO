"use client";

import { cn } from "@/lib/utils";
import type { FinalAssessment as FinalAssessmentType, Grade } from "@/lib/exercises/types";
import { RepMeter } from "../shared/RepMeter";
import { RoleBadge } from "../shared/RoleBadge";
import { formatDollars } from "@/lib/exercises/scoring";
import type { RoleId } from "@/lib/exercises/types";

interface FinalAssessmentProps {
    assessment: FinalAssessmentType;
    scenarioTitle: string;
    onRestart?: () => void;
}

const gradeConfig: Record<Grade, { color: string; bg: string; border: string; label: string }> = {
    A: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Exceptional" },
    B: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "Competent" },
    C: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Adequate" },
    D: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", label: "Needs Improvement" },
    F: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Critical Failure" },
};

export function FinalAssessment({ assessment, scenarioTitle, onRestart }: FinalAssessmentProps) {
    const g = gradeConfig[assessment.grade];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Exercise Complete</h2>
                <p className="text-sm text-muted-foreground">{scenarioTitle}</p>
            </div>

            {/* Grade card */}
            <div className={cn("text-center p-8 rounded-2xl border-2", g.bg, g.border)}>
                <div className={cn("text-7xl font-bold font-mono mb-2", g.color)}>{assessment.grade}</div>
                <p className={cn("text-sm font-medium", g.color)}>{g.label}</p>
            </div>

            {/* Score summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Net Impact</span>
                    <span className={cn("text-xl font-mono font-bold", assessment.totalDollars < 0 ? "text-red-400" : "text-emerald-400")}>
                        {formatDollars(assessment.totalDollars)}
                    </span>
                </div>
                <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
                    <RepMeter label="Internal" value={assessment.finalRepInternal} size="sm" />
                </div>
                <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
                    <RepMeter label="External" value={assessment.finalRepExternal} size="sm" />
                </div>
            </div>

            {/* Decision trail */}
            <div className="bg-card/30 border border-border rounded-xl p-5 space-y-3">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Decision Trail</h3>
                <div className="space-y-2">
                    {assessment.history.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-border/30 last:border-0">
                            <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">{h.time}</span>
                            <RoleBadge role={h.role as RoleId} size="sm" />
                            <span className="text-foreground/80 flex-1 truncate">{h.choiceLabel}</span>
                            <span className={cn("text-xs font-mono flex-shrink-0", h.dollars < 0 ? "text-red-400" : "text-emerald-400")}>
                                {formatDollars(h.dollars)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strengths */}
            {assessment.strengths.length > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 space-y-2">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">✓ Strengths</h3>
                    <ul className="space-y-1.5">
                        {assessment.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-emerald-300/80 flex gap-2">
                                <span className="text-emerald-500 flex-shrink-0">•</span>
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Failures */}
            {assessment.failures.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 space-y-2">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-red-400">✗ Failures</h3>
                    <ul className="space-y-1.5">
                        {assessment.failures.map((f, i) => (
                            <li key={i} className="text-sm text-red-300/80 flex gap-2">
                                <span className="text-red-500 flex-shrink-0">•</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommendations */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-2">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-primary">→ Recommendations</h3>
                <ul className="space-y-1.5">
                    {assessment.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-foreground/70 flex gap-2">
                            <span className="text-primary flex-shrink-0">→</span>
                            {r}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
                {onRestart && (
                    <button onClick={onRestart} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
                        Try Again
                    </button>
                )}
                <a href="/exercises" className="px-6 py-2.5 border border-border text-foreground rounded-lg font-medium text-sm hover:bg-muted transition-colors">
                    Back to Scenarios
                </a>
            </div>
        </div>
    );
}
