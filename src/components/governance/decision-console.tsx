"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, ShieldAlert, Cpu, FileText, Check, X, Loader2 } from 'lucide-react';
import { useAstraStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DecisionConsoleProps {
    requestId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DecisionConsole({ requestId, open, onOpenChange }: DecisionConsoleProps) {
    const { decisionQueue, resolveDecision, triggerAnalysis, currentUser } = useAstraStore();
    const request = requestId ? (decisionQueue.find((r) => r.id === requestId) ?? null) : null;

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    // Reset when opening a new request
    useEffect(() => {
        if (open) {
            setActiveTab("overview");
        }
    }, [open]);

    if (!request) return null;

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            if (triggerAnalysis) {
                await triggerAnalysis(request.id, request);
            } else {
                console.error("triggerAnalysis action missing from store");
            }
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
            setActiveTab("intelligence");
        }
    };

    const handleApprove = () => {
        resolveDecision(request.id, 'APPROVED', 'Approved by CISO via Intelligent Console');
        onOpenChange(false);
    };

    const handleReject = () => {
        resolveDecision(request.id, 'DENIED', 'Rejected based on Automated Risk Assessment');
        onOpenChange(false);
    };

    const hasAnalysis = !!request.analysis;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-primary/20">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-2xl font-bold font-mono tracking-tight">
                                DECISION CONSOLE // {request.id}
                            </DialogTitle>
                            <Badge variant="outline" className={cn(
                                "font-mono",
                                request.riskLevel === 'CRITICAL' ? "border-red-500 text-red-500" :
                                    request.riskLevel === 'HIGH' ? "border-orange-500 text-orange-500" :
                                        "border-blue-500 text-blue-500"
                            )}>
                                {request.riskLevel} PRIORITY
                            </Badge>
                        </div>
                        <DialogDescription className="text-base">
                            {request.title}
                        </DialogDescription>
                    </div>
                    <div className="flex flex-col items-end text-sm text-muted-foreground font-mono">
                        <span>REQ: {request.requester}</span>
                        <span>{new Date(request.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <div className="px-6 pt-4 border-b border-white/5">
                            <TabsList className="grid w-full max-w-md grid-cols-3 bg-secondary/20">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="intelligence" disabled={!hasAnalysis && !isAnalyzing}>
                                    {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Cpu className="h-3 w-3 mr-2" />}
                                    Intelligence
                                </TabsTrigger>
                                <TabsTrigger value="artifacts" disabled={!hasAnalysis}>
                                    <FileText className="h-3 w-3 mr-2" /> Artifacts
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            {/* OVERVIEW TAB */}
                            <TabsContent value="overview" className="mt-0 space-y-6">
                                <Card className="bg-white/5 border-white/10">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Technical Description</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                                            {request.description}
                                        </p>
                                    </CardContent>
                                </Card>

                                {!hasAnalysis && (
                                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 gap-4">
                                        <ShieldAlert className="h-12 w-12 text-primary/60" />
                                        <div className="text-center space-y-1">
                                            <h3 className="text-lg font-bold">Risk Assessment Required</h3>
                                            <p className="text-muted-foreground max-w-sm">
                                                Initiate the CISO Intelligence Engine to scan for vulnerabilities, compliance gaps, and required controls.
                                            </p>
                                        </div>
                                        <Button size="lg" onClick={handleRunAnalysis} disabled={isAnalyzing}>
                                            {isAnalyzing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing protocols...
                                                </>
                                            ) : (
                                                <>
                                                    <Cpu className="mr-2 h-4 w-4" /> Run Intelligent Analysis
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            {/* INTELLIGENCE TAB */}
                            <TabsContent value="intelligence" className="mt-0 space-y-6">
                                {hasAnalysis && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card className="bg-red-500/10 border-red-500/20">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-mono text-red-500 uppercase flex items-center gap-2">
                                                        <AlertTriangle className="h-4 w-4" /> Identified Risks
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="list-disc list-inside text-sm space-y-1 text-red-200/80">
                                                        {(request.analysis?.flaggedKeywords ?? []).map((k: string, i: number) => (
                                                            <li key={i}>Flagged sensitivity: <span className="font-bold">{k}</span></li>
                                                        ))}
                                                        <li>Compliance Score Impact: -{(request.analysis?.riskScore ?? 0) > 50 ? '5.2' : '1.5'}%</li>
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-blue-500/10 border-blue-500/20">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-mono text-blue-400 uppercase flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4" /> Compliance Gaps
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="list-disc list-inside text-sm space-y-1 text-blue-200/80">
                                                        {(request.analysis?.complianceGaps ?? []).map((g: string, i: number) => (
                                                            <li key={i}>{g}</li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase mb-3">Recommended Actions</h3>
                                            <div className="grid gap-2">
                                                {request.recommendedActions?.map((action: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-white/5">
                                                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-mono">
                                                            {i + 1}
                                                        </div>
                                                        <span className="text-sm">{action}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </TabsContent>

                            {/* ARTIFACTS TAB */}
                            <TabsContent value="artifacts" className="mt-0">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold">Generated Governance Artifacts</h3>
                                        <Badge variant="secondary">AUTO-GENERATED</Badge>
                                    </div>
                                    <div className="grid gap-4">
                                        {request.generatedArtifacts?.map((artifact) => (
                                            <Card key={artifact.id} className="overflow-hidden">
                                                <CardHeader className="bg-secondary/10 py-3 flex flex-row items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-primary" />
                                                        <span className="font-mono text-sm font-bold">{artifact.title}</span>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px]">{artifact.type}</Badge>
                                                </CardHeader>
                                                <CardContent className="p-0">
                                                    <pre className="p-4 text-xs font-mono bg-black/50 overflow-x-auto max-h-[200px] text-muted-foreground">
                                                        {artifact.content}
                                                    </pre>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-black/20 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel Review</Button>
                    <div className="flex gap-3">
                        <Button
                            variant="destructive"
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                            onClick={handleReject}
                        >
                            <X className="mr-2 h-4 w-4" /> Reject Request
                        </Button>
                        <div className="flex flex-col items-end gap-1">
                            <Button
                                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleApprove}
                                disabled={!hasAnalysis || !!(currentUser?.name && request.requester === currentUser.name)}
                                title={currentUser?.name && request.requester === currentUser.name ? "Segregation of Duties: You cannot approve your own request." : "Approve Request"}
                            >
                                {currentUser?.name && request.requester === currentUser.name ? <ShieldAlert className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                                {currentUser?.name && request.requester === currentUser.name ? "Self-Approval Blocked" : "Ratify & Approve"}
                            </Button>
                            {currentUser?.name && request.requester === currentUser.name && (
                                <span className="text-[10px] text-red-400 font-mono">⚠ SOD Violation Code: 22-A</span>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
