"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    FileText,
    Download,
    Calendar,
    Shield,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    Printer,
    Share2,
    Mail,
    Folder,
    BarChart3,
    PieChart,
    FileJson,
    Loader2,
    Eye,
    FileDown
} from "lucide-react";

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    sections: string[];
    icon: React.ReactNode;
    color: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
    {
        id: "executive",
        name: "Executive Summary",
        description: "High-level overview for board and C-suite",
        sections: ["Risk Score", "Key Metrics", "Top Issues", "Recommendations"],
        icon: <TrendingUp className="h-5 w-5" />,
        color: "bg-blue-500/10 text-blue-500"
    },
    {
        id: "compliance",
        name: "Compliance Report",
        description: "Framework compliance status and gaps",
        sections: ["ISO 27001", "SOC 2", "GDPR", "PCI DSS", "Gap Analysis"],
        icon: <Shield className="h-5 w-5" />,
        color: "bg-emerald-500/10 text-emerald-500"
    },
    {
        id: "incident",
        name: "Incident Report",
        description: "Detailed incident investigation and response",
        sections: ["Timeline", "Impact", "Root Cause", "Remediation", "Lessons Learned"],
        icon: <AlertTriangle className="h-5 w-5" />,
        color: "bg-red-500/10 text-red-500"
    },
    {
        id: "wargame",
        name: "Wargame Report",
        description: "AI wargame session results and recommendations",
        sections: ["Scenario", "Decisions Made", "Outcomes", "Training Gaps"],
        icon: <BarChart3 className="h-5 w-5" />,
        color: "bg-purple-500/10 text-purple-500"
    },
    {
        id: "risk",
        name: "Risk Assessment",
        description: "Comprehensive risk register and analysis",
        sections: ["Risk Matrix", "Top Risks", "Controls", "Treatment Plans"],
        icon: <PieChart className="h-5 w-5" />,
        color: "bg-amber-500/10 text-amber-500"
    }
];

const RECENT_REPORTS = [
    { id: 1, name: "Q4 2025 Executive Summary", date: "2026-01-15", type: "executive", status: "completed" },
    { id: 2, name: "ISO 27001 Audit Prep", date: "2026-01-10", type: "compliance", status: "completed" },
    { id: 3, name: "INC-2026-0142 Post-Mortem", date: "2026-01-08", type: "incident", status: "draft" },
    { id: 4, name: "Ransomware Wargame Results", date: "2026-01-05", type: "wargame", status: "completed" },
    { id: 5, name: "Annual Risk Assessment 2025", date: "2025-12-20", type: "risk", status: "completed" },
];

export default function ReportingPage() {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [dateRange, setDateRange] = useState("last30");
    const [selectedSections, setSelectedSections] = useState<string[]>([]);

    const handleGenerateReport = () => {
        setIsGenerating(true);
        // Simulate PDF generation
        setTimeout(() => {
            setIsGenerating(false);
            // In a real app, this would trigger a download
            alert("Report generated! In production, this would download a PDF.");
        }, 2000);
    };

    const toggleSection = (section: string) => {
        setSelectedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const currentTemplate = REPORT_TEMPLATES.find(t => t.id === selectedTemplate);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports & Export</h1>
                    <p className="text-muted-foreground mt-1">Generate compliance reports, executive summaries, and export data</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Reports
                    </Button>
                    <Button size="sm">
                        <FileDown className="h-4 w-4 mr-2" />
                        Export All Data
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="generate" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="generate" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Generate Report
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <Folder className="h-4 w-4" />
                        Report History
                    </TabsTrigger>
                    <TabsTrigger value="scheduled" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Scheduled
                    </TabsTrigger>
                </TabsList>

                {/* Generate Report Tab */}
                <TabsContent value="generate" className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Template Selection */}
                        <div className="md:col-span-2 space-y-4">
                            <h2 className="text-lg font-semibold">Select Report Template</h2>
                            <div className="grid md:grid-cols-2 gap-3">
                                {REPORT_TEMPLATES.map((template) => (
                                    <Card
                                        key={template.id}
                                        className={`cursor-pointer transition-all hover:shadow-md ${selectedTemplate === template.id
                                                ? 'ring-2 ring-primary border-primary'
                                                : 'border-border hover:border-primary/30'
                                            }`}
                                        onClick={() => {
                                            setSelectedTemplate(template.id);
                                            setSelectedSections(template.sections);
                                        }}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${template.color}`}>
                                                    {template.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-sm">{template.name}</h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {template.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {template.sections.slice(0, 3).map((section) => (
                                                            <Badge key={section} variant="secondary" className="text-[10px]">
                                                                {section}
                                                            </Badge>
                                                        ))}
                                                        {template.sections.length > 3 && (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                +{template.sections.length - 3}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                {selectedTemplate === template.id && (
                                                    <CheckCircle className="h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Configuration Panel */}
                        <Card className="border-primary/10 h-fit">
                            <CardHeader>
                                <CardTitle className="text-lg">Report Configuration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Date Range</Label>
                                    <Select value={dateRange} onValueChange={setDateRange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="last7">Last 7 days</SelectItem>
                                            <SelectItem value="last30">Last 30 days</SelectItem>
                                            <SelectItem value="last90">Last 90 days</SelectItem>
                                            <SelectItem value="ytd">Year to date</SelectItem>
                                            <SelectItem value="custom">Custom range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Report Name</Label>
                                    <Input placeholder="e.g., Q1 2026 Compliance Report" />
                                </div>

                                {currentTemplate && (
                                    <div className="space-y-2">
                                        <Label>Sections to Include</Label>
                                        <div className="space-y-2">
                                            {currentTemplate.sections.map((section) => (
                                                <label
                                                    key={section}
                                                    className="flex items-center gap-2 text-sm cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={selectedSections.includes(section)}
                                                        onCheckedChange={() => toggleSection(section)}
                                                    />
                                                    {section}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 space-y-2">
                                    <Button
                                        className="w-full"
                                        disabled={!selectedTemplate || isGenerating}
                                        onClick={handleGenerateReport}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4 mr-2" />
                                                Generate PDF
                                            </>
                                        )}
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1">
                                            <Eye className="h-4 w-4 mr-1" />
                                            Preview
                                        </Button>
                                        <Button variant="outline" size="sm" className="flex-1">
                                            <FileJson className="h-4 w-4 mr-1" />
                                            JSON
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Report History Tab */}
                <TabsContent value="history">
                    <Card className="border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Reports</CardTitle>
                            <CardDescription>View and download previously generated reports</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {RECENT_REPORTS.map((report) => {
                                    const template = REPORT_TEMPLATES.find(t => t.id === report.type);
                                    return (
                                        <div
                                            key={report.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${template?.color || 'bg-secondary'}`}>
                                                    {template?.icon || <FileText className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-sm">{report.name}</h4>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <Clock className="h-3 w-3" />
                                                        {report.date}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                                                    {report.status}
                                                </Badge>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Scheduled Reports Tab */}
                <TabsContent value="scheduled">
                    <Card className="border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-lg">Scheduled Reports</CardTitle>
                            <CardDescription>Configure automated report generation and delivery</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="p-4 rounded-full bg-secondary/30 mb-4">
                                    <Calendar className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold mb-1">No Scheduled Reports</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Set up automatic report generation and email delivery
                                </p>
                                <Button>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Schedule First Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
