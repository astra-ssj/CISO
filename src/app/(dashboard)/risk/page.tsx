"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVendorStore, Vendor, RiskTier } from "@/lib/vendor-store";
import { useAppSecStore } from "@/lib/appsec-store";
import { usePlaybookStore } from "@/lib/playbook-store";
import { Building2, ShieldAlert, CheckCircle2, AlertTriangle, Search, Plus, FileText, BarChart3, Lock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RiskPage() {
    const { vendors, addVendor, updateVendor } = useVendorStore();
    const { findings } = useAppSecStore();
    const { playbooks } = usePlaybookStore();

    // Vendor State
    const [searchTerm, setSearchTerm] = useState("");
    const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const [assessmentAnswers, setAssessmentAnswers] = useState({ dataAccess: 'low', criticality: 'low', gdpr: 'yes' });

    // Aggregations
    const appSecStats = {
        critical: findings.filter(f => f.severity === 'CRITICAL').length,
        high: findings.filter(f => f.severity === 'HIGH').length,
        total: findings.length
    };

    const activeIncidents = playbooks.filter(p => p.status === 'ACTIVE');

    const incidentRisks = activeIncidents.map(inc => ({
        id: `OP-RISK-${inc.id}`,
        title: `Active Incident: ${inc.title}`,
        score: inc.severity === 'CRITICAL' ? 'Critical' : 'High',
        origin: 'OPERATIONAL'
    }));

    const technicalRisks = findings.filter(f => ['CRITICAL', 'HIGH'].includes(f.severity)).map(f => ({
        id: f.id.split('-')[0] + '-' + f.id.split('-')[1], // Short ID
        title: f.description,
        score: f.severity === 'CRITICAL' ? 'Critical' : 'High',
        origin: 'TECHNICAL'
    }));

    // Vendor Risks (High Tier only)
    const vendorRisks = vendors.filter(v => ['TIER_1_CRITICAL', 'TIER_2_HIGH'].includes(v.tier)).map(v => ({
        id: v.id,
        title: `High Risk Vendor: ${v.name}`,
        score: v.tier === 'TIER_1_CRITICAL' ? 'Critical' : 'High',
        origin: 'THIRD_PARTY'
    }));

    const allRisks = [...incidentRisks, ...technicalRisks, ...vendorRisks];

    // Filter Vendors
    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.serviceDescription.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRunAssessment = () => {
        if (!selectedVendorId) return;

        // Simple logic for simulation
        let score = 20; // Base score
        if (assessmentAnswers.dataAccess === 'high') score += 40;
        if (assessmentAnswers.criticality === 'critical') score += 30;
        if (assessmentAnswers.gdpr === 'no') score += 10;

        // Calc Tier
        let tier: RiskTier = 'TIER_4_LOW';
        if (score > 80) tier = 'TIER_1_CRITICAL';
        else if (score > 60) tier = 'TIER_2_HIGH';
        else if (score > 40) tier = 'TIER_3_MEDIUM';

        updateVendor(selectedVendorId, {
            inherentRiskScore: score,
            tier: tier,
            lastAssessmentDate: new Date().toISOString().split('T')[0],
            status: 'ACTIVE'
        });

        setIsAssessModalOpen(false);
        setSelectedVendorId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Risk Register</h1>
                        <p className="text-muted-foreground">Unified view of Technical, Operational, and Third-Party Risks.</p>
                    </div>
                    {/* Live Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <ActivityIcon />
                        <span className="text-xs font-medium text-amber-500">Live Risk Feed</span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="register" className="space-y-6">
                <TabsList className="bg-background/20 border border-primary/10">
                    <TabsTrigger value="register">Unified Risk View</TabsTrigger>
                    <TabsTrigger value="vendors">Vendor Risk Management (VRM)</TabsTrigger>
                </TabsList>

                {/* Unified Register Tab */}
                <TabsContent value="register" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Summary Cards */}
                        <Card className="bg-card/30 border-primary/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Technical Debt Impact</CardTitle>
                                <Lock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-500">{appSecStats.critical} Critical</div>
                                <p className="text-xs text-muted-foreground">From {appSecStats.total} total findings</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-primary/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Operational Instability</CardTitle>
                                <Flame className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-500">{activeIncidents.length} Active</div>
                                <p className="text-xs text-muted-foreground">Incidents currently in War Room</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-primary/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Open Risks</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{allRisks.length}</div>
                                <p className="text-xs text-muted-foreground">Across all domains</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-card/30 border-primary/10">
                        <CardHeader><CardTitle>Active Enterprise Risks</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                {allRisks.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50 text-emerald-500" />
                                        <p>No Critical/High risks detected. Systems nominal.</p>
                                    </div>
                                ) : (
                                    allRisks.map((risk, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border border-border/40 rounded-lg bg-background/20 hover:bg-background/40 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className={cn(
                                                    "w-24 justify-center",
                                                    risk.origin === 'TECHNICAL' ? 'border-blue-500/30 text-blue-500' :
                                                        risk.origin === 'OPERATIONAL' ? 'border-red-500/30 text-red-500' :
                                                            'border-purple-500/30 text-purple-500'
                                                )}>
                                                    {risk.origin}
                                                </Badge>
                                                <div>
                                                    <span className="font-medium block">{risk.title}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{risk.id}</span>
                                                </div>
                                            </div>
                                            <Badge variant={risk.score === 'Critical' ? 'destructive' : 'secondary'}>
                                                {risk.score}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Vendor Risk Tab (Existing Logic) */}
                <TabsContent value="vendors" className="space-y-4">
                    {/* ... Existing Vendor UI ... */}
                    <div className="flex justify-between items-center">
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search vendors..."
                                className="pl-8 bg-background/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add/Onboard Vendor
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredVendors.map(vendor => (
                            <Card key={vendor.id} className="bg-card/30 border-primary/10 hover:border-primary/30 transition-all">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Building2 className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{vendor.name}</CardTitle>
                                                <CardDescription className="text-xs">{vendor.tier.replace(/_/g, ' ')}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            vendor.status === 'ACTIVE' ? "border-emerald-500 text-emerald-500" : "border-amber-500 text-amber-500"
                                        )}>
                                            {vendor.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between py-1 border-b border-border/30">
                                            <span className="text-muted-foreground">Inherent Risk:</span>
                                            <span className={cn(
                                                "font-mono font-bold",
                                                vendor.inherentRiskScore > 80 ? "text-red-500" :
                                                    vendor.inherentRiskScore > 50 ? "text-amber-500" : "text-emerald-500"
                                            )}>{vendor.inherentRiskScore}/100</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-border/30">
                                            <span className="text-muted-foreground">Last Assessment:</span>
                                            <span>{vendor.lastAssessmentDate}</span>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            className="w-full mt-2 h-8 text-xs"
                                            onClick={() => {
                                                setSelectedVendorId(vendor.id);
                                                setIsAssessModalOpen(true);
                                            }}
                                        >
                                            <FileText className="mr-2 h-3 w-3" />
                                            {vendor.status === 'PENDING_ASSESSMENT' ? 'Start Assessment' : 'Re-Assess Compliance'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Assessment Modal */}
            <Dialog open={isAssessModalOpen} onOpenChange={setIsAssessModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Vendor Risk Assessment</DialogTitle>
                        <DialogDescription>Evaluate the inherent risk of this third-party relationship.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Data Access Level</Label>
                            <Select
                                value={assessmentAnswers.dataAccess}
                                onValueChange={(v) => setAssessmentAnswers({ ...assessmentAnswers, dataAccess: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">No PII/Sensitive Data</SelectItem>
                                    <SelectItem value="medium">Internal Non-Sensitive</SelectItem>
                                    <SelectItem value="high">Sensitive PII / Customer Data</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Operational Criticality</Label>
                            <Select
                                value={assessmentAnswers.criticality}
                                onValueChange={(v) => setAssessmentAnswers({ ...assessmentAnswers, criticality: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Substitute Easily Available</SelectItem>
                                    <SelectItem value="critical">Single Point of Failure</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>GDPR Compliant?</Label>
                            <Select
                                value={assessmentAnswers.gdpr}
                                onValueChange={(v) => setAssessmentAnswers({ ...assessmentAnswers, gdpr: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes (DPA Signed)</SelectItem>
                                    <SelectItem value="no">No / Unknown</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssessModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleRunAssessment}>Complete Assessment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ActivityIcon() {
    return (
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
    );
}
