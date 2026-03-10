"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileCode,
    ShieldAlert,
    CheckCircle,
    Search,
    Lock,
    GitBranch,
    AlertCircle,
    Activity,
    Box,
    RefreshCw,
    Upload,
    Container
} from "lucide-react";

import { useAppSecStore } from "@/lib/appsec-store";
import { parseSemgrep, parseTrivy, parseGitleaks, parsePackageJson } from "@/lib/appsec/parsers";
import { fetchDependabotAlerts, fetchSecretScanningAlerts } from "@/lib/appsec/github";
import { AppSecFinding, FindingType } from "@/lib/appsec/types";

// Mock Pipeline Data
const PIPELINE_DATA = [
    { id: '1024', branch: 'main', status: 'failed', stage: 'sast', blocker: 'CRITICAL Vuln Found', time: '10m ago' },
    { id: '1023', branch: 'feat/auth', status: 'success', stage: 'deploy', blocker: null, time: '1h ago' },
    { id: '1022', branch: 'fix/login', status: 'success', stage: 'deploy', blocker: null, time: '2h ago' },
    { id: '1021', branch: 'dev', status: 'failed', stage: 'container-scan', blocker: 'High CVE-2024-XYZ', time: '4h ago' },
];

export default function AppSecPage() {
    const { findings, addFindings, getMetrics } = useAppSecStore();
    const [activeTab, setActiveTab] = useState<FindingType>("SAST");
    const [isSyncing, setIsSyncing] = useState(false);

    // Derived state
    const metrics = getMetrics();
    const filteredFindings = findings.filter(f => f.type === activeTab);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;

            // Try to figure out which tool generated this JSON 
            // In a real app we might prompt the user, but we'll try to auto-detect based on JSON structure
            let newFindings: AppSecFinding[] = [];

            if (text.includes('"check_id"')) {
                newFindings = parseSemgrep(text);
                setActiveTab('SAST');
            } else if (text.includes('"Vulnerabilities"') || text.includes('Target')) {
                newFindings = parseTrivy(text);
                setActiveTab('CONTAINER');
            } else if (text.includes('"Description"') && text.includes('"Secret"')) {
                newFindings = parseGitleaks(text);
                setActiveTab('SECRET');
            } else if (text.includes('"dependencies"') || text.includes('"devDependencies"')) {
                newFindings = parsePackageJson(text);
                setActiveTab('SCA');
            } else {
                alert("Unrecognized JSON format. Currently supporting Semgrep, Trivy, Gitleaks, and package.json.");
                return;
            }

            if (newFindings.length > 0) {
                addFindings(newFindings);
            }
        };
        reader.readAsText(file);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleGitHubSync = async () => {
        setIsSyncing(true);
        try {
            // Note: In a real app, the owner/repo would be configurable via settings or input
            const owner = 'Jaolikars';
            const repo = 'CISO';

            const [dependabot, secrets] = await Promise.all([
                fetchDependabotAlerts(owner, repo),
                fetchSecretScanningAlerts(owner, repo)
            ]);

            if (dependabot.length > 0) addFindings(dependabot);
            if (secrets.length > 0) addFindings(secrets);

            // Switch to SCA to show the new Dependabot results
            setActiveTab('SCA');
        } catch (error) {
            console.error(error);
            alert("GitHub Sync Failed. Ensure you have a valid GITHUB_PAT in your .env.local file.");
        } finally {
            setIsSyncing(false);
        }
    };

    const FindingsList = ({ items }: { items: AppSecFinding[] }) => {
        if (items.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-emerald-500 py-16">
                    <CheckCircle className="h-16 w-16 mb-4 opacity-50" />
                    <p className="font-medium">Clean</p>
                    <p className="text-sm text-muted-foreground">No {activeTab} issues detected.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col divide-y">
                {items.map(finding => (
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
                                <span className="font-semibold text-sm">{finding.title}</span>
                                {finding.cwe && <Badge variant="outline" className="text-[10px] px-1">{finding.cwe}</Badge>}
                            </div>
                            <span className="text-xs font-mono text-muted-foreground bg-secondary/20 px-2 py-0.5 rounded">
                                {finding.tool}
                            </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            {finding.file && <span>📄 {finding.file}</span>}
                            {finding.line && <span>Ln {finding.line}</span>}
                        </div>

                        <p className="text-sm text-foreground/90 mt-1">{finding.description}</p>

                        {finding.match && (
                            <div className="mt-2 text-xs font-mono bg-black/40 p-2 rounded border border-white/5 text-red-300 overflow-x-auto whitespace-pre">
                                {finding.match}
                            </div>
                        )}

                        {finding.remediation && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-500 font-medium bg-emerald-500/5 p-2 rounded">
                                <ShieldAlert className="h-3 w-3" />
                                {finding.remediation}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col max-w-[1600px] mx-auto pb-8">
            {/* Header + Actions */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ShieldAlert className="h-8 w-8 text-primary" />
                        Application Security
                    </h1>
                    <p className="text-muted-foreground">Unified visibility layer for local code, dependencies, secrets, and containers.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Import Scan
                    </Button>
                    <Button onClick={handleGitHubSync} disabled={isSyncing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync GitHub'}
                    </Button>
                </div>
            </div>

            {/* Top Row: Hero Security Posture */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex flex-col border-primary/20 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Security Posture</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-row items-center justify-between gap-4">
                        <div className="text-center p-4 bg-secondary/10 rounded-lg border border-dashed border-secondary/50 flex flex-col justify-center flex-1">
                            <div className={`text-5xl font-bold mb-1 ${metrics.grade === 'A+' || metrics.grade === 'A' ? 'text-emerald-500' :
                                metrics.grade === 'B' ? 'text-blue-500' :
                                    metrics.grade === 'C' ? 'text-amber-500' : 'text-red-500'
                                }`}>{metrics.grade}</div>
                            <div className="text-xs text-muted-foreground">Overall Rating</div>
                        </div>
                        <div className="flex flex-col gap-4 flex-1">
                            <div className="text-center p-3 bg-red-500/10 rounded-lg">
                                <div className="text-2xl font-bold text-red-500">{metrics.openCriticals}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Open Criticals</div>
                            </div>
                            <div className="text-center p-3 bg-secondary/10 rounded-lg">
                                <div className="text-2xl font-bold">{metrics.mttf}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Mean Time to Fix</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pipeline Security Widget */}
                <Card className="md:col-span-2 border-primary/20">
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
                                        <Badge variant="destructive" className="text-[10px] h-6 px-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                                            <AlertCircle className="h-3 w-3 mr-1 shrink-0" />
                                            <span className="truncate">{build.blocker}</span>
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] h-6 border-emerald-500/30 text-emerald-500 px-2 shrink-0">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Passed
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Unified Findings View */}
            <Card className="flex-1 flex flex-col border-primary/20 min-h-[500px]">
                <CardHeader className="py-2 border-b bg-secondary/5">
                    <div className="flex items-center justify-between w-full">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FindingType)} className="w-[600px]">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="SAST" className="flex items-center gap-2 text-xs">
                                    <FileCode className="h-3 w-3" /> SAST
                                </TabsTrigger>
                                <TabsTrigger value="SCA" className="flex items-center gap-2 text-xs">
                                    <Box className="h-3 w-3" /> Dependencies
                                </TabsTrigger>
                                <TabsTrigger value="SECRET" className="flex items-center gap-2 text-xs">
                                    <Lock className="h-3 w-3" /> Secrets
                                </TabsTrigger>
                                <TabsTrigger value="CONTAINER" className="flex items-center gap-2 text-xs">
                                    <Container className="h-3 w-3" /> Container
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-background">
                                <Search className="w-3 h-3 mr-1" /> Total: {metrics.total}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden bg-card/50">
                    <ScrollArea className="h-full max-h-[600px]">
                        <FindingsList items={filteredFindings} />
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
