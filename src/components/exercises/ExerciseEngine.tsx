/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { useState, useCallback } from "react";
import type { Scenario } from "@/lib/exercises/types";
import { useExerciseSession } from "@/hooks/exercises/useExerciseSession";
import { generateAssessment } from "@/lib/exercises/scoring";
import { StepProgress } from "./shared/StepProgress";
import { Scoreboard } from "./decision/Scoreboard";
import { DecisionStep } from "./decision/DecisionStep";
import { DiscussionStep } from "./discussion/DiscussionStep";
import { FinalAssessment } from "./decision/FinalAssessment";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeadlineStyle } from "./shared/DeadlineTracker";

interface ExerciseEngineProps {
    scenario: Scenario;
    sessionId: string;
    mode: "decision" | "discussion";
}

export function ExerciseEngine({ scenario, sessionId, mode }: ExerciseEngineProps) {
    const {
        state,
        currentStepData,
        isLastStep,
        hasDecidedCurrentStep,
        makeDecision,
        saveDiscussionResponse,
        saveComms,
        nextStep,
        prevStep,
        finishExercise,
    } = useExerciseSession(scenario, sessionId, mode);

    const [isComplete, setIsComplete] = useState(false);
    const [showTransition, setShowTransition] = useState(false);

    const handleFinish = useCallback(async () => {
        await finishExercise();
        try {
            await fetch('/api/skills/tabletop-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario: { id: scenario.id, slug: scenario.slug, title: scenario.title },
                    state,
                }),
            });
        } catch {
            // Skill persist is best-effort; the local grade still renders.
        }
        setIsComplete(true);
    }, [finishExercise, scenario, state]);

    if (!currentStepData && !isComplete) return null;

    const handleNextStep = () => {
        setShowTransition(true);
        // Auto-advance after 3 seconds or on click
        setTimeout(() => {
            setShowTransition(false);
            nextStep();
        }, 5000);
    };

    // Final assessment screen
    if (isComplete && mode === "decision") {
        const assessment = generateAssessment(state, scenario);
        return (
            <div className="max-w-3xl mx-auto py-8 px-4">
                <FinalAssessment
                    assessment={assessment}
                    scenarioTitle={scenario.title}
                    onRestart={() => window.location.href = "/exercises"}
                />
            </div>
        );
    }

    if (isComplete && mode === "discussion") {
        return (
            <div className="max-w-3xl mx-auto py-8 px-4 text-center space-y-6 animate-in fade-in duration-500">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-foreground">Discussion Complete</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    All responses have been captured and saved. This exercise session is now part of your audit trail.
                </p>
                <div className="flex items-center justify-center gap-4 pt-4">
                    <a href="/exercises" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
                        Back to Scenarios
                    </a>
                </div>
            </div>
        );
    }

    if (showTransition) {
        // Find the record of the decision just made
        const lastDecision = state.history.find(h => h.stepId === currentStepData?.id);
        const nextStepData = scenario.steps[state.currentStep + 1];

        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto px-4 w-full">
                <div className="w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary/10 border-b border-border/50 p-6 text-center">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 mb-3 animate-pulse">
                            <Flag className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold uppercase tracking-wider text-foreground">Step {state.currentStep + 1} Complete</h2>
                        <p className="text-muted-foreground text-sm mt-1">{currentStepData?.title}</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Decision Impact (if a decision was made) */}
                        {lastDecision && mode === "decision" && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-mono uppercase text-muted-foreground">Action Taken</h3>
                                <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
                                    <p className="font-medium text-sm mb-2 text-foreground/90">{lastDecision.choiceLabel}</p>
                                    <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
                                        <span className={lastDecision.dollars < 0 ? "text-red-400" : "text-emerald-400"}>
                                            Impact: {lastDecision.dollars < 0 ? "-" : "+"}€{Math.abs(lastDecision.dollars / 1000)}K
                                        </span>
                                        <span className="opacity-50">•</span>
                                        <span className={lastDecision.repInt < 0 ? "text-red-400" : lastDecision.repInt > 0 ? "text-emerald-400" : ""}>
                                            Internal: {lastDecision.repInt > 0 ? "+" : ""}{lastDecision.repInt}
                                        </span>
                                        <span className="opacity-50">•</span>
                                        <span className={lastDecision.repExt < 0 ? "text-red-400" : lastDecision.repExt > 0 ? "text-emerald-400" : ""}>
                                            External: {lastDecision.repExt > 0 ? "+" : ""}{lastDecision.repExt}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Running Totals */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-mono uppercase text-muted-foreground">Running Totals</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-muted/30 border border-border/50 rounded-lg p-3 text-center">
                                    <span className="block text-xl mb-1">💰</span>
                                    <div className="text-xs text-muted-foreground mb-1">Net Cost</div>
                                    <div className="font-mono text-sm font-medium text-red-400">
                                        -€{Math.abs(state.dollars / 1000)}K
                                    </div>
                                </div>
                                <div className="bg-muted/30 border border-border/50 rounded-lg p-3 text-center">
                                    <span className="block text-xl mb-1">👥</span>
                                    <div className="text-xs text-muted-foreground mb-1">Internal Rep</div>
                                    <div className={cn("font-mono text-sm font-medium", state.repInternal < 50 ? "text-red-400" : "text-emerald-400")}>
                                        {state.repInternal}%
                                    </div>
                                </div>
                                <div className="bg-muted/30 border border-border/50 rounded-lg p-3 text-center">
                                    <span className="block text-xl mb-1">🌍</span>
                                    <div className="text-xs text-muted-foreground mb-1">External Rep</div>
                                    <div className={cn("font-mono text-sm font-medium", state.repExternal < 50 ? "text-red-400" : "text-emerald-400")}>
                                        {state.repExternal}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Watch out / Consequence */}
                        {lastDecision?.consequence && mode === "decision" && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3">
                                <span className="text-amber-500 text-lg shrink-0">⚠️</span>
                                <div>
                                    <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Consequence</h4>
                                    <p className="text-sm text-amber-400/90 leading-relaxed">{lastDecision.consequence}</p>
                                </div>
                            </div>
                        )}

                        {/* Next Step Preview */}
                        {nextStepData && (
                            <div className="pt-4 border-t border-border/50 space-y-2">
                                <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Up Next</h3>
                                <div className="flex items-center gap-3">
                                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-mono">
                                        {nextStepData.time}
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        Step {nextStepData.id}: {nextStepData.title}
                                    </span>
                                </div>
                                {nextStepData.deadline && nextStepData.deadline.length > 0 && (
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-mono">
                                        <span>⏱</span>
                                        {nextStepData.deadline.map((d, i) => {
                                            const style = getDeadlineStyle(d.hoursRemaining, d.isOverdue);
                                            return (
                                                <span key={i} className="flex items-center gap-1">
                                                    <span>{d.label}:</span>
                                                    <span className={d.isOverdue ? "text-rose-500 font-bold" : style.color}>{style.label}</span>
                                                    {i < nextStepData.deadline!.length - 1 && <span className="text-muted-foreground opacity-50 ml-2">·</span>}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer / Continue */}
                    <div className="bg-muted/10 border-t border-border/50 p-4 flex justify-center">
                        <button
                            onClick={() => {
                                setShowTransition(false);
                                nextStep();
                            }}
                            className="w-full sm:w-auto px-8 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            Continue to Next Step →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-6 max-w-7xl mx-auto py-6 px-4">
            {/* Main content */}
            <div className="flex-1 space-y-6 min-w-0">
                {/* Step progress */}
                <StepProgress
                    steps={scenario.steps}
                    currentStep={state.currentStep}
                    decisions={state.decisions}
                />

                {/* Step content */}
                {mode === "decision" && currentStepData && (
                    <DecisionStep
                        step={currentStepData}
                        onDecision={makeDecision}
                        hasDecided={hasDecidedCurrentStep}
                        selectedChoiceId={state.decisions[currentStepData.id]?.choiceId}
                    />
                )}

                {mode === "discussion" && currentStepData && (
                    <DiscussionStep
                        step={currentStepData}
                        sessionId={sessionId}
                        responses={state.responses}
                        commsDrafts={state.commsDrafts}
                        onSaveResponse={saveDiscussionResponse}
                        onSaveComms={saveComms}
                    />
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <button
                        onClick={prevStep}
                        disabled={state.currentStep === 0}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            state.currentStep === 0
                                ? "text-muted-foreground cursor-not-allowed"
                                : "text-foreground hover:bg-muted"
                        )}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </button>

                    <span className="text-xs text-muted-foreground font-mono">
                        Step {state.currentStep + 1} of {scenario.steps.length}
                    </span>

                    {isLastStep ? (
                        <button
                            onClick={handleFinish}
                            disabled={mode === "decision" && !hasDecidedCurrentStep}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                mode === "decision" && !hasDecidedCurrentStep
                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            <Flag className="h-4 w-4" />
                            Complete Exercise
                        </button>
                    ) : (
                        <button
                            onClick={handleNextStep}
                            disabled={mode === "decision" && !hasDecidedCurrentStep}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                mode === "decision" && !hasDecidedCurrentStep
                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Scoreboard sidebar (decision mode only) */}
            {mode === "decision" && (
                <div className="hidden lg:block flex-shrink-0">
                    <div className="sticky top-24">
                        <Scoreboard state={state} />
                    </div>
                </div>
            )}
        </div>
    );
}
