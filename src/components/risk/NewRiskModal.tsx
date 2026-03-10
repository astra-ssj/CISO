"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRisk } from "@/lib/risk/actions";

interface NewRiskModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function NewRiskModal({ open, onOpenChange, onSuccess }: NewRiskModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Operational",
        owner: "",
        likelihood: 3,
        impact: 3,
    });

    const inherentScore = formData.likelihood * formData.impact;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createRisk({
                ...formData,
                status: "Open",
                reviewDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Review 1 year from now by default
            });
            onSuccess();
            onOpenChange(false);
            // reset forms
            setFormData({
                title: "",
                description: "",
                category: "Operational",
                owner: "",
                likelihood: 3,
                impact: 3,
            });
        } catch (error) {
            console.error("Failed to create risk", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Register New Risk</DialogTitle>
                    <DialogDescription>
                        Enter details to add a new risk to the enterprise register.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                required
                                placeholder="e.g., Unpatched third-party dependencies"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                required
                                placeholder="Describe the risk scenario..."
                                className="h-20"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
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
                            <label className="text-sm font-medium">Risk Owner</label>
                            <Input
                                required
                                placeholder="e.g., Jane Doe"
                                value={formData.owner}
                                onChange={e => setFormData({ ...formData, owner: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Likelihood (1-5)</label>
                            <Select value={String(formData.likelihood)} onValueChange={v => setFormData({ ...formData, likelihood: Number(v) })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Impact (1-5)</label>
                            <Select value={String(formData.impact)} onValueChange={v => setFormData({ ...formData, impact: Number(v) })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 p-4 bg-muted/30 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Inherent Risk Score</p>
                                <p className="text-xs text-muted-foreground">Likelihood x Impact</p>
                            </div>
                            <p className="text-2xl font-bold">{inherentScore}</p>
                        </div>

                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create Risk"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
