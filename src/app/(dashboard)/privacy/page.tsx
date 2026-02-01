"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    Search, ShieldAlert, FileSearch, Eye, EyeOff, Upload, Lock,
    Download, PieChart as PieChartIcon, Filter, Database,
    Map as MapIcon, Users, Globe, ArrowRight, CheckCircle, Clock,
    AlertCircle, Activity, Server, FileText, Trash2, Siren,
    Timer, FileWarning, Bot, Check, Zap
} from "lucide-react";
import { scanContent, ScanResult } from "@/lib/pii-scanner";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

// --- Mock Data ---

const MOCK_DATA = `
Subject: Project Alpha Credentials & Status

Hi Team,

Please review the logs attached.
The critical API Key for the production gateway is sk_live_5BfT7s9dJkA2xL4n8vR6qW3z.
Don't share this.

User details detected in the dump:
- John Doe (SSN: 123-45-6789) - Account ID: 550e8400-e29b-41d4-a716-446655440000
- Jane Smith (Passport: 987654321) - Traveling to EU next week.

Payment info for the vendor:
Card: 4532-1234-5678-9012 (VISA)
IBAN: DE89 3704 0044 0532 0130 00

Contact admin@company.com if you detect any issues.
Server IP: 192.168.1.105

Regards,
Admin
`;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

// --- Components ---

