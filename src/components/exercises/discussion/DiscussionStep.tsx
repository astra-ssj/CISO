"use client";

import { useState, useCallback } from "react";
import type { Step, RoleId } from "@/lib/exercises/types";
import { RoleBadge } from "../shared/RoleBadge";
import { DeadlineTracker } from "../shared/DeadlineTracker";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface DiscussionStepProps {
    step: Step;
    sessionId: string;
    responses: Record<string, string>;
    commsDrafts: Record<string, string>;
    onSaveResponse: (stepId: number, role: string, question: string, response: string) => void;
    onSaveComms: (stepId: number, audience: string, template: string, draft: string) => void;
}

export function DiscussionStep({ step, responses, commsDrafts, onSaveResponse, onSaveComms }: DiscussionStepProps) {
    const [expandedRole, setExpandedRole] = useState<string | null>(null);
    const [showHint, setShowHint] = useState<Record<number, boolean>>({});

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Step header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{step.time}</span>
                    <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
                </div>
                {step.deadline && step.deadline.length > 0 && <DeadlineTracker deadlines={step.deadline} />}
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
                        <span>⚡ Inject Event — {step.inject.time}</span>
                    </div>
                    <p className="text-sm">{step.inject.event}</p>
                </div>
            )}

            {/* Situation */}
            <div className="bg-card/50 border border-border rounded-xl p-5">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Situation</h3>
                <p className="text-sm leading-relaxed text-foreground/90">{step.situation}</p>
            </div>

            {/* Role questions */}
            {step.questions && step.questions.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Discussion Points by Role</h3>
                    {step.questions.map((rq, questionIndex) => {
                        const key = `${step.id}-${rq.role}`;
                        const isExpanded = expandedRole === rq.role;
                        const savedResponse = responses[key] ?? "";

                        return (
                            <div key={rq.role} className="border border-border rounded-xl overflow-hidden transition-all">
                                <button
                                    onClick={() => setExpandedRole(isExpanded ? null : rq.role)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <RoleBadge role={rq.role as RoleId} />
                                        <p className="text-sm text-foreground/80 text-left">{rq.q}</p>
                                    </div>
                                    <span className={cn("text-muted-foreground transition-transform text-xs", isExpanded && "rotate-180")}>▼</span>
                                </button>

                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        {/* Tension reveal */}
                                        <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
                                            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-500">⚡ Tension Point</span>
                                            <p className="text-xs text-amber-300/80 mt-1">{rq.tension}</p>
                                        </div>

                                        {/* Facilitator Hint Toggle */}
                                        {rq.hint && (
                                            <button
                                                onClick={() => setShowHint(prev => ({ ...prev, [questionIndex]: !prev[questionIndex] }))}
                                                className="text-xs text-amber-400/60 hover:text-amber-400 mt-2 transition-colors"
                                            >
                                                {showHint[questionIndex] ? "Hide Hint" : "🎓 Show Facilitator Hint"}
                                            </button>
                                        )}

                                        {/* Facilitator Hint Reveal */}
                                        {showHint[questionIndex] && rq.hint && (
                                            <div className="mt-2 p-3 rounded-lg bg-amber-400/5 border border-amber-400/10 animate-in slide-in-from-top-2 duration-200">
                                                <div className="text-[10px] font-bold text-amber-400 font-mono mb-1 uppercase">FACILITATOR HINT</div>
                                                <div className="text-xs text-amber-200/80 leading-relaxed">{rq.hint}</div>
                                            </div>
                                        )}

                                        {/* Response textarea */}
                                        <textarea
                                            className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                                            rows={3}
                                            placeholder={`Capture ${rq.role.toUpperCase()} response...`}
                                            defaultValue={savedResponse}
                                            onBlur={(e) => onSaveResponse(step.id, rq.role, rq.q, e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Communication exercise */}
            {step.comms && (
                <div className="bg-card/30 border border-border rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">✍️</span>
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            Communication Exercise — Audience: {step.comms.audience}
                        </h3>
                    </div>
                    <pre className="text-[10px] text-muted-foreground bg-muted/20 rounded-lg p-3 font-mono whitespace-pre-wrap">
                        {step.comms.template}
                    </pre>
                    <textarea
                        className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                        rows={6}
                        placeholder="Draft your communication here..."
                        defaultValue={commsDrafts[`${step.id}-comms`] ?? ""}
                        onBlur={(e) => onSaveComms(step.id, step.comms!.audience, step.comms!.template, e.target.value)}
                    />
                </div>
            )}
        </div>
    );
}
