"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVendorRiskStore, type VendorCategory } from "@/lib/vendor-risk-store";

interface AddVendorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddVendorDialog({ open, onOpenChange }: AddVendorDialogProps) {
    const { addVendor } = useVendorRiskStore();
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [email, setEmail] = useState("");
    const [category, setCategory] = useState<VendorCategory>("OTHER");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        addVendor({
            name,
            category,
            description: desc,
            status: 'PENDING',
            riskScore: 50,
            dataAccess: ['NONE'],
            complianceCertifications: [],
            contractExpiry: 'TBD',
            lastAssessment: 'Pending',
            contactName: name,
            contactEmail: email,
            notes: '',
        });

        setName(""); setDesc(""); setEmail("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Onboard New Vendor</DialogTitle>
                    <DialogDescription>
                        Register a third-party entity for risk tracking. Initial status: Pending.
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
                        <Label htmlFor="v-email">Contact Email</Label>
                        <Input id="v-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="security@vendor.com" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="v-cat">Category</Label>
                        <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CLOUD_INFRASTRUCTURE">Cloud Infrastructure</SelectItem>
                                <SelectItem value="SAAS">SaaS</SelectItem>
                                <SelectItem value="SECURITY">Security</SelectItem>
                                <SelectItem value="DATA_PROCESSING">Data Processing</SelectItem>
                                <SelectItem value="CONSULTING">Consulting</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
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
