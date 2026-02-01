"use client";

import { usePolicyStore } from "@/lib/policy-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, Legend } from "recharts";
import { AlertTriangle, CheckCircle2, User } from "lucide-react";

export function AcknowledgmentTracker() {
    const { policies } = usePolicyStore();

    const activePolicies = policies.filter(p => p.acknowledgment && p.status === 'ACTIVE');

    const barData = activePolicies.map(p => ({
        name: p.title.substring(0, 15) + '...',
        signed: p.acknowledgment.signedUsers,
        pending: p.acknowledgment.totalUsers - p.acknowledgment.signedUsers,
        total: p.acknowledgment.totalUsers,
        rate: Math.round((p.acknowledgment.signedUsers / p.acknowledgment.totalUsers) * 100)
    }));

    // Overall stats
    const totalAssignments = activePolicies.reduce((acc, p) => acc + p.acknowledgment.totalUsers, 0);
    const totalSignatures = activePolicies.reduce((acc, p) => acc + p.acknowledgment.signedUsers, 0);
    const overallRate = Math.round((totalSignatures / totalAssignments) * 100);

    const pieData = [
        { name: 'Signed', value: totalSignatures, color: '#10b981' },
        { name: 'Pending', value: totalAssignments - totalSignatures, color: '#f59e0b' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* KPI Cards */}
            <div className="md:col-span-3 grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{overallRate}%</div>
                            <div className="text-xs text-muted-foreground">Organization Compliance Rate</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <AlertTriangle />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{totalAssignments - totalSignatures}</div>
                            <div className="text-xs text-muted-foreground">Pending Signatures</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <User />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{activePolicies.length}</div>
                            <div className="text-xs text-muted-foreground">Active Campaigns</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Acknowledgment by Policy</CardTitle>
                    <CardDescription>Completion rates across active policy campaigns.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="signed" name="Signed" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Overall Compliance</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
