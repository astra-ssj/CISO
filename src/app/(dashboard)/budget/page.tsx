"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target, ShieldCheck, Download, AlertTriangle, MessageSquare, Zap } from 'lucide-react';

// Granular Line Items Data
interface BudgetItem {
    id: string;
    name: string;
    category: 'Tools' | 'Staff' | 'Service' | 'Audit';
    cost: number;
    roi: number; // 1-10
    utilization: number; // 0-100%
    owner: string;
}

const INITIAL_ITEMS: BudgetItem[] = [
    { id: '1', name: 'CrowdStrike Falcon', category: 'Tools', cost: 180000, roi: 9.5, utilization: 95, owner: 'SecOps' },
    { id: '2', name: 'Splunk Enterprise', category: 'Tools', cost: 250000, roi: 6.0, utilization: 40, owner: 'Infra' },
    { id: '3', name: 'Snyk AppSec', category: 'Tools', cost: 120000, roi: 8.5, utilization: 80, owner: 'AppSec' },
    { id: '4', name: 'PenTest Services', category: 'Service', cost: 50000, roi: 7.0, utilization: 100, owner: 'GRC' },
    { id: '5', name: 'Security Awareness', category: 'Service', cost: 25000, roi: 4.0, utilization: 30, owner: 'HR' },
    { id: '6', name: 'SOC Analysts (3 FTE)', category: 'Staff', cost: 450000, roi: 9.0, utilization: 100, owner: 'CISO' },
    { id: '7', name: 'Legacy Firewall Maintain', category: 'Service', cost: 80000, roi: 2.0, utilization: 10, owner: 'NetOps' },
    { id: '8', name: 'Compliance Audit', category: 'Audit', cost: 60000, roi: 5.0, utilization: 100, owner: 'GRC' },
];

