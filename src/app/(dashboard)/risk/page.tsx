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
import { Building2, ShieldAlert, CheckCircle2, AlertTriangle, Search, Plus, FileText, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RiskPage() {
    const { vendors, addVendor, updateVendor } = useVendorStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

    // Mock Assessment State
    const [assessmentAnswers, setAssessmentAnswers] = useState({ dataAccess: 'low', criticality: 'low', gdpr: 'yes' });

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
                <h1 className="text-3xl font-bold tracking-tight text-white">Risk Register</h1>
                <p className="text-muted-foreground">Track, quantify, and mitigate enterprise and third-party risks.</p>
            </div>

            <Tabs defaultValue="enterprise" className="space-y-6">
                <TabsList className="bg-background/20 border border-primary/10">
                    <TabsTrigger value="enterprise">Enterprise Risk</TabsTrigger>
                    <TabsTrigger value="vendors">Vendor Risk Management (VRM)</TabsTrigger>
                </TabsList>

                {/* Enterprise Risk Tab (Legacy/Existing) */}
                <TabsContent value="enterprise" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="bg-card/30 border-primary/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Inherent Risk Score</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-500">72/100</div>
                                <p className="text-xs text-muted-foreground">+4 from last month</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-primary/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Open Risks</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">14</div>
                                <p className="text-xs text-muted-foreground">3 Critical, 5 High</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-card/30 border-primary/10">
                        <CardHeader><CardTitle>Top Enterprise Risks</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { id: 'R-01', title: 'Supply Chain Attack via NPM', score: 'Critical', trend: 'up' },
                                    { id: 'R-03', title: 'Legacy VPN Vulnerabilities', score: 'High', trend: 'stable' },
                                    { id: 'R-09', title: 'Shadow AI Usage', score: 'High', trend: 'up' },
                                    { id: 'R-14', title: 'Insufficient MFA Coverage', score: 'Medium', trend: 'down' },
                                ].map((risk) => (
                                    <div key={risk.id} className="flex items-center justify-between p-3 border border-border/40 rounded-lg bg-background/20">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">{risk.id}</Badge>
                                            <span className="font-medium">{risk.title}</span>
                                        </div>
                                        <Badge variant={risk.score === 'Critical' ? 'destructive' : risk.score === 'High' ? 'default' : 'secondary'}>
                                            {risk.score}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Vendor Risk Tab (New) */}
                <TabsContent value="vendors" className="space-y-4">
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
