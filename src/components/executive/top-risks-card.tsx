"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, AlertOctagon } from "lucide-react";

export interface RiskItem {
    id: string;
    businessRisk: string;
    technicalRootCause: string;
    trend: "up" | "down" | "stable";
    severity: "critical" | "high" | "medium" | "low";
    owner: string;
}

interface TopRisksCardProps {
    risks: RiskItem[];
}

export function TopRisksCard({ risks, strategyLevel }: { risks: RiskItem[], strategyLevel?: 'okr' | 'kpi' | 'metric' }) {
    // Filter logic: 
    // OKR -> Critical business risks (Strategic)
    // KPI -> High technical risks (Tactical)
    // Metric -> Operational risks (process/supply chain)

    // For now, let's just highlight instead of strict filter to keep density high
    // or maybe strict filter is cleaner? "Not focused and too many things" -> Strict Filter.

    const visibleRisks = risks.filter(r => {
        if (!strategyLevel) return true;
        if (strategyLevel === 'okr') return r.severity === 'critical'; // Strategic
        if (strategyLevel === 'kpi') return r.severity === 'high'; // Tactical
        return true; // Metric shows all or medium
    });

    const displayRisks = visibleRisks.slice(0, 4);

    return (
        <div className="h-full flex flex-col">
            <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                Active Risks
            </h3>

            <div className="space-y-3">
                {displayRisks.length === 0 && (
                    <div className="text-zinc-600 italic text-sm py-4">No critical risks at this level.</div>
                )}
                {displayRisks.map((risk, i) => (
                    <div key={risk.id} className="group relative pl-4 border-l border-zinc-800 hover:border-red-500/50 transition-colors duration-300">
                        {/* Hover Glow */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-red-500 opacity-0 group-hover:opacity-100 shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-all duration-300" />

                        <div className="flex justify-between items-start">
                            <h4 className="text-zinc-300 text-sm font-medium group-hover:text-white transition-colors">
                                {risk.businessRisk}
                            </h4>
                            <SeverityBadge severity={risk.severity} />
                        </div>

                        <div className="mt-1 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">
                                {risk.technicalRootCause}
                            </span>
                            <TrendIndicator trend={risk.trend} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Context Line */}
            <div className="mt-auto pt-4 border-t border-zinc-900">
                <div className="flex justify-between items-center text-[10px] uppercase text-zinc-600 font-mono">
                    <span>Total Exposure</span>
                    <span className="text-zinc-400">$4.2M / Qtr</span>
                </div>
            </div>
        </div>
    );
}

function SeverityBadge({ severity }: { severity: RiskItem["severity"] }) {
    const styles = {
        critical: "bg-red-500/10 text-red-500 border-red-500/20",
        high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        low: "bg-blue-500/10 text-blue-500 border-blue-500/20"
    };

    return (
        <Badge variant="outline" className={cn("text-[10px] uppercase h-5 px-1.5", styles[severity])}>
            {severity}
        </Badge>
    );
}

function TrendIndicator({ trend }: { trend: RiskItem["trend"] }) {
    if (trend === 'up') return <div className="flex items-center text-red-400 gap-1"><TrendingUp className="w-3 h-3" /> Degrading</div>;
    if (trend === 'down') return <div className="flex items-center text-emerald-400 gap-1"><TrendingDown className="w-3 h-3" /> Improving</div>;
    return <div className="flex items-center text-zinc-500 gap-1"><Minus className="w-3 h-3" /> Stable</div>;
}