export default function BudgetPage() {
    const [items, setItems] = useState<BudgetItem[]>(INITIAL_ITEMS);
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [requestData, setRequestData] = useState({ amount: '', reason: '', impact: '' });

    // Derived Metrics
    const totalBudget = items.reduce((sum, item) => sum + item.cost, 0);
    const averageROI = items.reduce((sum, item) => sum + item.roi, 0) / items.length;

    // Identify "Money Pits" (Cost > 75k AND ROI < 6)
    const moneyPits = items.filter(i => i.cost > 75000 && i.roi < 6);

    // Identify "Underutilized" (Utilization < 50%)
    const underutilized = items.filter(i => i.utilization < 50);

    // Scatter Plot Data
    const scatterData = items.map(item => ({
        x: item.cost,
        y: item.roi,
        z: item.utilization, // Bubble size based on usage or static
        name: item.name,
        category: item.category,
        isMoneyPit: (item.cost > 75000 && item.roi < 6)
    }));

    const handleRequestSubmit = () => {
        alert(`Budget Request Submitted for $${parseInt(requestData.amount).toLocaleString()}!\nReason: ${requestData.reason}`);
        setIsRequestOpen(false);
        setRequestData({ amount: '', reason: '', impact: '' });
    };

    const exportToPDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("CISO Strategic Portfolio Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableBody = items.map(i => [
            i.name, i.category, `$${i.cost.toLocaleString()}`, i.roi.toFixed(1), `${i.utilization}%`
        ]);

        (doc as any).autoTable({
            startY: 40,
            head: [['Item', 'Category', 'Cost', 'ROI', 'Utilization']],
            body: tableBody,
        });
        doc.save("Security_Portfolio.pdf");
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Portfolio & Budget</h1>
                    <p className="text-muted-foreground">Strategic analysis of security investments and ROI.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToPDF}>
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                    <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <DollarSign className="mr-2 h-4 w-4" /> Request Increase
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Budget Request</DialogTitle>
                                <DialogDescription>Submit a strategic justification for additional funding.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Requested Amount ($)</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 50000"
                                        value={requestData.amount}
                                        onChange={e => setRequestData({ ...requestData, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Strategic Justification</Label>
                                    <Textarea
                                        placeholder="Why do we need this? Link to business goals."
                                        value={requestData.reason}
                                        onChange={e => setRequestData({ ...requestData, reason: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Risk of Denial</Label>
                                    <Textarea
                                        placeholder="What happens if we say no?"
                                        value={requestData.impact}
                                        onChange={e => setRequestData({ ...requestData, impact: e.target.value })}
                                        className="border-red-500/20 focus:border-red-500"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsRequestOpen(false)}>Cancel</Button>
                                <Button onClick={handleRequestSubmit}>Submit Request</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Annual Run Rate</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">${(totalBudget / 1000000).toFixed(2)}M</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Portfolio ROI</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageROI.toFixed(1)}/10</div>
                        <p className="text-xs text-muted-foreground">Subjective value score</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Inefficient Spend</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            ${moneyPits.reduce((acc, i) => acc + i.cost, 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">{moneyPits.length} items flagged as "Money Pits"</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Underutilized Assets</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">{underutilized.length}</div>
                        <p className="text-xs text-muted-foreground">Items with {"<"}50% utilization</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Scatter Plot */}
                <Card className="lg:col-span-2 min-h-[500px]">
                    <CardHeader>
                        <CardTitle>Value Analysis Matrix</CardTitle>
                        <CardDescription>Visualizing Cost vs. ROI. <span className="text-red-500 font-bold">Red</span> items are expensive but low value (Target for cuts).</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis type="number" dataKey="x" name="Cost" unit="$" tickFormatter={(val) => `$${val / 1000}k`} />
                                <YAxis type="number" dataKey="y" name="ROI" domain={[0, 10]} />
                                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Utilization" unit="%" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-popover border text-popover-foreground p-2 rounded shadow-lg text-sm">
                                                <div className="font-bold">{data.name}</div>
                                                <div>Cost: ${data.x.toLocaleString()}</div>
                                                <div>ROI: {data.y}/10</div>
                                                <div>Utilization: {data.z}%</div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                {/* Quadrant Lines */}
                                <ReferenceLine x={100000} stroke="orange" strokeDasharray="3 3" label="High Cost Threshold" />
                                <ReferenceLine y={5} stroke="gray" strokeDasharray="3 3" label="Min. ROI" />

                                <Scatter name="Assets" data={scatterData}>
                                    {scatterData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.isMoneyPit ? '#ef4444' : entry.y > 8 ? '#10b981' : '#3b82f6'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* The Inquisitor (Team Challenges) */}
                <Card className="bg-secondary/10 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            The Inquisitor
                        </CardTitle>
                        <CardDescription>Automated challenges for your team based on efficiency gaps.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {underutilized.map(item => (
                            <div key={item.id} className="p-4 bg-background border rounded-lg shadow-sm">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                                    <div>
                                        <div className="text-sm font-bold text-foreground mb-1">Utilization Alert: {item.name}</div>
                                        <p className="text-xs text-muted-foreground italic mb-2">
                                            "We are paying ${item.cost.toLocaleString()} for {item.name}, but utilization is only {item.utilization}%. Why?"
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Assign to {item.owner}</Badge>
                                            <Badge variant="destructive" className="cursor-pointer">Terminate</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {moneyPits.map(item => (
                            <div key={item.id} className="p-4 bg-background border border-red-200 dark:border-red-900/50 rounded-lg shadow-sm">
                                <div className="flex items-start gap-3">
                                    <Zap className="h-5 w-5 text-red-500 mt-1" />
                                    <div>
                                        <div className="text-sm font-bold text-foreground mb-1">ROI Alert: {item.name}</div>
                                        <p className="text-xs text-muted-foreground italic mb-2">
                                            "{item.name} is consuming huge budget (${item.cost.toLocaleString()}) but delivering low value (ROI {item.roi}). Can we replace it?"
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Audit Vendor</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {underutilized.length === 0 && moneyPits.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
                                <p>No inefficiencies detected. Great job!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Asset Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Budget Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Owner</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Utilization</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ROI (1-10)</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Cost</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {items.map((item) => (
                                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{item.name}</td>
                                        <td className="p-4 align-middle"><Badge variant="secondary">{item.category}</Badge></td>
                                        <td className="p-4 align-middle">{item.owner}</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.utilization < 50 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${item.utilization}%` }} />
                                                </div>
                                                <span className="text-xs text-muted-foreground">{item.utilization}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className={`${item.roi < 5 ? 'text-red-500 font-bold' : item.roi > 8 ? 'text-emerald-500 font-bold' : ''}`}>
                                                {item.roi}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-right font-mono">${item.cost.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
