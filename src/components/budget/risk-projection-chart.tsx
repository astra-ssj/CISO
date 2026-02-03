"use client";

import React, { useMemo } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { BudgetState } from "./budget-controls";

interface RiskProjectionChartProps {
    budget: BudgetState;
}

export function RiskProjectionChart({ budget }: RiskProjectionChartProps) {

    // Calculate projected risk based on budget inputs
    // Logic: Higher spend = Lower risk (diminishing returns)
    const data = useMemo(() => {
        const totalInvestment = Object.values(budget).reduce((a, b) => a + b, 0);

        // Base risk scenario (without investment)
        const baseRisk = 85;

        // Efficiency modifiers for each domain
        const reduction = (
            (budget.appSec * 0.00004) +
            (budget.infrastructure * 0.00003) +
            (budget.governance * 0.00002) +
            (budget.incidentResponse * 0.00005)
        );

        const currentRisk = Math.max(10, baseRisk - reduction);
        const baselineRisk = 45; // Fixed baseline for comparison

        // Generate monthly projection
        return Array.from({ length: 6 }, (_, i) => {
            const month = new Date();
            month.setMonth(month.getMonth() + i);
            return {
                name: month.toLocaleString('default', { month: 'short' }),
                baseline: Math.max(15, baselineRisk + (Math.sin(i) * 2)), // Little wobble
                projected: Math.max(15, currentRisk + (Math.sin(i) * 2) - (i * 0.5)), // Slight improvement over time
            };
        });
    }, [budget]);

    return (
        <div className="w-full h-full min-h-[300px]">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Projected Risk Trajectory (6 Months)</h3>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-indigo-500/50 border border-indigo-500"></div>
                        <span>Baseline (Current)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50 border border-emerald-500"></div>
                        <span>Projected (Simulated)</span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                        itemStyle={{ color: '#f4f4f5' }}
                        labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="baseline"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorBaseline)"
                    />
                    <Area
                        type="monotone"
                        dataKey="projected"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorProjected)"
                    />
                    {/* Acceptable Risk Threshold */}
                    <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'right', value: 'Risk Appetitie', fill: '#f59e0b', fontSize: 10 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
