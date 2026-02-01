"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BrainCircuit, Upload, FileText, CheckCircle2, AlertTriangle, ShieldAlert, Zap, Target, TrendingUp, Plus, Lightbulb } from "lucide-react";
import { COMPLIANCE_FRAMEWORKS, FrameworkID } from "@/lib/compliance-frameworks";
import { analyzePolicy, AnalysisResult } from "@/lib/policy-engine";
import { useAppSecStore } from '@/lib/appsec-store';
import { usePlaybookStore } from '@/lib/playbook-store';

interface StrategicInitiative {
    id: string;
    title: string;
    description: string;
    driver: string; // What triggered this (e.g. "High Vuln Count")
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    cost: '$$$' | '$$' | '$';
    status: 'PROPOSED' | 'ADOPTED';
}

export default function IntelligencePage() {
    // Policy Analysis State
    const [policyText, setPolicyText] = useState("");
    const [selectedFrameworks, setSelectedFrameworks] = useState<FrameworkID[]>(['GDPR', 'ISO_27001_2022']);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Strategic Planning State
    const { findings } = useAppSecStore();
    const { playbooks } = usePlaybookStore();
    const [adoptedInitiatives, setAdoptedInitiatives] = useState<string[]>([]);

    const toggleFramework = (id: FrameworkID) => {
        setSelectedFrameworks(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            const result = analyzePolicy(policyText, selectedFrameworks);
            setAnalysisResult(result);
            setIsAnalyzing(false);
        }, 1500);
    };

    // Dynamic Strategy Generation
    const generateInitiatives = (): StrategicInitiative[] => {
        const initiatives: StrategicInitiative[] = [];
        const highVulns = findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;
        const activeIncidents = playbooks.filter(p => p.status === 'ACTIVE').length;

        // 1. Vulnerability Driven
        if (highVulns > 0) {
            initiatives.push({
                id: 'init-vuln',
                title: 'Automated Patch Management Program',
                description: `Implement auto-patching for Tier 2/3 assets to reduce the ${highVulns} critical vulnerabilities detected.`,
                driver: `${highVulns} Critical/High Vulns Detected`,
                impact: 'HIGH',
                cost: '$$',
                status: 'PROPOSED'
            });
        }

        // 2. Incident Driven
        if (activeIncidents > 0) {
            initiatives.push({
                id: 'init-ir',
                title: 'Incident Response Tabletop Exercise',
                description: 'Conduct a scenario-based drill focused on Ransomware to improve current response times.',
                driver: 'Active Security Incidents Detected',
                impact: 'HIGH',
                cost: '$',
                status: 'PROPOSED'
            });
        }

        // 3. Strategic / Forward Looking
        initiatives.push({
            id: 'init-zt',
            title: 'Zero Trust Architecture Pilot',
            description: 'Begin identity-aware proxy rollout for critical internal apps.',
            driver: 'Modernization Roadmap',
            impact: 'HIGH',
            cost: '$$$',
            status: 'PROPOSED'
        });

        initiatives.push({
            id: 'init-ai',
            title: 'AI Governance Framework',
            description: 'Establish policy guardrails for generative AI usage across engineering.',
            driver: 'Emerging Tech Risk',
            impact: 'MEDIUM',
            cost: '$',
            status: 'PROPOSED'
        });

        return initiatives;
    };

    const initiatives = generateInitiatives();

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <BrainCircuit className="h-8 w-8 text-primary" />
                    CISO Intelligence Engine
                </h1>
                <p className="text-muted-foreground text-lg">
                    AI-driven analysis for Policy Compliance and Strategic Planning.
                </p>
            </div>

            <Tabs defaultValue="strategy" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="strategy">Strategic Planning</TabsTrigger>
                    <TabsTrigger value="policy">Policy Analysis</TabsTrigger>
                </TabsList>

                {/* TAB: STRATEGIC PLANNING */}
                <TabsContent value="strategy" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Context Column */}
                        <div className="md:col-span-1 space-y-6">
                            <Card className="bg-card/40 border-primary/20">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Target className="h-5 w-5 text-primary" />
                                        Context Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 bg-secondary/20 rounded-lg border border-border">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Threat Landscape</div>
                                        <div className="text-2xl font-bold text-red-500 flex items-center gap-2">
                                            {findings.length} <span className="text-sm font-normal text-muted-foreground">Vulns</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-secondary/20 rounded-lg border border-border">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Operational State</div>
                                        <div className="text-2xl font-bold text-amber-500 flex items-center gap-2">
                                            {playbooks.filter(p => p.status === 'ACTIVE').length} <span className="text-sm font-normal text-muted-foreground">Incidents</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-secondary/20 rounded-lg border border-border">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">AI Recommendation</div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            "Based on high vulnerability density, prioritize <span className="text-primary">AppSec automation</span> over policy documentation this quarter."
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Initiatives Grid */}
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-500" />
                                Recommended Initiatives
                            </h3>
                            <div className="grid gap-4">
                                {initiatives.map((init) => (
                                    <Card key={init.id} className={`transition-all hover:border-primary/50 ${adoptedInitiatives.includes(init.id) ? 'border-emerald-500/50 bg-emerald-500/5' : 'bg-card/30'}`}>
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-lg">{init.title}</h4>
                                                        {adoptedInitiatives.includes(init.id) && (
                                                            <Badge variant="default" className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30">
                                                                Adoption Planned
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground max-w-xl">
                                                        {init.description}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <TrendingUp className="h-3 w-3" />
                                                            Driver: {init.driver}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded bg-secondary/50 border border-border">
                                                            Impact: {init.impact}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded bg-secondary/50 border border-border">
                                                            Cost: {init.cost}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={adoptedInitiatives.includes(init.id) ? "ghost" : "default"}
                                                    onClick={() => {
                                                        if (!adoptedInitiatives.includes(init.id)) {
                                                            setAdoptedInitiatives([...adoptedInitiatives, init.id]);
                                                        }
                                                    }}
                                                    disabled={adoptedInitiatives.includes(init.id)}
                                                >
                                                    {adoptedInitiatives.includes(init.id) ? (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                                            Adopted
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Adopt
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB: POLICY ANALYSIS (The original content) */}
                <TabsContent value="policy" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Left Column: Input & Configuration */}
                        <div className="md:col-span-1 space-y-6">
                            <Card className="bg-card/30 border-primary/20">
                                <CardHeader>
                                    <CardTitle>1. Target Frameworks</CardTitle>
                                    <CardDescription>Select mandates to cross-map against.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {Object.values(COMPLIANCE_FRAMEWORKS).map((fw) => (
                                        <div
                                            key={fw.id}
                                            onClick={() => toggleFramework(fw.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedFrameworks.includes(fw.id)
                                                ? 'bg-primary/20 border-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]'
                                                : 'bg-secondary/20 border-border hover:bg-secondary/40'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-sm">{fw.id.replace(/_/g, ' ')}</span>
                                                {selectedFrameworks.includes(fw.id) && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                            </div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{fw.name}</div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="bg-card/30 border-primary/20 h-full">
                                <CardHeader>
                                    <CardTitle>2. Policy Input</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="border-2 border-dashed border-border/50 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-secondary/10 transition-colors cursor-pointer">
                                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                        <span className="text-sm font-medium">Upload Document</span>
                                        <span className="text-xs text-muted-foreground">.docx, .pdf, .md (Max 10MB)</span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border/50" />
                                        <span className="relative z-10 bg-card px-2 text-xs text-muted-foreground block text-center w-fit mx-auto">OR PASTE TEXT</span>
                                    </div>
                                    <Textarea
                                        placeholder="Paste policy text here (e.g. 'Data Retention Policy')..."
                                        className="min-h-[200px] bg-secondary/30 font-mono text-xs resize-none"
                                        value={policyText}
                                        onChange={(e) => setPolicyText(e.target.value)}
                                    />
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing || !policyText || selectedFrameworks.length === 0}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                                    >
                                        {isAnalyzing ? "Analyzing..." : "Run Gap Analysis"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Analysis Results */}
                        <div className="md:col-span-2">
                            {!analysisResult ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 border border-dashed border-border/30 rounded-xl bg-card/10 text-muted-foreground">
                                    <FileText className="h-16 w-16 mb-4 opacity-20" />
                                    <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                                    <p className="text-center max-w-md">Select frameworks and paste your policy text to generate a specialized gap analysis report.</p>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Executive Summary Card */}
                                    <Card className="border-primary/30 bg-card/40 backdrop-blur-md overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Badge variant="outline" className="mb-2 border-primary/30 text-primary">Generated Report</Badge>
                                                    <CardTitle>Executive Summary</CardTitle>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold font-mono">{analysisResult.score}/100</div>
                                                    <div className="text-xs text-muted-foreground">Compliance Rating</div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                                                    <div className="text-2xl font-bold text-red-500">{analysisResult.identifiedGaps.filter(g => g.riskLevel === 'CRITICAL').length}</div>
                                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Critical Gaps</div>
                                                </div>
                                                <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20">
                                                    <div className="text-2xl font-bold text-amber-500">{analysisResult.vagueTermsCount}</div>
                                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Vague Terms</div>
                                                </div>
                                                <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20">
                                                    <div className="text-2xl font-bold text-blue-500">{analysisResult.identifiedGaps.length}</div>
                                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Findings</div>
                                                </div>
                                            </div>

                                            {analysisResult.score < 50 && (
                                                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                                                    <ShieldAlert className="h-4 w-4" />
                                                    <AlertTitle>High Regulatory Risk Detected</AlertTitle>
                                                    <AlertDescription>
                                                        This policy lacks specific enforcement mechanisms and misses critical mandatory controls.
                                                        Immediate revision required for GDPR/NIS2 compliance.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Detailed Analysis Tabs */}
                                    <Tabs defaultValue="gaps" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 bg-secondary/30">
                                            <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
                                            <TabsTrigger value="remediation">Remediation Plan</TabsTrigger>
                                            <TabsTrigger value="evidence">Evidence Checklist</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="gaps" className="mt-4">
                                            <ScrollArea className="h-[400px] rounded-md border border-border/50 bg-card/20 p-4">
                                                <div className="space-y-4">
                                                    {analysisResult.identifiedGaps.map((gap, i) => (
                                                        <div key={i} className="group relative pl-4 border-l-2 border-l-muted-foreground hover:border-l-primary transition-colors">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge variant="outline" className={`text-[10px] ${gap.riskLevel === 'CRITICAL' ? 'text-red-500 border-red-500/30 bg-red-500/5' :
                                                                    gap.riskLevel === 'HIGH' ? 'text-amber-500 border-amber-500/30 bg-amber-500/5' :
                                                                        'text-blue-500 border-blue-500/30 bg-blue-500/5'
                                                                    }`}>
                                                                    {gap.riskLevel}
                                                                </Badge>
                                                                <span className="text-xs font-mono text-muted-foreground">{gap.frameworkName} :: {gap.controlId}</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-foreground">{gap.gapDescription}</p>
                                                        </div>
                                                    ))}
                                                    {analysisResult.identifiedGaps.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center py-10 text-emerald-500">
                                                            <CheckCircle2 className="h-10 w-10 mb-2" />
                                                            <p>No gaps detected against selected frameworks.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </TabsContent>

                                        <TabsContent value="remediation" className="mt-4">
                                            <ScrollArea className="h-[400px] rounded-md border border-border/50 bg-card/20 p-4">
                                                <div className="space-y-6">
                                                    {analysisResult.identifiedGaps.map((gap, i) => (
                                                        <div key={i} className="bg-secondary/10 p-4 rounded-lg border border-border/30">
                                                            <div className="flex items-start gap-3">
                                                                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <h4 className="text-sm font-semibold text-foreground mb-1">Fix for {gap.controlId}</h4>
                                                                    <p className="text-sm text-muted-foreground">{gap.remediationSuggestion}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

