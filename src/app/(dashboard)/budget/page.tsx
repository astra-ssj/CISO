"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target, ShieldCheck, Download } from 'lucide-react';

const BUDGET_DATA = [
    { name: 'Tools & Licensing', value: 450000, color: '#3b82f6' },
    { name: 'Staffing & Training', value: 800000, color: '#10b981' },
    { name: 'Managed Services', value: 250000, color: '#f59e0b' },
    { name: 'Audit & Compliance', value: 150000, color: '#8b5cf6' },
];

const ROI_DATA = [
    { quarter: 'Q1', spend: 200, risk: 80 },
    { quarter: 'Q2', spend: 350, risk: 65 },
    { quarter: 'Q3', spend: 450, risk: 40 },
    { quarter: 'Q4', spend: 600, risk: 25 },
];

export default function BudgetPage() {
    const totalBudget = BUDGET_DATA.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Strategy</h1>
                    <p className="text-muted-foreground">FY2026 Security Budget & ROI Analysis</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export Board Deck
                    </Button>
                    <Button>
                        <DollarSign className="mr-2 h-4 w-4" /> Request Increase
                    </Button>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Allocation</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(totalBudget / 1000000).toFixed(1)}M</div>
                        <p className="text-xs text-muted-foreground">+12% from FY2025</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cost per Incident</CardTitle>
                        <TrendingDown className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-$45k</div>
                        <p className="text-xs text-muted-foreground">Due to improved automated containment.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Risk Reduction ROI</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3.4x</div>
                        <p className="text-xs text-muted-foreground">For every $1 spent, $3.40 loss prevented.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Allocation by Domain</CardTitle>
                        <CardDescription>Where the money is going.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={BUDGET_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {BUDGET_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Spend vs. Risk Exposure</CardTitle>
                        <CardDescription>Correlating investment with risk reduction.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ROI_DATA}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="quarter" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#3b82f6" name="Spend ($k)" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="risk" stroke="#ef4444" name="Risk Exposure" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Strategy Text */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Strategic Alignment
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        The FY26 strategy prioritizes <span className="text-foreground font-semibold">automation over headcount</span>.
                        By increasing investment in SOAR tools (Blue line Q2-Q4), we project a drastic reduction in residual risk (Red line),
                        shifting the organization from a reactive to a predictive stance.
                    </p>
                    <div className="flex items-center gap-2 text-xs bg-secondary/20 p-2 rounded border border-secondary">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span>Board Approval Status: <span className="font-bold text-emerald-500">PRE-APPROVED</span></span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
