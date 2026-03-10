"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { updateRisk, deleteRisk } from "@/lib/risk/actions";
import { Badge } from "@/components/ui/badge";

interface RiskDetailPanelProps {
    riskId: string | null;
    onClose: () => void;
    onSuccess: () => void;
    getRiskDetails: (id: string) => Promise<any>;
}

export function RiskDetailPanel({ riskId, onClose, onSuccess, getRiskDetails }: RiskDetailPanelProps) {
    const [risk, setRisk] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (riskId) {
            setLoading(true);
            getRiskDetails(riskId).then(data => {
                setRisk(data);
                setLoading(false);
            });
        } else {
            setRisk(null);
        }
    }, [riskId, getRiskDetails]);

    const handleChange = (field: string, value: any) => {
        setRisk((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!risk) return;
        setSaving(true);
        try {
            await updateRisk(risk.id, {
                title: risk.title,
                description: risk.description,
                category: risk.category,
                owner: risk.owner,
                status: risk.status,
                treatmentPlan: risk.treatmentPlan,
                likelihood: risk.likelihood,
                impact: risk.impact,
            });
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!risk) return;
        if (confirm("Are you sure you want to delete this risk?")) {
            await deleteRisk(risk.id);
            onSuccess();
            onClose();
        }
    };

    if (!riskId) return null;

    return (
        <Sheet open={!!riskId} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Risk Details</SheetTitle>
                    <SheetDescription>View and edit the risk details directly below.</SheetDescription>
                </SheetHeader>

                {loading ? (
                    <div className="py-12 text-center text-muted-foreground">Loading...</div>
                ) : risk ? (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input value={risk.title} onChange={e => handleChange("title", e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea className="h-24" value={risk.description} onChange={e => handleChange("description", e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <Select value={risk.category} onValueChange={v => handleChange("category", v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Operational">Operational</SelectItem>
                                            <SelectItem value="Technical">Technical</SelectItem>
                                            <SelectItem value="Compliance">Compliance</SelectItem>
                                            <SelectItem value="Strategic">Strategic</SelectItem>
                                            <SelectItem value="ThirdParty">Third Party</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select value={risk.status} onValueChange={v => handleChange("status", v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Open">Open</SelectItem>
                                            <SelectItem value="Mitigating">Mitigating</SelectItem>
                                            <SelectItem value="Accepted">Accepted</SelectItem>
                                            <SelectItem value="Closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Treatment Plan</label>
                                <Textarea className="h-24" placeholder="Mitigation strategy..." value={risk.treatmentPlan || ""} onChange={e => handleChange("treatmentPlan", e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Owner</label>
                                    <Input value={risk.owner} onChange={e => handleChange("owner", e.target.value)} />
                                </div>

                                <div className="p-4 bg-muted/30 rounded-lg flex flex-col justify-center">
                                    <p className="text-sm font-medium">Inherent Score</p>
                                    <p className="text-2xl font-bold">{risk.likelihood * risk.impact}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Likelihood (1-5)</label>
                                    <Select value={String(risk.likelihood)} onValueChange={v => handleChange("likelihood", Number(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Impact (1-5)</label>
                                    <Select value={String(risk.impact)} onValueChange={v => handleChange("impact", Number(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                            <Button variant="destructive" onClick={handleDelete}>Delete Risk</Button>
                            <div className="space-x-2">
                                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                            </div>
                        </div>

                        <div className="pt-6 border-t">
                            <h3 className="text-sm font-semibold mb-4">Risk History Log</h3>
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                {risk.history && risk.history.length > 0 ? (
                                    <div className="space-y-4">
                                        {risk.history.map((h: any) => (
                                            <div key={h.id} className="text-sm border-l-2 border-primary/50 pl-4 py-1">
                                                <p className="text-xs text-muted-foreground">{new Date(h.changedAt).toLocaleString()}</p>
                                                <p>
                                                    Changed <Badge variant="outline" className="text-[10px] uppercase font-mono">{h.field}</Badge> from <span className="line-through opacity-70">{h.oldValue || "empty"}</span> to <span className="font-medium text-foreground">{h.newValue || "empty"}</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No historical changes recorded.</p>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
