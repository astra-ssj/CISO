"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Timer, ArrowDown } from "lucide-react";

const DATA = [
    { name: "Mon", mttr: 45 },
    { name: "Tue", mttr: 30 },
    { name: "Wed", mttr: 55 },
    { name: "Thu", mttr: 25 },
    { name: "Fri", mttr: 20 },
    { name: "Sat", mttr: 15 },
    { name: "Sun", mttr: 12 },
];

export function RemediationVelocity() {
    return (
        <div className="h-full flex flex-col bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm p-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Timer className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-sm font-semibold text-zinc-100">Remediation Velocity</h3>
                    </div>
                    <p className="text-xs text-zinc-500">Mean Time To Remediate (MTTR)</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white flex items-center justify-end gap-1">
                        12h <ArrowDown className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-emerald-500">-24% vs last week</p>
                </div>
            </div>

            <div className="flex-1 min-h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={DATA}>
                        <XAxis
                            dataKey="name"
                            stroke="#52525b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#52525b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}h`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                            itemStyle={{ color: '#e4e4e7' }}
                            cursor={{ fill: '#27272a' }}
                        />
                        <Bar
                            dataKey="mttr"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
