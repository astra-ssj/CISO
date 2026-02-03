"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Target, BarChart2, Activity } from "lucide-react";

export type StrategyLevel = "okr" | "kpi" | "metric";

interface StrategyPyramidProps {
    selectedLevel: StrategyLevel;
    onSelectLevel: (level: StrategyLevel) => void;
    counts?: {
        okr: number;
        kpi: number;
        metric: number;
    };
}

export function StrategyPyramid({
    selectedLevel,
    onSelectLevel,
    counts = { okr: 0, kpi: 0, metric: 0 },
}: StrategyPyramidProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 relative w-full h-full min-h-[500px]">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative w-80 h-80 flex flex-col gap-1 z-10">

                {/* Level 1: OKR (Top) */}
                <PyramidSegment
                    level="okr"
                    label="Strategic OKRs"
                    icon={<Target className="w-6 h-6" />}
                    count={counts.okr}
                    isActive={selectedLevel === "okr"}
                    onClick={() => onSelectLevel("okr")}
                    color="bg-purple-500"
                    clipPath="polygon(50% 0%, 100% 100%, 0% 100%)"
                    className="h-1/3 w-full flex items-end justify-center pb-2 z-30"
                    width="w-[33%]"
                />

                {/* Level 2: KPI (Middle) */}
                <PyramidSegment
                    level="kpi"
                    label="Tactical KPIs"
                    icon={<BarChart2 className="w-5 h-5" />}
                    count={counts.kpi}
                    isActive={selectedLevel === "kpi"}
                    onClick={() => onSelectLevel("kpi")}
                    color="bg-blue-500"
                    clipPath="polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)"
                    className="h-1/3 w-full flex items-center justify-center z-20"
                    width="w-[66%]"
                />

                {/* Level 3: Metrics (Base) */}
                <PyramidSegment
                    level="metric"
                    label="Operational Metrics"
                    icon={<Activity className="w-5 h-5" />}
                    count={counts.metric}
                    isActive={selectedLevel === "metric"}
                    onClick={() => onSelectLevel("metric")}
                    color="bg-emerald-500"
                    clipPath="polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)"
                    className="h-1/3 w-full flex items-start justify-center pt-4 z-10"
                    width="w-full"
                />

            </div>

            {/* Connector Line */}
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-purple-500/0 via-blue-500/20 to-emerald-500/0 -z-10" />
        </div>
    );
}

interface PyramidSegmentProps {
    level: StrategyLevel;
    label: string;
    icon: React.ReactNode;
    count: number;
    isActive: boolean;
    onClick: () => void;
    color: string;
    clipPath: string;
    className?: string;
    width: string;
}

function PyramidSegment({
    label,
    icon,
    count,
    isActive,
    onClick,
    color,
    clipPath,
    className,
    width,
}: PyramidSegmentProps) {
    return (
        <motion.div
            className={cn("cursor-pointer relative transition-all duration-300 group mx-auto", width)}
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* The visible shape */}
            <div
                className={cn(
                    "absolute inset-0 opacity-20 transition-opacity backdrop-blur-md border border-white/10",
                    color,
                    isActive ? "opacity-40 shadow-[0_0_30px_rgba(var(--color),0.4)]" : "group-hover:opacity-30"
                )}
                style={{ clipPath }}
            />

            {/* Border outline for shape definition */}
            <div
                className={cn("absolute inset-0 border-2 border-transparent transition-colors", isActive ? "border-white/20" : "")}
                style={{ clipPath }}
            />

            {/* Content */}
            <div className={cn("relative h-full flex flex-col items-center justify-center text-center p-2", className)}>
                <div className={cn(
                    "p-2 rounded-full mb-1 transition-colors",
                    isActive ? "bg-white/10 text-white" : "text-zinc-400 group-hover:text-zinc-200"
                )}>
                    {icon}
                </div>
                <div className="leading-none">
                    <div className={cn("font-bold text-sm", isActive ? "text-white" : "text-zinc-400")}>{label}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-1">{count} ITEMS</div>
                </div>
            </div>
        </motion.div>
    );
}
