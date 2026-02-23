"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Coins, Flame, Activity, Users, ShieldAlert, Cpu } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface CostMetrics {
    totalCostUSD: number;
    totalCalls: number;
    byFeature: { feature: string; calls: number; costUSD: number }[];
    byUser: { userId: string; calls: number; costUSD: number; modelsUsed: string[] }[];
}

export default function AdminEconomicsPage() {
    const [metrics, setMetrics] = useState<CostMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch('/api/admin/metrics');
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                }
            } catch (e) {
                console.error("Failed to load metrics", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
        );
    }

    if (!metrics) {
        return <div className="p-8">No cost data available.</div>;
    }

    const formatCurrency = (val: number) => `$${val.toFixed(4)}`;

    const chartData = metrics.byFeature.map(f => ({
        name: f.feature.replace('_', ' '),
        cost: f.costUSD
    }));

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Economics</h1>
                    <p className="text-muted-foreground mt-1">Real-time API token consumption and margin tracking.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 via-transparent border-indigo-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total API Cost</CardTitle>
                        <Coins className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-500">{formatCurrency(metrics.totalCostUSD)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Cumulative USD</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 via-transparent border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Intelligence Operations</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalCalls.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Successful AI inferences</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 via-transparent border-orange-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Highest Burn Feature</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold truncate">
                            {metrics.byFeature[0]?.feature || 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Current highest cost driver
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 via-transparent border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.byUser.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Generating API traffic</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost By Feature Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Cost by Operational Feature</CardTitle>
                        <CardDescription>Breakdown of AI costs across different platform capabilities.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        formatter={(value: any) => [`$${Number(value).toFixed(4)}`, "Cost"]}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#3b82f6'][index % 4]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Burning Users */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Tenant Burn Rate Monitor</CardTitle>
                        <CardDescription>Track API costs by specific user to monitor subscription margins.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {metrics.byUser.slice(0, 5).map((user, i) => (
                                <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs`}>
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-foreground">{user.userId}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Cpu className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">{user.modelsUsed.join(', ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-sm text-indigo-400">{formatCurrency(user.costUSD)}</div>
                                        <div className="text-xs text-muted-foreground">{user.calls} calls</div>
                                    </div>
                                </div>
                            ))}

                            {metrics.byUser.length === 0 && (
                                <div className="text-sm text-muted-foreground text-center py-8">
                                    No usage data logged yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Margin Alert (Mock logic for presentation) */}
            <Card className="bg-gradient-to-r from-red-500/10 to-transparent border-red-500/20">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                        <CardTitle className="text-red-500">Margin Alerts</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No tenants are currently exceeding their subscription profitability threshold. Profitability is modeled at &lt; 30% API cost of monthly subscription revenue.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