// 1. PII Scanner Component (Original Functionality Refactored)
function PIIScanner() {
    const [inputText, setInputText] = useState("");
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [filterSensitivity, setFilterSensitivity] = useState<string>("ALL");

    const handleLoadMock = () => {
        setInputText(MOCK_DATA.trim());
    };

    const handleExportPDF = () => {
        if (!scanResult) return;
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Data Privacy Scan Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Risk Score: ${scanResult.riskScore}/100`, 14, 36);
        doc.text(`Total PII Detected: ${scanResult.totalPII}`, 14, 42);
        const tableData = scanResult.matches.map(m => [m.type, m.value, m.sensitivity, m.gdprArticle || 'N/A']);
        autoTable(doc, {
            head: [['Type', 'Value', 'Sensitivity', 'GDPR Context']],
            body: tableData,
            startY: 50,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] }
        });
        doc.save(`privacy-scan-report-${Date.now()}.pdf`);
    };

    const handleScan = () => {
        if (!inputText) return;
        const result = scanContent(inputText);
        setScanResult(result);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setInputText(e.target?.result as string);
            reader.readAsText(file);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-1 h-fit border-primary/20 bg-card/50">
                <CardHeader>
                    <CardTitle>Data Source</CardTitle>
                    <CardDescription>Paste text or upload a document to scan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative group">
                        <input type="file" id="pii-upload" className="hidden" accept=".txt,.md,.json,.csv" onChange={handleFileUpload} />
                        <div onClick={() => document.getElementById('pii-upload')?.click()} className="border-2 border-dashed border-border/50 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-primary/5 transition-colors cursor-pointer">
                            <Upload className="h-8 w-8 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium">Drop file or click to upload</span>
                            <span className="text-xs text-muted-foreground mt-1">Local processing only.</span>
                        </div>
                    </div>
                    <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or Paste Text</span></div></div>
                    <Textarea placeholder="Paste raw data here..." className="min-h-[250px] font-mono text-xs bg-secondary/20 resize-none focus-visible:ring-primary" value={inputText} onChange={(e) => setInputText(e.target.value)} />
                    <div className="flex gap-2">
                        <Button onClick={handleScan} disabled={!inputText} className="flex-1 bg-primary hover:bg-primary/90 shadow-md"><Search className="mr-2 h-4 w-4" /> Scan for PII</Button>
                        <Button variant="outline" onClick={handleLoadMock}><Database className="h-4 w-4" /></Button>
                    </div>
                </CardContent>
            </Card>

            <div className="md:col-span-1 space-y-6">
                {!scanResult ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 custom-dashed-border rounded-xl bg-secondary/10 text-muted-foreground">
                        <FileSearch className="h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold mb-2">Awaiting Data</h3>
                        <p className="text-center max-w-xs text-sm">Upload content to identify GDPR risks.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-primary/20">
                            <div className={`h-1.5 w-full ${scanResult.riskScore > 75 ? 'bg-red-500' : scanResult.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <CardHeader className="pb-2 flex flex-row items-baseline justify-between">
                                <CardTitle>Privacy Risk Score</CardTitle>
                                <span className="text-2xl font-bold font-mono">{scanResult.riskScore}/100</span>
                            </CardHeader>
                            <CardContent className="flex gap-4">
                                {scanResult.sensitiveCount > 0 && (
                                    <Alert className="bg-red-500/10 text-red-600 border-red-200 dark:border-900">
                                        <ShieldAlert className="h-4 w-4" />
                                        <AlertTitle>Sensitive Data Detected</AlertTitle>
                                        <AlertDescription className="text-xs">Contains PII requiring special handling (GDPR Art. 9).</AlertDescription>
                                    </Alert>
                                )}
                                <Button variant="outline" size="sm" onClick={handleExportPDF} className="ml-auto"><Download className="mr-2 h-4 w-4" /> PDF</Button>
                            </CardContent>
                        </Card>

                        <Tabs defaultValue="inventory" className="w-full">
                            <TabsList className="w-full">
                                <TabsTrigger value="inventory" className="flex-1">Inventory</TabsTrigger>
                                <TabsTrigger value="redacted" className="flex-1">Redaction</TabsTrigger>
                            </TabsList>
                            <TabsContent value="inventory" className="mt-4">
                                <ScrollArea className="h-[400px] rounded-md border bg-card p-4">
                                    <div className="space-y-2">
                                        {scanResult.matches.map((m, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 rounded bg-secondary/30 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{m.type}</Badge>
                                                    <span className="font-mono truncate max-w-[150px]">{m.value}</span>
                                                </div>
                                                <Badge className={m.sensitivity === 'HIGH' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}>{m.sensitivity}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="redacted" className="mt-4">
                                <Textarea readOnly value={scanResult.redactedText} className="min-h-[400px] font-mono text-xs bg-secondary/30 resize-none text-muted-foreground" />
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        </div>
    );
}

// 2. RoPA Data Mapper
function RoPAMapper() {
    // Defines a simple flow: Source -> Data -> Processor -> Destination
    const flows = [
        { id: 1, source: "HR Portal", data: "Employee SSN", processor: "Workday (US)", risk: "HIGH", transfer: true },
        { id: 2, source: "Checkout", data: "Credit Card", processor: "Stripe (EU)", risk: "LOW", transfer: false },
        { id: 3, source: "Marketing Form", data: "Email Address", processor: "HubSpot (US)", risk: "MEDIUM", transfer: true },
        { id: 4, source: "App Logs", data: "IP Address", processor: "AWS S3 (US-East)", risk: "MEDIUM", transfer: true },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            <Card className="lg:col-span-2 bg-slate-950 border-primary/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapIcon className="h-5 w-5 text-purple-400" /> Data Flow Map (RoPA)
                    </CardTitle>
                    <CardDescription>Visualizing cross-border data transfers and processing activities.</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 p-8">
                    <div className="space-y-8">
                        {flows.map((flow) => (
                            <div key={flow.id} className="flex items-center justify-between group">
                                {/* Source Node */}
                                <div className="flex flex-col items-center">
                                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-sm w-32 text-center group-hover:border-primary/50 transition-colors">
                                        <Server className="h-5 w-5 mx-auto mb-2 text-blue-400" />
                                        <span className="text-xs font-bold">{flow.source}</span>
                                    </div>
                                </div>

                                {/* Flow Edge */}
                                <div className="flex-1 px-4 relative flex items-center justify-center">
                                    <div className={`h-1 w-full rounded relative ${flow.transfer ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                                        {/* Animated particle */}
                                        <motion.div
                                            className={`absolute top-0 bottom-0 w-8 rounded ${flow.transfer ? 'bg-red-500/50' : 'bg-emerald-500/50'}`}
                                            animate={{ x: [-20, 150] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                        />
                                    </div>
                                    <div className="absolute -top-6 bg-slate-900 text-[10px] px-2 py-1 rounded border border-slate-800">
                                        {flow.data}
                                    </div>
                                    {flow.transfer && (
                                        <div className="absolute -bottom-6 flex items-center gap-1 text-red-500 text-[10px]">
                                            <Globe className="h-3 w-3" /> Cross-Border
                                        </div>
                                    )}
                                </div>

                                {/* Processor Node */}
                                <div className="flex flex-col items-center">
                                    <div className={`bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-sm w-32 text-center relative ${flow.risk === 'HIGH' ? 'border-red-500/50' : ''}`}>
                                        {flow.risk === 'HIGH' && <span className="absolute -top-2 -right-2 h-3 w-3 bg-red-500 rounded-full animate-pulse" />}
                                        <Database className="h-5 w-5 mx-auto mb-2 text-purple-400" />
                                        <span className="text-xs font-bold">{flow.processor}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/10">
                <CardHeader>
                    <CardTitle>Transfer Risks</CardTitle>
                    <CardDescription>GDPR Article 44-50 Analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-sm text-red-500">SCHREMS II Alert</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Transfer to <strong>US-East</strong> detected without SCCs.
                                </p>
                                <Button size="sm" variant="destructive" className="mt-2 h-7 text-xs w-full">Remediate</Button>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center p-2 rounded bg-secondary/50">
                            <span>Safe Jurisdictions</span>
                            <span className="font-mono font-bold text-emerald-500">12</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded bg-secondary/50">
                            <span>High Risk Jurisdictions</span>
                            <span className="font-mono font-bold text-red-500">2</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// 3. DSAR Manager
function DSARManager() {
    const requests = [
        { id: "DSAR-2491", user: "alice@example.com", type: "Deletion", status: "New", due: "29 days" },
        { id: "DSAR-2488", user: "bob@test.co.uk", type: "Access", status: "In Progress", due: "15 days" },
        { id: "DSAR-2450", user: "charlie@gmail.com", type: "Rectification", status: "Completed", due: "Closed" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Subject Access Requests</h3>
                <Button><Users className="mr-2 h-4 w-4" /> Log New Request</Button>
            </div>

            <div className="grid gap-4">
                {requests.map((req) => (
                    <Card key={req.id} className="hover:border-primary/30 transition-all">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${req.status === 'New' ? 'bg-blue-500/20 text-blue-500' : req.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{req.id} <span className="text-muted-foreground font-normal mx-2">•</span> {req.user}</h4>
                                    <p className="text-xs text-muted-foreground">Request Type: <strong>{req.type}</strong></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground">Deadline</div>
                                    <div className={`font-mono font-bold text-sm ${req.due.includes('Closed') ? 'text-muted-foreground' : 'text-red-400'}`}>{req.due}</div>
                                </div>
                                <Button variant="outline" size="sm">Manage</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// 4. Breach Protocol Simulator
function BreachSimulator() {
    const [status, setStatus] = useState<"IDLE" | "ACTIVE" | "CONTAINED" | "REPORTED">("IDLE");
    const [timeLeft, setTimeLeft] = useState(72 * 60 * 60); // 72 hours in seconds
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (status === "ACTIVE" && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 3600); // Speed up time for demo (1 sec = 1 hour)
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [status, timeLeft]);

    const startBreach = () => {
        setStatus("ACTIVE");
        setLogs(prev => [...prev, "[ALERT] Data leak detected in S3 Bucket 'customer-backups-2025'", "[INFO] 72-Hour GDPR Notification Timer Started"]);
    };

    const handleAction = (action: string) => {
        setLogs(prev => [...prev, `[ACTION] ${action}`]);
        if (action.includes("DPA")) setStatus("REPORTED");
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
            <Card className="md:col-span-2 flex flex-col border-red-500/20 relative overflow-hidden">
                {status === "ACTIVE" && <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />}
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Siren className={`h-6 w-6 ${status === "ACTIVE" ? "text-red-500 animate-bounce" : "text-muted-foreground"}`} />
                        Breach Protocol Simulator
                    </CardTitle>
                    <CardDescription>Training Mode: Manage a simulated GDPR data breach.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                    {status === "IDLE" ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <FileWarning className="h-24 w-24 text-muted-foreground/20" />
                            <Button size="lg" onClick={startBreach} className="bg-red-600 hover:bg-red-700">Simulate Breach Incident</Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="bg-secondary/30 border-red-500/30 p-4 flex flex-col items-center justify-center">
                                    <div className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Time to Notify</div>
                                    <div className="text-4xl font-mono font-bold text-red-500 flex items-center gap-2">
                                        <Timer className="h-8 w-8" /> {formatTime(timeLeft)}
                                    </div>
                                </Card>
                                <Card className="bg-secondary/30 p-4">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Eye className="h-4 w-4" /> Evidence Locker</h4>
                                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                                        <li>1.2GB SQL Dump found on pastebin</li>
                                        <li>Contains 5,000 EU Customer Records</li>
                                        <li>Passwords are hashed (bcrypt)</li>
                                    </ul>
                                </Card>
                            </div>

                            <div className="bg-black/40 rounded-lg p-4 font-mono text-xs h-32 overflow-y-auto border border-white/5">
                                {logs.map((log, i) => (
                                    <div key={i} className={log.includes("[ALERT]") ? "text-red-400" : "text-green-400"}>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
                {status === "ACTIVE" && (
                    <CardFooter className="gap-2 bg-secondary/20 p-4">
                        <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => handleAction("Notified DPA (ICO)")}>
                            Notify DPA
                        </Button>
                        <Button className="flex-1" variant="outline" onClick={() => handleAction("Logged internally (Risk Assessed Low)")}>
                            Log Internal Only
                        </Button>
                    </CardFooter>
                )}
            </Card>

            <Card className="md:col-span-1 border-primary/10">
                <CardHeader>
                    <CardTitle>Playbook</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Step 1: Triage</h4>
                        <p className="text-xs text-muted-foreground">Determine nature and scope. Is PII involved? Is it encrypted?</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Step 2: Risk Assessment</h4>
                        <p className="text-xs text-muted-foreground">Likelihood of harm to individuals? If HIGH &rarr; Notify.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// 5. AI Vendor Risk Radar
function VendorRadar() {
    const data = [
        { subject: 'Security', A: 120, B: 110, fullMark: 150 },
        { subject: 'Privacy', A: 98, B: 130, fullMark: 150 },
        { subject: 'Legal', A: 86, B: 130, fullMark: 150 },
        { subject: 'Financial', A: 99, B: 100, fullMark: 150 },
        { subject: 'Reputation', A: 85, B: 90, fullMark: 150 },
        { subject: 'Geo-Risk', A: 65, B: 85, fullMark: 150 },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-full border-primary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-emerald-500" /> Vendor Risk Radar</CardTitle>
                    <CardDescription>Comparing AWS (A) vs. Azure (B) risk profiles.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="transparent" />
                            <Radar name="Vendor A" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            <Radar name="Vendor B" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                            <Legend />
                            <RechartsTooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="h-full border-primary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-indigo-500" /> Contract AI Analyzer</CardTitle>
                    <CardDescription>Automated DPA review engine.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-secondary/30 p-4 rounded-lg font-mono text-xs text-muted-foreground relative">
                        <div className="absolute top-2 right-2 flex gap-1"><Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500">Toxic Clause</Badge></div>
                        <p className="mb-2">...Vendor shall not be liable for any indirect, special, or consequential damages...</p>
                        <p className="bg-red-500/10 text-red-400 p-1 rounded">...total liability shall be limited to $500.00...</p>
                        <p className="mt-2 text-indigo-400 flex items-center gap-1"><Zap className="h-3 w-3" /> AI Recommendation: Negotiate cap to 3x Annual Contract Value.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700"><Check className="mr-2 h-4 w-4" /> Approve with Conditions</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function PrivacyPage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Lock className="h-8 w-8 text-primary" />
                    Privacy Operations Center
                </h1>
                <p className="text-muted-foreground text-lg">
                    Unified command for GDPR/CCPA compliance, data mapping, and PII scanning.
                </p>
            </div>

            <Tabs defaultValue="scanner" className="space-y-6">
                <div className="overflow-x-auto pb-2">
                    <TabsList className="bg-secondary/50 p-1 rounded-lg inline-flex w-full md:w-auto">
                        <TabsTrigger value="scanner" className="gap-2 min-w-[120px]"><Search className="h-4 w-4" /> PII Scanner</TabsTrigger>
                        <TabsTrigger value="ropa" className="gap-2 min-w-[120px]"><MapIcon className="h-4 w-4" /> Data Map</TabsTrigger>
                        <TabsTrigger value="dsar" className="gap-2 min-w-[120px]"><Users className="h-4 w-4" /> DSAR Manager</TabsTrigger>
                        <TabsTrigger value="breach" className="gap-2 min-w-[120px]"><Siren className="h-4 w-4" /> Breach Sim</TabsTrigger>
                        <TabsTrigger value="vendor" className="gap-2 min-w-[120px]"><Activity className="h-4 w-4" /> Vendor Risk</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="scanner" className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <PIIScanner />
                </TabsContent>

                <TabsContent value="ropa" className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <RoPAMapper />
                </TabsContent>

                <TabsContent value="dsar" className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <DSARManager />
                </TabsContent>

                <TabsContent value="breach" className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <BreachSimulator />
                </TabsContent>

                <TabsContent value="vendor" className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <VendorRadar />
                </TabsContent>
            </Tabs>
        </div>
    );
}
