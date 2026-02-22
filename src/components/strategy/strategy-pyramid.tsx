"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Target, BarChart2, Activity } from "lucide-react";
import { useViewEngine } from "@/stores/view-engine-store";

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
    const { context } = useViewEngine();

    // Dynamic styling based on context
    const isGlobal = context.unit === 'Global';

    return (
        <div className="flex flex-col items-center justify-center relative w-full h-full perspective-[1000px]">
            {/* Context Indicator */}
            <div className="absolute top-4 right-4 text-xs font-mono text-zinc-500 border border-zinc-800 rounded px-2 py-1">
                SLICE: <span className="text-zinc-300">{context.unit.toUpperCase()}</span>{" "}{" // "}{context.timeframe}
            </div>

            {/* Dynamic Light Source - Changes color based on Unit */}
            <div className={cn(
                "absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b rounded-full blur-3xl pointer-events-none transition-colors duration-1000",
                "to-transparent",
                isGlobal ? "from-white/5" :
                    context.unit === 'Engineering' ? "from-blue-500/10" :
                        context.unit === 'Sales' ? "from-emerald-500/10" : "from-purple-500/10"
            )} />

            {/* The Pyramid Container */}
            <div className="relative w-96 h-96 flex flex-col gap-2 z-10 transform-style-3d">

                {/* Level 1: OKR (Top) */}
                <PyramidSegment
                    level="okr"
                    label="Strategic OKRs"
                    icon={<Target className="w-6 h-6" />}
                    count={counts.okr}
                    isActive={selectedLevel === "okr"}
                    onClick={() => onSelectLevel("okr")}
                    color="from-purple-500/80 to-purple-600/80"
                    glow="shadow-purple-500/50"
                    clipPath="polygon(50% 0%, 100% 100%, 0% 100%)"
                    className="h-1/3 w-full flex items-end justify-center pb-3 z-30"
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
                    color="from-blue-500/80 to-blue-600/80"
                    glow="shadow-blue-500/50"
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
                    color="from-emerald-500/80 to-emerald-600/80"
                    glow="shadow-emerald-500/50"
                    clipPath="polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)"
                    className="h-1/3 w-full flex items-start justify-center pt-5 z-10"
                    width="w-full"
                />

            </div>

            {/* Reflection / Grounding */}
            <div className="absolute bottom-10 w-64 h-4 bg-black/50 blur-xl rounded-full" />
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
    glow: string;
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
    glow,
    clipPath,
    className,
    width,
}: PyramidSegmentProps) {
    return (
        <motion.div
            className={cn("cursor-pointer relative transition-all duration-500 group mx-auto", width)}
            onClick={onClick}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            animate={{
                opacity: isActive ? 1 : 0.6,
                filter: isActive ? 'blur(0px)' : 'blur(0.5px)'
            }}
        >
            {/* Glass Material Layer */}
            <div
                className={cn(
                    "absolute inset-0 backdrop-blur-xl bg-gradient-to-br transition-all duration-500 border-t border-white/30",
                    color,
                    isActive ? "shadow-[0_0_50px_-10px] " + glow : "shadow-none"
                )}
                style={{ clipPath }}
            />

            {/* Inner Highlight/Sheen */}
            <div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ clipPath }}
            />

            {/* Content */}
            <div className={cn("relative h-full flex flex-col items-center justify-center text-center p-2", className)}>
                <motion.div
                    className={cn(
                        "p-2 rounded-full mb-1 transition-colors backdrop-blur-md",
                        isActive ? "bg-white/20 text-white shadow-lg" : "text-white/70"
                    )}
                    animate={{ y: isActive ? 0 : 2 }}
                >
                    {icon}
                </motion.div>
                <div className="leading-tight drop-shadow-md">
                    <div className={cn("font-bold text-sm tracking-wide text-white")}>{label}</div>
                    <div className="text-[10px] text-white/80 font-mono mt-0.5 tracking-wider">{count} ITEMS</div>
                </div>
            </div>
        </motion.div>
    );
}
