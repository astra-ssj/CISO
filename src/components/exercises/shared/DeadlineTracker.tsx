"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeadlineTrackerProps {
    deadline: string;
}

export function DeadlineTracker({ deadline }: DeadlineTrackerProps) {
    const isUrgent = deadline.toLowerCase().includes("hour") || deadline.toLowerCase().includes("immediate");
    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono",
                isUrgent
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            )}
        >
            <Clock className={cn("h-3 w-3", isUrgent && "animate-pulse")} />
            <span className="font-semibold uppercase tracking-wider">Deadline:</span>
            <span>{deadline}</span>
        </div>
    );
}
