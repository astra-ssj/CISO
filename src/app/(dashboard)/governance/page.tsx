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
import { usePolicyStore } from "@/lib/policy-store";
import { cn } from "@/lib/utils";
import { POLICY_TEMPLATES } from "@/lib/policy-templates";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { getRisks, getRiskById } from "@/lib/risk/actions";
import { RiskHeatmap } from "@/components/risk/RiskHeatmap";
import { NewRiskModal } from "@/components/risk/NewRiskModal";
import { RiskDetailPanel } from "@/components/risk/RiskDetailPanel";

import type { Risk } from "@prisma/client";

// ─── Risk Register Tab ───
function RiskRegisterTab() {
    const [risks, setRisks] = useState<Risk[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isNewRiskModalOpen, setIsNewRiskModalOpen] = useState(false);
    const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
    const [heatmapFilter, setHeatmapFilter] = useState<{ likelihood: number; impact: number } | null>(null);

    const loadRisks = async () => {
        setIsLoading(true);
        try {
            const data = await getRisks();
            setRisks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadRisks(); }, []);

    const handleExportCSV = () => {
        if (risks.length === 0) return;
        const headers = ["ID", "Title", "Category", "Likelihood", "Impact", "Inherent Score", "Residual Score", "Owner", "Status", "Review Date", "Created At"];
        const rows = risks.map(r => [r.id, r.title, r.category, r.likelihood, r.impact, r.inherentScore, r.residualScore || "", r.owner, r.status, new Date(r.reviewDate).toLocaleDateString(), new Date(r.createdAt).toLocaleDateString()]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `risk_register_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    let filtered = risks.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()));

    // Apply Heatmap filter
    if (heatmapFilter) {
        filtered = filtered.filter(r => r.likelihood === heatmapFilter.likelihood && r.impact === heatmapFilter.impact);
    }

    const grouped = {
        CRITICAL: filtered.filter(r => r.inherentScore >= 20),
        HIGH: filtered.filter(r => r.inherentScore >= 12 && r.inherentScore < 20),
        MEDIUM: filtered.filter(r => r.inherentScore >= 5 && r.inherentScore < 12),
        LOW: filtered.filter(r => r.inherentScore < 5),
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Enterprise risk register detailing categorized risks and mitigation plans.</p>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9 w-48 lg:w-64" placeholder="Search risks..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={risks.length === 0}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button size="sm" onClick={() => setIsNewRiskModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Risk
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground">Loading risk data...</CardContent></Card>
            ) : risks.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="text-center py-24 text-muted-foreground flex flex-col items-center">
                        <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground mb-1">No risks registered</h3>
                        <p className="mb-4">Click + New Risk to populate the database and get started.</p>
                        <Button onClick={() => setIsNewRiskModalOpen(true)}>Create First Risk</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
                    <div className="bg-muted/10 p-4 rounded-xl border flex flex-col items-center">
                        <h3 className="font-semibold mb-6 flex items-center justify-between w-full">
                            Risk Heatmap
                            {heatmapFilter && <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setHeatmapFilter(null)}>Clear Filter</Button>}
                        </h3>
                        <RiskHeatmap
                            data={risks}
                            onCellClick={(likelihood, impact) => setHeatmapFilter({ likelihood, impact })}
                            selectedCell={heatmapFilter}
                        />
                    </div>

                    <div className="space-y-6">
                        {Object.entries(grouped).map(([tier, tierRisks]) => tierRisks.length > 0 && (
                            <div key={tier} className="space-y-3">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <span className={cn("h-2 w-2 rounded-full", tier === "CRITICAL" ? "bg-red-500" : tier === "HIGH" ? "bg-orange-500" : tier === "MEDIUM" ? "bg-amber-500" : "bg-blue-500")} />
                                    {tier} ({tierRisks.length})
                                </h3>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                    {tierRisks.map(risk => (
                                        <Card key={risk.id} className="border-border hover:border-primary/50 cursor-pointer transition-all" onClick={() => setSelectedRiskId(risk.id)}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2 gap-2">
                                                    <div>
                                                        <h4 className="font-medium text-sm leading-tight">{risk.title}</h4>
                                                        <span className="text-[10px] text-muted-foreground uppercase">{risk.category}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <Badge variant="outline" className={cn("text-[10px] whitespace-nowrap", risk.inherentScore >= 20 ? "text-red-500 border-red-500/30" : "")}>Score: {risk.inherentScore}</Badge>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{risk.description}</p>
                                                <div className="flex items-center justify-between mt-4 text-xs">
                                                    <span className="text-muted-foreground">{risk.owner}</span>
                                                    <Badge variant={risk.status === "Open" ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0">{risk.status}</Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && risks.length > 0 && (
                            <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground">No risks match the current filters.</CardContent></Card>
                        )}
                    </div>
                </div>
            )}

            <NewRiskModal open={isNewRiskModalOpen} onOpenChange={setIsNewRiskModalOpen} onSuccess={loadRisks} />
            <RiskDetailPanel riskId={selectedRiskId} onClose={() => setSelectedRiskId(null)} onSuccess={loadRisks} getRiskDetails={getRiskById} />
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
