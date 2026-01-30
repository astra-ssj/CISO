"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scanCode, SASTFinding } from "@/lib/sast-engine";
import { Bug, FileCode, Play, AlertTriangle, ShieldAlert, CheckCircle, Network, ChevronRight } from "lucide-react";
import Link from 'next/link';

export default function AppSecPage() {
    const [code, setCode] = useState("");
    const [findings, setFindings] = useState<SASTFinding[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [hasScanned, setHasScanned] = useState(false);

    const handleScan = () => {
        setIsScanning(true);
        // Simulate processing delay
        setTimeout(() => {
            const results = scanCode(code);
            setFindings(results);
            setIsScanning(false);
            setHasScanned(true);
        }, 800);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setCode(text);
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
        <div className="space-y-6 h-full flex flex-col max-w-[1600px] mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Bug className="h-8 w-8 text-primary" />
                    Application Security
                </h1>
                <p className="text-muted-foreground">Static Code Analysis (SAST) and Vulnerability Detection.</p>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Input Column */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-4 h-full">
                    <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Network className="h-4 w-4 text-primary" />
                                Threat Modeling Engine
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground mr-4">Interactive STRIDE analysis & architectural diagrams.</p>
                                <Link href="/threat-modeling">
                                    <Button size="sm" variant="secondary" className="group-hover:bg-primary group-hover:text-white transition-colors">
                                        Launch <ChevronRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 flex flex-col border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle>Source Code Input</CardTitle>
                            <CardDescription>Paste code or upload a file for analysis.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <Tabs defaultValue="paste" className="w-full flex-1 flex flex-col">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="paste">Paste Code</TabsTrigger>
                                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                                </TabsList>
                                <TabsContent value="paste" className="flex-1 min-h-0 mt-4 h-full">
                                    <Textarea
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="// Paste your React, Node.js, or Python code here..."
                                        className="h-full font-mono text-sm resize-none bg-secondary/10"
                                    />
                                </TabsContent>
                                <TabsContent value="upload" className="flex-1 mt-4">
                                    <div className="border-2 border-dashed rounded-xl h-[300px] flex flex-col items-center justify-center bg-secondary/5 text-muted-foreground">
                                        <FileCode className="h-12 w-12 mb-4 text-primary/40" />
                                        <p className="mb-2">Drag & Drop code files (js, ts, py)</p>
                                        <input
                                            type="file"
                                            accept=".js,.jsx,.ts,.tsx,.py,.json"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                                            Select File
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                            <Button size="lg" onClick={handleScan} disabled={!code || isScanning} className="w-full">
                                {isScanning ? "Scanning..." : (
                                    <>
                                        <Play className="mr-2 h-4 w-4" /> Run Static Analysis
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Column */}
                <div className="col-span-12 lg:col-span-5 h-full flex flex-col gap-4">
                    {hasScanned ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-4 gap-2">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-red-500">{severityCounts.CRITICAL}</div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Crit</div>
                                </div>
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-orange-500">{severityCounts.HIGH}</div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">High</div>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-amber-500">{severityCounts.MEDIUM}</div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Med</div>
                                </div>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-500">{severityCounts.LOW}</div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Low</div>
                                </div>
                            </div>

                            <Card className={`flex-1 flex flex-col border-primary/10 overflow-hidden ${findings.length === 0 ? 'bg-emerald-500/5' : ''}`}>
                                <CardHeader className="py-3 bg-secondary/20">
                                    <CardTitle className="text-sm">Analysis Results</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 p-0 overflow-hidden">
                                    {findings.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-emerald-600">
                                            <CheckCircle className="h-12 w-12 mb-2" />
                                            <p className="font-medium">No issues found!</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[500px]">
                                            <div className="flex flex-col divide-y">
                                                {findings.map(finding => (
                                                    <div key={finding.id} className="p-4 hover:bg-secondary/10 transition-colors">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className={`
                                                                    ${finding.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-600 border-red-200' :
                                                                        finding.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-600 border-orange-200' :
                                                                            finding.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                                                                                'bg-blue-500/10 text-blue-600 border-blue-200'}
                                                                `}>{finding.severity}</Badge>
                                                                <span className="font-semibold text-sm">{finding.type}</span>
                                                            </div>
                                                            <span className="text-xs font-mono text-muted-foreground">Ln {finding.line}</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                                                        <div className="bg-card p-2 rounded border border-border/50 mb-2 font-mono text-xs overflow-x-auto text-destructive">
                                                            {finding.match}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-emerald-600">
                                                            <ShieldAlert className="h-3 w-3" />
                                                            <span className="font-medium">{finding.suggestion}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 border-2 border-dashed rounded-xl bg-secondary/5">
                            <Bug className="h-16 w-16 mb-4 text-secondary" />
                            <p>Ready to analyze.</p>
                            <p className="text-sm opacity-60">Results will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
