"use client";

import { useState, useCallback } from "react";
import type { Scenario, Decision, RoleId } from "@/lib/exercises/types";
import { useExerciseSession } from "@/hooks/exercises/useExerciseSession";
import { generateAssessment } from "@/lib/exercises/scoring";
import { StepProgress } from "./shared/StepProgress";
import { Scoreboard } from "./decision/Scoreboard";
import { DecisionStep } from "./decision/DecisionStep";
import { DiscussionStep } from "./discussion/DiscussionStep";
import { FinalAssessment } from "./decision/FinalAssessment";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

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

    const handleFinish = useCallback(async () => {
        await finishExercise();
        setIsComplete(true);
    }, [finishExercise]);

    if (!currentStepData && !isComplete) return null;

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
                        selectedChoiceId={state.decisions[currentStepData.id]}
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
                            onClick={nextStep}
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
