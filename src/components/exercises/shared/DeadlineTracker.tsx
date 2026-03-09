"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

import type { Deadline } from "@/lib/exercises/types";

export function getDeadlineStyle(hours: number, overdue: boolean) {
    if (overdue) return {
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        label: "OVERDUE",
        pulse: true,
    };
    if (hours <= 4) return {
        color: "text-rose-500", bg: "bg-rose-500/10",
        border: "border-rose-500/15", label: `${hours}h`, pulse: true,
    };
    if (hours <= 12) return {
        color: "text-orange-400", bg: "bg-orange-400/10",
        border: "border-orange-400/15", label: `${hours}h`, pulse: false,
    };
    if (hours <= 24) return {
        color: "text-amber-400", bg: "bg-amber-400/10",
        border: "border-amber-400/15", label: `${hours}h`, pulse: false,
    };
    return {
        color: "text-emerald-500", bg: "bg-emerald-500/10",
        border: "border-emerald-500/15", label: `${hours}h`, pulse: false,
    };
}

interface DeadlineTrackerProps {
    deadlines: Deadline[];
}

export function DeadlineTracker({ deadlines }: DeadlineTrackerProps) {
    if (!deadlines || deadlines.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-3">
            {deadlines.map((d, i) => {
                const style = getDeadlineStyle(d.hoursRemaining, d.isOverdue);
                return (
                    <div
                        key={i}
                        className={cn(
                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-mono",
                            style.bg, style.border, style.color
                        )}
                    >
                        <Clock className={cn("h-3 w-3", style.pulse && "animate-pulse")} />
                        <span className="font-semibold uppercase tracking-wider">{d.label}:</span>
                        <span>{style.label}</span>
                    </div>
                );
            })}
        </div>
    );
}
