"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVendorStore, Vendor, type RiskTier } from "@/lib/vendor-store";

interface AddVendorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddVendorDialog({ open, onOpenChange }: AddVendorDialogProps) {
    const { addVendor } = useVendorStore();
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [email, setEmail] = useState("");
    const [tier, setTier] = useState<RiskTier>("TIER_3_MEDIUM");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newVendor: Vendor = {
            id: `v-${Date.now()}`,
            name,
            serviceDescription: desc,
            contactEmail: email,
            tier,
            status: 'PENDING_ASSESSMENT',
            lastAssessmentDate: 'N/A',
            inherentRiskScore: 50, // Default start
        };

        addVendor(newVendor);

        // Reset and Close
        setName("");
        setDesc("");
        setEmail("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Onboard New Vendor</DialogTitle>
                    <DialogDescription>
                        Register a third-party entity for risk tracking. Initial status will be set to Pending Assessment.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="v-name">Vendor Name</Label>
                        <Input id="v-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Acme Cloud Corp" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="v-desc">Service Description</Label>
                        <Textarea id="v-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What data/access do they handle?" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="v-email">Contact Points</Label>
                        <Input id="v-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="security@vendor.com" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="v-tier">Provisional Risk Tier</Label>
                        <Select value={tier} onValueChange={(v) => setTier(v as RiskTier)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TIER_1_CRITICAL">Tier 1 - Critical (Data Access)</SelectItem>
                                <SelectItem value="TIER_2_HIGH">Tier 2 - High (Process Dependency)</SelectItem>
                                <SelectItem value="TIER_3_MEDIUM">Tier 3 - Medium (Support)</SelectItem>
                                <SelectItem value="TIER_4_LOW">Tier 4 - Low (Commodity)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Register Vendor</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
