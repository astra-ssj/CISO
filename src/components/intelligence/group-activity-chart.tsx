"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RansomwareGroup } from "@/types/ransomware";
import { Crosshair } from "lucide-react";

interface GroupActivityChartProps {
    groups: RansomwareGroup[];
}

export function GroupActivityChart({ groups }: GroupActivityChartProps) {
    // Sort by victim count descending
    const data = [...groups].sort((a, b) => b.victim_count - a.victim_count).slice(0, 10);

    return (
        <Card className="bg-slate-950/50 border-slate-800 backdrop-blur-sm h-full">
            <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                    <Crosshair className="w-5 h-5 text-orange-400" />
                    Most Active Groups (All Time)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                            />
                            <Bar dataKey="victim_count" radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#f97316'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
