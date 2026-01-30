"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Calendar, Loader2, CheckCircle2, LayoutTemplate } from "lucide-react";
import { generateExecutiveReport } from "@/lib/export-utils";
import { useAstraStore } from "@/lib/store";

interface ReportArchive {
    id: string;
    title: string;
    date: string;
    type: string;
    status: 'Ready' | 'Generating';
}

export default function ReportingPage() {
    const { complianceScore, activeThreats } = useAstraStore();
    const [isGenerating, setIsGenerating] = useState(false);

    // Mock Archive
    const [archive, setArchive] = useState<ReportArchive[]>([
        { id: 'rep-001', title: 'Monthly Security Summary', date: '2025-10-01', type: 'Executive PDF', status: 'Ready' },
        { id: 'rep-002', title: 'Q3 Compliance Audit', date: '2025-09-15', type: 'Audit Log', status: 'Ready' },
        { id: 'rep-003', title: 'Incident Post-Mortem: ID-442', date: '2025-08-22', type: 'Incident Report', status: 'Ready' },
    ]);

    const handleGenerate = () => {
        setIsGenerating(true);
        // Simulate generation delay
        setTimeout(() => {
            generateExecutiveReport({
                date: new Date().toLocaleString(),
                complianceScore: complianceScore,
                activeRisks: 3,
                openIncidents: activeThreats,
                vendorRiskScore: 68,
                topRisks: [
                    { title: "Supply Chain Attack via NPM", severity: "Critical" },
                    { title: "Legacy VPN Vulnerabilities", severity: "High" },
                    { title: "Shadow AI Usage", severity: "High" }
                ]
            });

            setArchive(prev => [{
                id: `rep-${Date.now()}`,
                title: 'On-Demand Executive Snapshot',
                date: new Date().toLocaleDateString(),
                type: 'Executive PDF',
                status: 'Ready'
            }, ...prev]);

            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Executive Reporting Hub</h1>
                <p className="text-muted-foreground">Generate, schedule, and archive governance reports for board and stakeholder review.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">

                {/* Generator Panel */}
                <Card className="md:col-span-2 border-primary/20 bg-card/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LayoutTemplate className="h-5 w-5 text-primary" />
                            Report Generator
                        </CardTitle>
                        <CardDescription>Create a new snapshot based on current system state.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 border rounded-lg bg-background/50 cursor-pointer hover:border-primary/50 transition-colors border-primary ring-1 ring-primary/20">
                            <div className="flex justify-between items-start mb-2">
                                <Badge>Recommended</Badge>
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-1">Board Executive Summary</h3>
                            <p className="text-xs text-muted-foreground mb-4">High-level KPIs, critical risks, and compliance posture overview.</p>
                            <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                {isGenerating ? "Compiling Data..." : "Generate PDF"}
                            </Button>
                        </div>

                        <div className="p-4 border rounded-lg bg-background/50 cursor-pointer hover:border-primary/50 transition-colors opacity-60">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline">Enterprise</Badge>
                            </div>
                            <h3 className="font-semibold mb-1">Full VRM Assessment</h3>
                            <p className="text-xs text-muted-foreground mb-4">Detailed breakdown of all third-party vendor risks and assessments.</p>
                            <Button variant="outline" className="w-full" disabled>Coming Soon</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Archive Panel */}
                <Card className="border-primary/10 h-full">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Report Archive
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {archive.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-secondary rounded text-primary">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-medium leading-none group-hover:text-primary transition-colors cursor-pointer">{doc.title}</div>
                                            <div className="text-xs text-muted-foreground">{doc.date} • {doc.type}</div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Download className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="link" className="w-full text-xs text-muted-foreground">View all history</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
