"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpDown } from "lucide-react";

const DATA = [
    { time: '14:00', ingress: 120, egress: 80 },
    { time: '14:05', ingress: 132, egress: 85 },
    { time: '14:10', ingress: 101, egress: 90 },
    { time: '14:15', ingress: 134, egress: 110 },
    { time: '14:20', ingress: 190, egress: 130 },
    { time: '14:25', ingress: 230, egress: 150 },
    { time: '14:30', ingress: 210, egress: 160 },
    { time: '14:35', ingress: 180, egress: 140 },
    { time: '14:40', ingress: 170, egress: 120 },
    { time: '14:45', ingress: 190, egress: 130 },
    { time: '14:50', ingress: 240, egress: 170 },
    { time: '14:55', ingress: 280, egress: 190 },
];

export function NetworkTrafficChart() {
    return (
        <Card className="border-primary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5 text-primary" />
                    Traffic Volume (Ingress vs Egress)
                </CardTitle>
                <CardDescription>
                    Aggregated bytes/sec across all cluster nodes
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={DATA}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorIngress" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorEgress" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis
                                dataKey="time"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value} MB`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '8px',
                                    color: 'hsl(var(--foreground))'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="ingress"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorIngress)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="egress"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorEgress)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
