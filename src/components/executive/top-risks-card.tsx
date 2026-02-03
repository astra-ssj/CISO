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

export function TopRisksCard({ risks }: TopRisksCardProps) {
    // Take only top 3
    const displayRisks = risks.slice(0, 3);

    return (
        <Card className="h-full border-zinc-800 bg-zinc-950/50 flex flex-col overflow-hidden group hover:border-zinc-700 transition-colors">
            <CardHeader className="pb-2 border-b border-zinc-800/50 bg-zinc-900/20">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Top Business Risks
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto">
                <div className="divide-y divide-zinc-800/50">
                    {displayRisks.map((risk) => (
                        <div key={risk.id} className="p-4 hover:bg-zinc-900/30 transition-colors">
                            <div className="flex items-start justify-between mb-1">
                                <div className="font-semibold text-sm text-zinc-100">{risk.businessRisk}</div>
                                <SeverityBadge severity={risk.severity} />
                            </div>
                            <div className="text-xs text-muted-foreground mb-3 font-mono border-l-2 border-zinc-800 pl-2 ml-1">
                                {risk.technicalRootCause}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wide">
                                <span>Owner: {risk.owner}</span>
                                <TrendIndicator trend={risk.trend} />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            {/* Footer / Status */}
            <div className="p-2 bg-red-500/5 border-t border-red-500/10 text-center">
                <span className="text-xs font-medium text-red-400">
                    {risks.filter(r => r.severity === 'critical').length} Critical Items Attention Required
                </span>
            </div>
        </Card>
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
