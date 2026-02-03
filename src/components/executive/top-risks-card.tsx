"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface RiskItem {
    id: string;
    businessRisk: string; // The "Business Language" version
    technicalRootCause: string; // The technical detail (hidden/small)
    trend: "up" | "down" | "stable";
    severity: "critical" | "high" | "medium";
    owner: string;
}

interface TopRisksCardProps {
    risks: RiskItem[];
    maxItems?: number;
}

export function TopRisksCard({ risks, maxItems = 3 }: TopRisksCardProps) {
    // Enforce maxItems strictly for the "Brief" concept
    const displayRisks = risks.slice(0, maxItems);

    return (
        <Card className="h-full bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertOctagon className="w-24 h-24 text-red-500" />
            </div>

            <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Top {maxItems} Business Risks
                </CardTitle>
                <p className="text-zinc-500 text-sm">
                    Critical threats to revenue and continuity.
                </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 relative z-10">
                {displayRisks.map((risk, index) => (
                    <motion.div
                        key={risk.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="text-lg font-semibold text-zinc-100 leading-tight">
                                {risk.businessRisk}
                            </h3>
                            <RiskBadge severity={risk.severity} />
                        </div>

                        <div className="flex items-center justify-between mt-3">
                            <div className="text-xs text-zinc-500 font-mono group-hover:text-zinc-400 transition-colors">
                                Root Cause: <span className="text-zinc-400">{risk.technicalRootCause}</span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <span>Owner: {risk.owner}</span>
                                <TrendIndicator trend={risk.trend} />
                            </div>
                        </div>
                    </motion.div>
                ))}

                {risks.length === 0 && (
                    <div className="text-center py-10 text-zinc-500 italic">
                        No critical business risks identified.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function RiskBadge({ severity }: { severity: RiskItem["severity"] }) {
    const colors = {
        critical: "bg-red-500/10 text-red-500 border-red-500/20",
        high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    };

    return (
        <span
            className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                colors[severity]
            )}
        >
            {severity}
        </span>
    );
}

function TrendIndicator({ trend }: { trend: RiskItem["trend"] }) {
    if (trend === 'stable') return <span className="text-zinc-600">–</span>;
    return (
        <span className={cn("flex items-center gap-0.5", trend === 'up' ? "text-red-500" : "text-emerald-500")}>
            <TrendingUp className={cn("w-3 h-3", trend === 'down' && "rotate-180")} />
        </span>
    )
}
