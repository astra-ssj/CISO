"use client";

import React from "react";
import { Zap } from "lucide-react";

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
    // Sort: Blocked first
    const sorted = [...metrics].sort((a, b) => (a.status === 'blocked' && b.status !== 'blocked' ? -1 : (b.status === 'blocked' && a.status !== 'blocked' ? 1 : 0)));

    return (
        <div className="h-full flex flex-col">
            <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Process Velocity
            </h3>

            <div className="space-y-4">
                {sorted.map(metric => (
                    <div key={metric.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            {/* Minimal Status Dot */}
                            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(metric.status)} ${metric.status === 'blocked' ? 'animate-pulse' : ''}`} />

                            <div>
                                <div className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                                    {metric.processName}
                                </div>
                                <div className="text-[10px] text-zinc-600">
                                    {metric.impact.toUpperCase()} IMPACT
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className={`text-xs font-mono ${metric.status === 'blocked' ? 'text-red-400' : 'text-zinc-500'}`}>
                                {metric.delay}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getStatusColor(status: VelocityMetric["status"]) {
    if (status === 'blocked') return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
    if (status === 'slow') return 'bg-amber-500';
    return 'bg-emerald-500';
}

