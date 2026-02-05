"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export type TechniqueStatus = 'active' | 'blocked' | 'dormant';

interface TechniqueCardProps {
    id: string;
    name: string;
    status: TechniqueStatus;
    detectionCount?: number;
}

export function TechniqueCard({ id, name, status, detectionCount = 0 }: TechniqueCardProps) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <motion.div
                        className={cn(
                            "p-2 text-[10px] font-mono border rounded cursor-help transition-all duration-300 relative overflow-hidden group h-full flex flex-col justify-between",
                            status === 'dormant' && "bg-secondary/10 border-border/50 text-muted-foreground hover:bg-secondary/30",
                            status === 'blocked' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20",
                            status === 'active' && "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse-slow"
                        )}
                        whileHover={{ scale: 1.02 }}
                        layout
                    >
                        {/* Status Indicator Dot */}
                        <div className="flex justify-between items-start mb-1">
                            <span className="opacity-60">{id}</span>
                            {detectionCount > 0 && (
                                <span className={cn(
                                    "px-1 rounded text-[9px] font-bold",
                                    status === 'blocked' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                                )}>
                                    {detectionCount}
                                </span>
                            )}
                        </div>

                        <div className="leading-tight font-semibold line-clamp-2">
                            {name}
                        </div>

                        {/* Active Scanline Effect */}
                        {status === 'active' && (
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent pointer-events-none animate-scan" />
                        )}
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[200px]">
                    <div className="font-bold mb-1">{name} ({id})</div>
                    <div className="text-muted-foreground">
                        {status === 'active' ? 'Active threat detected matching this technique pattern.' :
                            status === 'blocked' ? 'Attack attempts using this technique have been neutralized.' :
                                'No recent activity detected.'}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
