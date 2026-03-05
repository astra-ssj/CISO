"use client";

import { cn } from "@/lib/utils";
import type { Step } from "@/lib/exercises/types";

interface StepProgressProps {
    steps: Step[];
    currentStep: number;
    decisions: Record<number, string>;
    onStepClick?: (index: number) => void;
}

export function StepProgress({ steps, currentStep, decisions, onStepClick }: StepProgressProps) {
    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="flex items-center gap-1 min-w-max px-1">
                {steps.map((step, i) => {
                    const isActive = i === currentStep;
                    const isCompleted = decisions[step.id] !== undefined || i < currentStep;
                    const isClickable = onStepClick && (isCompleted || i <= currentStep);

                    return (
                        <div key={step.id} className="flex items-center">
                            <button
                                onClick={() => isClickable && onStepClick?.(i)}
                                disabled={!isClickable}
                                className={cn(
                                    "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 min-w-[72px]",
                                    isActive && "bg-primary/10 ring-1 ring-primary/30",
                                    isCompleted && !isActive && "opacity-70",
                                    isClickable && "cursor-pointer hover:bg-primary/5",
                                    !isClickable && "cursor-default"
                                )}
                            >
                                <div
                                    className={cn(
                                        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                                        isActive && "bg-primary text-primary-foreground scale-110",
                                        isCompleted && !isActive && "bg-emerald-500/20 text-emerald-400",
                                        !isActive && !isCompleted && "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {isCompleted && !isActive ? "✓" : step.id}
                                </div>
                                <span
                                    className={cn(
                                        "text-[10px] font-mono whitespace-nowrap",
                                        isActive ? "text-primary font-semibold" : "text-muted-foreground"
                                    )}
                                >
                                    {step.time}
                                </span>
                            </button>
                            {i < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "h-px w-4 transition-colors",
                                        isCompleted ? "bg-emerald-500/40" : "bg-border"
                                    )}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
