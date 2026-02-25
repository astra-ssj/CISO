"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, AlertTriangle, ScrollText, Plus, Search, FileSearch, Archive } from "lucide-react";
import { ComplianceHeatmap } from "@/components/governance/compliance-heatmap";
import { AuditLogViewer } from "@/components/governance/audit-log-viewer";
import { EvidenceVaultV2 } from "@/components/governance/evidence-vault-v2";
import { useRiskRegisterStore } from "@/lib/risk-register-store";
import { usePolicyStore } from "@/lib/policy-store";
import { cn } from "@/lib/utils";
import { POLICY_TEMPLATES } from "@/lib/policy-templates";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Risk Register Tab ───
function RiskRegisterTab() {
    const { entries, fetchEntries, isLoading } = useRiskRegisterStore();
    const [search, setSearch] = useState("");
    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const filtered = entries.filter(e => e.scenario.assetName.toLowerCase().includes(search.toLowerCase()));
    const grouped = {
        CRITICAL: filtered.filter(e => e.analysis.riskScore >= 80),
        HIGH: filtered.filter(e => e.analysis.riskScore >= 60 && e.analysis.riskScore < 80),
        MEDIUM: filtered.filter(e => e.analysis.riskScore >= 30 && e.analysis.riskScore < 60),
        LOW: filtered.filter(e => e.analysis.riskScore < 30),
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Quantitative risk management using FAIR methodology.</p>
                <div className="flex gap-2">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9 w-64" placeholder="Search risks..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" />New Risk</Button>
                </div>
            </div>

            {isLoading ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground">Loading risk data...</CardContent></Card> : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([tier, risks]) => risks.length > 0 && (
                        <div key={tier} className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", tier === "CRITICAL" ? "bg-red-500" : tier === "HIGH" ? "bg-orange-500" : tier === "MEDIUM" ? "bg-amber-500" : "bg-blue-500")} />
                                {tier} ({risks.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {risks.map(risk => (
                                    <Card key={risk.id} className="border-border hover:border-primary/30 transition-all">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-sm truncate">{risk.scenario.assetName}</h4>
                                                <Badge variant="outline" className="text-[10px]">Score: {risk.analysis.riskScore}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{risk.notes}</p>
                                            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                                <span>Owner: {risk.owner}</span>
                                                <Badge variant={risk.status === "OPEN" ? "destructive" : "secondary"} className="text-[10px]">{risk.status}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground">No risk scenarios found.</CardContent></Card>}
                </div>
            )}
        </div>
    );
}

// ─── Policy Engine Tab ───
function PolicyEngineTab() {
    const { policies, fetchPolicies, isLoading, addPolicy } = usePolicyStore();
    const [search, setSearch] = useState("");
    useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

    const filtered = policies.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Policy lifecycle management — draft, review, approve, publish.</p>
                <div className="flex gap-2">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9 w-64" placeholder="Search policies..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />New Policy</Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel>From Template</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {POLICY_TEMPLATES.map(t => (
                                <DropdownMenuItem key={t.id} onClick={() => addPolicy({
                                    id: `pol-${Date.now()}`, title: t.title, type: 'ISMS', version: '1.0.0',
                                    status: 'DRAFT', owner: 'CISO', lastUpdated: new Date().toISOString(),
                                    sections: [{ id: 's1', title: 'Main', content: t.content }],
                                    mappings: [], dependencies: [],
                                    acknowledgment: { status: 'PENDING', totalUsers: 0, signedUsers: 0 },
                                    changelog: [{ version: '1.0.0', date: new Date().toISOString(), author: 'CISO', notes: 'Created from template' }],
                                })}>
                                    <ScrollText className="h-4 w-4 mr-2" />{t.title}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {isLoading ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground">Loading policies...</CardContent></Card> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(policy => (
                        <Card key={policy.id} className="border-border hover:border-primary/30 transition-all">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm truncate flex items-center gap-2"><ScrollText className="h-4 w-4 text-muted-foreground" />{policy.title}</h4>
                                    <Badge variant="outline" className="text-[10px]">{policy.status}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">v{policy.version} · {policy.owner}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{policy.sections[0]?.content.slice(0, 120) ?? 'No content'}...</p>
                            </CardContent>
                        </Card>
                    ))}
                    {filtered.length === 0 && <Card className="border-dashed col-span-2"><CardContent className="text-center py-12 text-muted-foreground">No policies found.</CardContent></Card>}
                </div>
            )}
        </div>
    );
}

// ─── Main Governance page with tabs ───
export default function GovernancePage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Governance & Risk</h1>

            <Tabs defaultValue="compliance" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="compliance" className="gap-2"><Shield className="h-4 w-4" />Compliance</TabsTrigger>
                    <TabsTrigger value="risk" className="gap-2"><AlertTriangle className="h-4 w-4" />Risk Register</TabsTrigger>
                    <TabsTrigger value="policies" className="gap-2"><ScrollText className="h-4 w-4" />Policy Engine</TabsTrigger>
                    <TabsTrigger value="audit" className="gap-2"><FileSearch className="h-4 w-4" />Audit Logs</TabsTrigger>
                    <TabsTrigger value="evidence" className="gap-2"><Archive className="h-4 w-4" />Evidence Vault</TabsTrigger>
                </TabsList>

                <TabsContent value="compliance">
                    <div className="space-y-6">
                        <p className="text-muted-foreground">Evidence vault, compliance heatmap, and audit readiness.</p>
                        <ComplianceHeatmap />
                    </div>
                </TabsContent>

                <TabsContent value="risk"><RiskRegisterTab /></TabsContent>
                <TabsContent value="policies"><PolicyEngineTab /></TabsContent>
                <TabsContent value="audit"><AuditLogViewer /></TabsContent>
                <TabsContent value="evidence"><EvidenceVaultV2 /></TabsContent>
            </Tabs>
        </div>
    );
}
