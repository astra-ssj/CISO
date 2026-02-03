"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, XCircle, Activity, Box } from "lucide-react";

export interface Safeguard {
    id: string;
    name: string;
    type: "Technology" | "People" | "Process";
    status: "healthy" | "degraded" | "failing" | "missing";
    score: number; // 0-100
}

interface SafeguardCellProps {
    safeguard?: Safeguard;
    emptyText?: string;
    compact?: boolean;
}

export function SafeguardCell({ safeguard, emptyText = "Gap", compact = false }: SafeguardCellProps) {
    if (!safeguard || safeguard.status === 'missing') {
        return (
            <div className={cn(
                "flex items-center justify-center rounded border border-dashed border-zinc-800 bg-zinc-900/10 text-[10px] text-zinc-600 font-mono",
                compact ? "h-6 w-full" : "h-7 px-2"
            )}>
                {emptyText}
            </div>
        );
    }

    const statusConfig = {
        healthy: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/20", icon: ShieldCheck },
        degraded: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/20", icon: AlertTriangle },
        failing: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/20", icon: XCircle },
    };

    const config = statusConfig[safeguard.status] || statusConfig.failing;
    const StatusIcon = config.icon;

    return (
        <TooltipProvider>
            <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "group flex items-center gap-1.5 rounded-sm border px-2 py-1 cursor-pointer transition-all hover:bg-opacity-80 hover:scale-[1.02]",
                        config.bg, config.border,
                        compact ? "h-6" : "min-h-[28px]"
                    )}>
                        <StatusIcon className={cn("w-3 h-3 flex-shrink-0", config.text)} />
                        <span className="text-[11px] font-medium text-zinc-300 truncate max-w-[120px]">
                            {safeguard.name}
                        </span>

                        {/* Score indicator for high density view */}
                        {!compact && (
                            <div className={cn("ml-auto text-[9px] font-mono opacity-60", config.text)}>
                                {safeguard.score}
                            </div>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 border-zinc-800 p-3 shadow-xl">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                            <span className="font-semibold text-sm">{safeguard.name}</span>
                            <Badge variant="outline" className={cn("text-[10px] uppercase h-5", config.border, config.text)}>
                                {safeguard.status}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Box className="w-3 h-3" />
                                {safeguard.type}
                            </div>
                            <div className="flex items-center gap-1.5 font-mono">
                                <Activity className="w-3 h-3" />
                                Score: {safeguard.score}/100
                            </div>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
