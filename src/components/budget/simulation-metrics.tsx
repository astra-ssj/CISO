"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulationMetricsProps {
    riskScore: number;
    prevRiskScore: number;
    totalSpend: number;
    baselineSpend: number;
}

export function SimulationMetrics({ riskScore, prevRiskScore, totalSpend, baselineSpend }: SimulationMetricsProps) {

    const spendDiff = totalSpend - baselineSpend;
    const riskDiff = riskScore - prevRiskScore;

    return (
        <div className="grid grid-cols-3 gap-4">
            {/* Risk Score Card */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Projected Risk</p>
                        <div className="text-2xl font-bold flex items-baseline gap-2">
                            {riskScore.toFixed(0)}
                            <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                        </div>
                    </div>
                    <div className={cn("flex flex-col items-end", riskDiff > 0 ? "text-red-400" : "text-emerald-400")}>
                        {riskDiff !== 0 && (
                            <>
                                <span className="text-xs font-bold flex items-center">
                                    {riskDiff > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                    {Math.abs(riskDiff).toFixed(1)} pts
                                </span>
                                <span className="text-[10px] opacity-70">{riskDiff > 0 ? "Increased Exposure" : "Risk Reduction"}</span>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Spend Delta Card */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Budget Delta</p>
                        <div className="text-2xl font-bold text-zinc-100">
                            {spendDiff > 0 ? "+" : ""}${(spendDiff / 1000).toFixed(0)}k
                        </div>
                    </div>
                    <div className={cn("p-2 rounded-full", spendDiff > 0 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500")}>
                        <DollarSign className="w-5 h-5" />
                    </div>
                </CardContent>
            </Card>

            {/* Efficiency Score */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">ROI Efficiency</p>
                        <div className="text-2xl font-bold text-indigo-400">
                            94<span className="text-sm">%</span>
                        </div>
                    </div>
                    <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-400">
                        <Activity className="w-5 h-5" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
