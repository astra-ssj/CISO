"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDynamicControls, calculateComplianceScore } from "@/lib/governance";
import { usePolicyStore } from "@/lib/policy-store";
import { usePlaybookStore } from "@/lib/playbook-store";
import { useEvidenceStore } from "@/lib/evidence-store";
import { CheckCircle, XCircle, FileText, Scale, FileUp } from "lucide-react";
import { ComplianceHeatmap } from "@/components/governance/compliance-heatmap";
import { AuditManager } from "@/components/governance/audit-manager";
import { ContractAnalysis } from "@/components/governance/contract-analysis";
import { EvidenceVault } from "@/components/governance/evidence-vault";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GovernancePage() {
    const { policies, fetchPolicies } = usePolicyStore();
    const { playbooks, fetchPlaybooks } = usePlaybookStore();
    const { fetchEvidence } = useEvidenceStore();
    const [controls, setControls] = useState(getDynamicControls([], []));

    useEffect(() => {
        fetchPolicies();
        fetchPlaybooks();
        fetchEvidence();
    }, [fetchPolicies, fetchPlaybooks, fetchEvidence]);

    useEffect(() => {
        setControls(getDynamicControls(policies, playbooks));
    }, [policies, playbooks]);

    // Use dynamic score
    const score = calculateComplianceScore(controls);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Governance & Legal</h1>
                        <p className="text-muted-foreground">Manage compliance frameworks, audit artifacts, and vendor contracts.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="compliance" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="compliance" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Compliance Controls
                    </TabsTrigger>
                    <TabsTrigger value="evidence" className="gap-2">
                        <FileUp className="h-4 w-4" />
                        Evidence Vault
                    </TabsTrigger>
                    <TabsTrigger value="legal" className="gap-2">
                        <Scale className="h-4 w-4" />
                        Legal Intelligence
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="compliance" className="space-y-6">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit mb-4">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-medium text-emerald-500">Live System State</span>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Score Card */}
                        <Card className="md:col-span-1 bg-card/30 border-primary/20 backdrop-blur-sm">
                            <CardHeader><CardTitle>Overall Compliance</CardTitle></CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-6">
                                <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-4 border-primary/20 bg-primary/5">
                                    <span className="text-4xl font-bold text-primary">{score}%</span>
                                </div>
                                <p className="mt-4 text-sm text-center text-muted-foreground">
                                    Real-time score based on {controls.length} active controls across {policies.length} policies and {playbooks.length} incidents.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Audit Manager (Interactive) */}
                        <div className="md:col-span-2">
                            <AuditManager />
                        </div>
                    </div>

                    {/* Interactive Heatmap */}
                    <ComplianceHeatmap />

                    {/* Controls List (Visual Verification) */}
                    <Card className="bg-card/20 border-primary/10">
                        <CardHeader><CardTitle>Active Control Status</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {controls.map(control => (
                                    <div key={control.id} className="flex items-center justify-between p-3 border border-border/40 rounded-lg bg-background/20">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${control.status === 'COMPLIANT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {control.status === 'COMPLIANT' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className="font-medium">{control.id}: {control.name}</div>
                                                <div className="text-xs text-muted-foreground">{control.details || control.description}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {control.mappedStandards.map(s => (
                                                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                                                    {s.replace('_', ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="evidence" className="space-y-6 animate-fade-in">
                    <EvidenceVault />
                </TabsContent>

                <TabsContent value="legal" className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center bg-card/50 p-4 rounded-lg border border-border/50">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Contract Analysis Engine</h2>
                            <p className="text-sm text-muted-foreground">AI-driven analysis of Master Services Agreements (MSAs) and vendor contracts.</p>
                        </div>
                    </div>

                    <ContractAnalysis />
                </TabsContent>
            </Tabs>
        </div>
    );
}
