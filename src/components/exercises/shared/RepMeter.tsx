"use client";

import { cn } from "@/lib/utils";

interface RepMeterProps {
    label: string;
    value: number; // 0-100
    size?: "sm" | "md";
}

export function RepMeter({ label, value, size = "md" }: RepMeterProps) {
    const status = value >= 70 ? "healthy" : value >= 40 ? "warning" : "critical";
    const barColor = status === "healthy" ? "bg-emerald-500" : status === "warning" ? "bg-amber-500" : "bg-red-500";
    const textColor = status === "healthy" ? "text-emerald-400" : status === "warning" ? "text-amber-400" : "text-red-400";

    return (
        <div className={cn("space-y-1", size === "sm" ? "min-w-[100px]" : "min-w-[140px]")}>
            <div className="flex items-center justify-between">
                <span className={cn("font-medium uppercase tracking-wider", size === "sm" ? "text-[9px]" : "text-[10px]", "text-muted-foreground")}>
                    {label}
                </span>
                <span className={cn("font-mono font-bold", size === "sm" ? "text-xs" : "text-sm", textColor)}>
                    {value}%
                </span>
            </div>
            <div className={cn("rounded-full overflow-hidden", size === "sm" ? "h-1.5" : "h-2", "bg-muted")}>
                <div
                    className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
                    style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
            </div>
        </div>
    );
}
