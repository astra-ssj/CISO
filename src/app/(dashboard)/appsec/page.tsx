"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { scanCode, scanDependencies, SASTFinding } from "@/lib/sast-engine";
import {
    Bug,
    FileCode,
    Play,
    ShieldAlert,
    CheckCircle,
    Network,
    ChevronRight,
    Search,
    Lock,
    GitCommit,
    GitBranch,
    AlertCircle,
    Activity,
    Terminal,
    Box
} from "lucide-react";

// Mock Pipeline Data
const PIPELINE_DATA = [
    { id: '1024', branch: 'main', status: 'failed', stage: 'sast', blocker: 'CRITICAL Vuln Found', time: '10m ago' },
    { id: '1023', branch: 'feat/auth', status: 'success', stage: 'deploy', blocker: null, time: '1h ago' },
    { id: '1022', branch: 'fix/login', status: 'success', stage: 'deploy', blocker: null, time: '2h ago' },
    { id: '1021', branch: 'dev', status: 'failed', stage: 'container-scan', blocker: 'High CVE-2024-XYZ', time: '4h ago' },
];

import { useAppSecStore } from "@/lib/appsec-store";

// ... existing imports

export default function AppSecPage() {
    const [code, setCode] = useState("");
    const [packageJson, setPackageJson] = useState('{\n  "dependencies": {\n    "react": "^18.0.0",\n    "react-scripts": "4.0.3",\n    "axios": "0.19.0"\n  }\n}');

    // Replace local state with Global Store
    const { findings, setFindings } = useAppSecStore();

    const [isScanning, setIsScanning] = useState(false);
    // Determine hasScanned based on store content persistence
    const hasScanned = findings.length > 0;

    const [activeTab, setActiveTab] = useState("sast");

    const handleScan = () => {
        setIsScanning(true);
        // Simulate processing delay
        setTimeout(() => {
            let results: SASTFinding[] = [];

            if (activeTab === 'sast') {
                results = scanCode(code);
            } else if (activeTab === 'sca') {
                results = scanDependencies(packageJson);
            } else if (activeTab === 'secrets') {
                // Determine if we scan code or a specific secret input? 
                // For simplicity, reusing code input for secrets as users might paste configs there
                results = scanCode(code).filter(f => f.type === 'SECRET');
            }

            // Update Global Store
            setFindings(results);
            setIsScanning(false);
        }, 800);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                if (file.name === 'package.json') {
                    setPackageJson(text);
                    setActiveTab('sca');
                } else {
                    setCode(text);
                    setActiveTab('sast'); // Default back to SAST for generic files
                }
            };
            reader.readAsText(file);
        }
    };

    const severityCounts = {
        CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
        HIGH: findings.filter(f => f.severity === 'HIGH').length,
        MEDIUM: findings.filter(f => f.severity === 'MEDIUM').length,
        LOW: findings.filter(f => f.severity === 'LOW').length
    };

    return (
        <div className="space-y-6 h-full flex flex-col max-w-[1600px] mx-auto pb-8">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <ShieldAlert className="h-8 w-8 text-primary" />
                    Application Security
                </h1>
                <p className="text-muted-foreground">Comprehensive vulnerability management, dependency scanning, and pipeline security.</p>
            </div>

            {/* Top Row: KPIs and Pipeline Widget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Pipeline Security Widget */}
                <Card className="md:col-span-2 border-primary/20 bg-gradient-to-r from-card to-secondary/5">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GitBranch className="h-5 w-5 text-primary" />
                                Pipeline Security Gates
                            </CardTitle>
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
                                <Activity className="h-3 w-3 mr-1" />
                                98.2% Uptime
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-3">
                            {PIPELINE_DATA.map((build) => (
                                <div key={build.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-secondary/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-2 h-2 rounded-full
                                            ${build.status === 'success' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}
                                        `} />
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs font-bold">#{build.id} <span className="text-muted-foreground font-normal">on</span> {build.branch}</span>
                                            <span className="text-[10px] text-muted-foreground">{build.time}</span>
                                        </div>
                                    </div>

                                    {/* Stages Visual */}
                                    <div className="hidden sm:flex items-center gap-1">
                                        {['lint', 'sast', 'sca', 'deploy'].map((s, i) => (
                                            <div key={s} className="flex items-center">
                                                <div className={`
                                                    h-1.5 w-8 rounded-full
                                                    ${build.status === 'failed' && build.stage === s ? 'bg-red-500' :
                                                        build.status === 'success' || i < ['lint', 'sast', 'sca', 'deploy'].indexOf(build.stage) ? 'bg-emerald-500' : 'bg-secondary'}
                                                `} title={s} />
                                                {i < 3 && <div className="w-1 h-[1px] bg-border mx-0.5" />}
                                            </div>
                                        ))}
                                    </div>

                                    {build.status === 'failed' ? (
                                        <Badge variant="destructive" className="text-[10px] h-6">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            {build.blocker}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] h-6 border-emerald-500/30 text-emerald-500">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Passed
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions / Stats */}
                <Card className="flex flex-col border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-lg">Security Posture</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center gap-4">
                        <div className="text-center p-4 bg-secondary/10 rounded-lg border border-dashed border-secondary">
                            <div className="text-3xl font-bold mb-1">A+</div>
                            <div className="text-xs text-muted-foreground">Overall Rating</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-xl font-bold text-emerald-500">0</div>
                                <div className="text-[10px] text-muted-foreground">Open Criticals</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold">24h</div>
                                <div className="text-[10px] text-muted-foreground">Mean Time to Fix</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Scanner Interface */}
            <div className="grid grid-cols-12 gap-6 flex-1 h-[600px] min-h-0">
                {/* Input Column */}
                <div className="col-span-12 lg:col-span-6 flex flex-col h-full gap-4">
                    <Card className="flex-1 flex flex-col border-primary/10 overflow-hidden">
                        <CardHeader className="py-2 border-b bg-secondary/5">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="sast" className="flex items-center gap-2">
                                        <FileCode className="h-4 w-4" /> SAST
                                    </TabsTrigger>
                                    <TabsTrigger value="sca" className="flex items-center gap-2">
                                        <Box className="h-4 w-4" /> Dependencies
                                    </TabsTrigger>
                                    <TabsTrigger value="secrets" className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" /> Secrets
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 flex flex-col">
                            {/* Input Area varies by Tab */}
                            <div className="flex-1 relative">
                                {activeTab === 'sca' ? (
                                    <Textarea
                                        value={packageJson}
                                        onChange={(e) => setPackageJson(e.target.value)}
                                        placeholder="// Paste package.json content..."
                                        className="absolute inset-0 w-full h-full font-mono text-sm resize-none bg-background p-4 border-0 focus-visible:ring-0"
                                    />
                                ) : (
                                    <Textarea
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder={activeTab === 'secrets' ? "// Paste config or code to scan for secrets..." : "// Paste source code for Static Analysis..."}
                                        className="absolute inset-0 w-full h-full font-mono text-sm resize-none bg-background p-4 border-0 focus-visible:ring-0"
                                    />
                                )}
                            </div>

                            {/* Action Bar */}
                            <div className="p-4 border-t bg-secondary/5 flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">
                                    {activeTab === 'sast' && "Supports: JS, TS, Python, Go"}
                                    {activeTab === 'sca' && "Supports: package.json, requirements.txt"}
                                    {activeTab === 'secrets' && "Detects: API Keys, Tokens, PII"}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        className="hidden"
                                        id="file-upload"
                                        onChange={handleFileUpload}
                                    />
                                    <Button size="sm" variant="secondary" onClick={() => document.getElementById('file-upload')?.click()}>
                                        Upload File
                                    </Button>
                                    <Button size="sm" onClick={handleScan} disabled={isScanning}>
                                        {isScanning ? (
                                            <>Analyzing...</>
                                        ) : (
                                            <><Play className="mr-2 h-4 w-4" /> Scan Now</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Column */}
                <div className="col-span-12 lg:col-span-6 h-full flex flex-col gap-4">
                    {hasScanned ? (
                        <Card className="flex-1 flex flex-col border-primary/10 overflow-hidden">
                            <CardHeader className="py-3 bg-secondary/10 border-b flex flex-row justify-between items-center">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Findings ({findings.length})
                                </CardTitle>
                                <div className="flex gap-2">
                                    {Object.entries(severityCounts).map(([sev, count]) => (
                                        count > 0 && (
                                            <Badge key={sev} variant="outline" className="text-[10px]">
                                                {sev}: {count}
                                            </Badge>
                                        )
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden bg-card">
                                {findings.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-emerald-500">
                                        <CheckCircle className="h-16 w-16 mb-4 opacity-50" />
                                        <p className="font-medium">Clean Scan</p>
                                        <p className="text-sm text-muted-foreground">No issues detected in this input.</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-full">
                                        <div className="flex flex-col divide-y">
                                            {findings.map(finding => (
                                                <div key={finding.id} className="p-4 hover:bg-secondary/5 transition-colors group">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge className={`
                                                                text-[10px] font-bold
                                                                ${finding.severity === 'CRITICAL' ? 'bg-red-500 hover:bg-red-600' :
                                                                    finding.severity === 'HIGH' ? 'bg-orange-500 hover:bg-orange-600' :
                                                                        finding.severity === 'MEDIUM' ? 'bg-amber-500 hover:bg-amber-600' :
                                                                            'bg-blue-500 hover:bg-blue-600'}
                                                            `}>
                                                                {finding.severity}
                                                            </Badge>
                                                            <span className="font-semibold text-sm">{finding.type}</span>
                                                        </div>
                                                        <span className="text-xs font-mono text-muted-foreground">Ln {finding.line || 'N/A'}</span>
                                                    </div>

                                                    <p className="text-sm text-foreground/90 mt-1">{finding.description}</p>

                                                    <div className="mt-2 text-xs font-mono bg-black/40 p-2 rounded border border-white/5 text-red-300 overflow-x-auto">
                                                        {finding.match}
                                                    </div>

                                                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-500 font-medium bg-emerald-500/5 p-2 rounded">
                                                        <ShieldAlert className="h-3 w-3" />
                                                        Suggestion: {finding.suggestion}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 border-2 border-dashed rounded-xl bg-secondary/5">
                            <Bug className="h-16 w-16 mb-4 text-secondary opacity-50" />
                            <h3 className="text-lg font-semibold text-foreground">Ready to Scan</h3>
                            <p className="text-sm max-w-xs text-center mt-2 opacity-70">
                                Usage: Select a tab (SAST, Dependencies, or Secrets), paste your content or upload a file, and hit Scan.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
