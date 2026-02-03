"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, ArrowRight, TrendingUp, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { StrategyLevel } from "./strategy-pyramid";

// SHARED TYPES
export interface Metric {
    id: string;
    name: string;
    value: string;
    trend: "up" | "down" | "flat";
    status: "healthy" | "warning" | "critical";
}

export interface KPI {
    id: string;
    name: string;
    target: string;
    current: string;
    status: "healthy" | "warning" | "critical";
    metrics: Metric[];
}

export interface OKR {
    id: string;
    objective: string;
    progress: number; // 0-100
    status: "on-track" | "at-risk" | "behind";
    kpis: KPI[];
}

interface AlignmentViewProps {
    level: StrategyLevel;
    data: OKR[]; // We pass the full tree, displaying based on selection
}

export function AlignmentView({ level, data }: AlignmentViewProps) {
    // Flattening logic for display based on level
    // In a real app this might fetch data, but here we derive it

    return (
        <Card className="h-full bg-zinc-900/50 border-zinc-800 backdrop-blur-sm flex flex-col">
            <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                    {level === 'okr' && <Target className="w-5 h-5 text-purple-500" />}
                    {level === 'kpi' && <TrendingUp className="w-5 h-5 text-blue-500" />}
                    {level === 'metric' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}

                    <span>
                        {level === 'okr' && "Strategic Objectives (OKRs)"}
                        {level === 'kpi' && "Key Performance Indicators (KPIs)"}
                        {level === 'metric' && "Operational Metrics"}
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence mode="wait">
                    {level === 'okr' && <OKRList okrs={data} />}
                    {level === 'kpi' && <KPIList kpis={data.flatMap(o => o.kpis)} />}
                    {level === 'metric' && <MetricList metrics={data.flatMap(o => o.kpis.flatMap(k => k.metrics))} />}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

function OKRList({ okrs }: { okrs: OKR[] }) {
    return (
        <div className="space-y-4">
            {okrs.map((okr, i) => (
                <motion.div
                    key={okr.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-purple-500/50 transition-colors"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-zinc-100">{okr.objective}</h3>
                        <StatusBadge status={okr.status} />
                    </div>

                    <div className="w-full bg-zinc-900 rounded-full h-2 mb-4">
                        <div
                            className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${okr.progress}%` }}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Supporting KPIs</div>
                        {okr.kpis.map(kpi => (
                            <div key={kpi.id} className="flex items-center justify-between text-sm p-2 rounded bg-zinc-900/50">
                                <span className="text-zinc-300">{kpi.name}</span>
                                <span className={kpi.status === 'critical' ? 'text-red-400' : 'text-emerald-400'}>
                                    {kpi.current}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

function KPIList({ kpis }: { kpis: KPI[] }) {
    return (
        <div className="grid grid-cols-1 gap-4">
            {kpis.map((kpi, i) => (
                <motion.div
                    key={kpi.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-3"
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-zinc-500" />
                            <span className="font-medium text-zinc-200">{kpi.name}</span>
                        </div>
                        <HealthDot status={kpi.status} />
                    </div>

                    <div className="flex items-end justify-between border-t border-zinc-900 pt-3">
                        <div>
                            <div className="text-xs text-zinc-500">Target</div>
                            <div className="text-sm font-mono text-zinc-400">{kpi.target}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-zinc-500">Current</div>
                            <div className="text-xl font-bold text-zinc-100">{kpi.current}</div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

function MetricList({ metrics }: { metrics: Metric[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.map((metric, i) => (
                <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-2"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs text-zinc-500 line-clamp-2 min-h-[2.5em]">{metric.name}</span>
                        <HealthDot status={metric.status} size="sm" />
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-200">{metric.value}</div>
                </motion.div>
            ))}
        </div>
    )
}

function StatusBadge({ status }: { status: OKR["status"] }) {
    const styles = {
        "on-track": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        "at-risk": "bg-amber-500/10 text-amber-500 border-amber-500/20",
        "behind": "bg-red-500/10 text-red-500 border-red-500/20",
    }
    return (
        <Badge variant="outline" className={cn("capitalize", styles[status])}>
            {status.replace("-", " ")}
        </Badge>
    )
}

function HealthDot({ status, size = "md" }: { status: "healthy" | "warning" | "critical", size?: "sm" | "md" }) {
    const colors = {
        healthy: "bg-emerald-500",
        warning: "bg-amber-500",
        critical: "bg-red-500"
    }
    return (
        <div className={cn(
            "rounded-full",
            colors[status],
            size === "sm" ? "w-2 h-2" : "w-3 h-3"
        )} />
    )
}
