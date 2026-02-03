"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, XCircle, Activity } from "lucide-react";

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
}

export function SafeguardCell({ safeguard, emptyText = "None" }: SafeguardCellProps) {
    if (!safeguard || safeguard.status === 'missing') {
        return (
            <div className="h-full min-h-[60px] flex items-center justify-center p-2 rounded border border-dashed border-zinc-800 bg-zinc-900/20 text-xs text-zinc-600">
                {emptyText}
            </div>
        );
    }

    const statusStyles = {
        healthy: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20",
        degraded: "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20",
        failing: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20",
        missing: "bg-zinc-800 text-zinc-500"
    };

    const statusIcons = {
        healthy: ShieldCheck,
        degraded: AlertTriangle,
        failing: XCircle,
        missing: XCircle
    };

    const StatusIcon = statusIcons[safeguard.status];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "h-full min-h-[60px] p-2 rounded border flex flex-col justify-between cursor-pointer transition-colors",
                        statusStyles[safeguard.status]
                    )}>
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold leading-tight line-clamp-2">{safeguard.name}</span>
                            <StatusIcon className="w-3 h-3 flex-shrink-0" />
                        </div>
                        <div className="flex justify-between items-end mt-2">
                            <Badge variant="outline" className="text-[9px] px-1 h-4 border-zinc-700 bg-zinc-900/50 text-zinc-400 uppercase tracking-wider">
                                {safeguard.type}
                            </Badge>
                            <div className="text-[10px] font-mono opacity-80">{safeguard.score}%</div>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-xs">
                        <strong className="block mb-1">{safeguard.name}</strong>
                        <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-3 h-3" />
                            <span>Status: <span className="uppercase">{safeguard.status}</span></span>
                        </div>
                        <p className="text-muted-foreground">Type: {safeguard.type}</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
