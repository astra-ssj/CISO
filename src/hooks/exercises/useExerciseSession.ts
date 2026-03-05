"use client";

import { useState, useCallback } from "react";
import type { SessionState, Scenario, Decision, DecisionRecord } from "@/lib/exercises/types";
import { clampRep } from "@/lib/exercises/scoring";
import { saveDecision, saveResponse, saveCommsDraft, completeSession } from "@/lib/exercises/actions";

export function useExerciseSession(scenario: Scenario, sessionId: string, mode: "decision" | "discussion") {
    const [state, setState] = useState<SessionState>({
        sessionId,
        scenarioSlug: scenario.slug,
        mode,
        currentStep: 0,
        dollars: scenario.startDollars,
        repInternal: scenario.startRepInternal,
        repExternal: scenario.startRepExternal,
        decisions: {},
        responses: {},
        commsDrafts: {},
        history: [],
    });

    const currentStepData = scenario.steps[state.currentStep] ?? null;
    const isLastStep = state.currentStep === scenario.steps.length - 1;
    const hasDecidedCurrentStep = state.decisions[currentStepData?.id ?? -1] !== undefined;

    const makeDecision = useCallback(async (decision: Decision) => {
        const step = scenario.steps[state.currentStep];
        if (!step) return;

        const newDollars = state.dollars + decision.dollars;
        const newRepInt = clampRep(state.repInternal + decision.repInt);
        const newRepExt = clampRep(state.repExternal + decision.repExt);

        const record: DecisionRecord = {
            stepId: step.id,
            time: step.time,
            title: step.title,
            choiceId: decision.id,
            choiceLabel: decision.label,
            role: decision.role,
            dollars: decision.dollars,
            repInt: decision.repInt,
            repExt: decision.repExt,
            consequence: decision.consequence,
        };

        setState((prev) => ({
            ...prev,
            dollars: newDollars,
            repInternal: newRepInt,
            repExternal: newRepExt,
            decisions: { ...prev.decisions, [step.id]: decision.id },
            history: [...prev.history, record],
        }));

        // Persist to DB
        try {
            await saveDecision({
                sessionId,
                stepId: step.id,
                stepTime: step.time,
                stepTitle: step.title,
                choiceId: decision.id,
                choiceLabel: decision.label,
                role: decision.role,
                dollarImpact: decision.dollars,
                repInternalDelta: decision.repInt,
                repExternalDelta: decision.repExt,
                consequence: decision.consequence,
                cascadeFlag: decision.cascadeFlag,
            });
        } catch (e) {
            console.error("Failed to persist decision:", e);
        }
    }, [state.currentStep, state.dollars, state.repInternal, state.repExternal, scenario.steps, sessionId]);

    const saveDiscussionResponse = useCallback(async (stepId: number, role: string, question: string, response: string) => {
        const key = `${stepId}-${role}`;
        setState((prev) => ({
            ...prev,
            responses: { ...prev.responses, [key]: response },
        }));

        try {
            await saveResponse({ sessionId, stepId, role, question, response });
        } catch (e) {
            console.error("Failed to persist response:", e);
        }
    }, [sessionId]);

    const saveComms = useCallback(async (stepId: number, audience: string, template: string, draft: string) => {
        const key = `${stepId}-comms`;
        setState((prev) => ({
            ...prev,
            commsDrafts: { ...prev.commsDrafts, [key]: draft },
        }));

        try {
            await saveCommsDraft({ sessionId, stepId, audience, template, draft });
        } catch (e) {
            console.error("Failed to persist comms draft:", e);
        }
    }, [sessionId]);

    const nextStep = useCallback(() => {
        if (state.currentStep < scenario.steps.length - 1) {
            setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
        }
    }, [state.currentStep, scenario.steps.length]);

    const prevStep = useCallback(() => {
        if (state.currentStep > 0) {
            setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
        }
    }, [state.currentStep]);

    const finishExercise = useCallback(async () => {
        try {
            await completeSession(sessionId, state.dollars, state.repInternal, state.repExternal);
        } catch (e) {
            console.error("Failed to complete session:", e);
        }
    }, [sessionId, state.dollars, state.repInternal, state.repExternal]);

    return {
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
    };
}
