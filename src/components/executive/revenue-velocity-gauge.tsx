"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Zap } from "lucide-react";

export interface VelocityMetric {
    id: string;
    processName: string; // e.g., "Vendor Onboarding"
    delay: string; // e.g., "+2 Weeks"
    impact: "low" | "medium" | "high";
    status: "blocked" | "slow" | "optimized";
}

interface RevenueVelocityGaugeProps {
    metrics: VelocityMetric[];
}

export function RevenueVelocityGauge({ metrics }: RevenueVelocityGaugeProps) {
    return (
        <Card className="h-full bg-zinc-900 border-zinc-800 shadow-xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    Revenue Velocity
                </CardTitle>
                <p className="text-zinc-500 text-sm">
                    Where is security slowing down the business?
                </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {metrics.map((metric) => (
                    <div
                        key={metric.id}
                        className="group flex items-center justify-between p-3 rounded-lg bg-zinc-950/30 border border-zinc-800/30 hover:bg-zinc-950/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <StatusIcon status={metric.status} />
                            <div>
                                <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                                    {metric.processName}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    Impact: <span className="uppercase">{metric.impact}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-bold font-mono ${getDelayColor(metric.status)}`}>
                                {metric.delay}
                            </p>
                        </div>
                    </div>
                ))}
                {metrics.length === 0 && (
                    <div className="text-center py-6 text-zinc-500 italic text-sm">
                        No velocity constraints detected.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StatusIcon({ status }: { status: VelocityMetric["status"] }) {
    if (status === "blocked") {
        return <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />;
    }
    if (status === "slow") {
        return <div className="w-2 h-2 rounded-full bg-amber-500" />;
    }
    return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
}

function getDelayColor(status: VelocityMetric["status"]) {
    if (status === 'blocked') return 'text-red-500';
    if (status === 'slow') return 'text-amber-500';
    return 'text-emerald-500';
}
