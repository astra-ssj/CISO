"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCheck, Upload, AlertCircle, ShieldCheck, Siren } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
// Import stores
import { usePlaybookStore } from "@/lib/playbook-store";
import { getDynamicControls } from "@/lib/governance";
import { usePolicyStore } from "@/lib/policy-store";

export function AuditManager() {
    const { playbooks } = usePlaybookStore();
    const { policies } = usePolicyStore();

    // Derived state from dynamic engine
    const controls = getDynamicControls(policies, playbooks);

    // Internal state
    const [auditMode, setAuditMode] = useState(false);
    const [auditorMood, setAuditorMood] = useState(100);
    const [currentRequest, setCurrentRequest] = useState<typeof controls[0] | null>(null);
    const [selectedEvidence, setSelectedEvidence] = useState("");

    // Get all evidence across all resolved playbooks
    const availableEvidence = playbooks
        .flatMap(p => p.evidenceLog)
        .map(e => ({
            label: `${new Date(e.timestamp).toLocaleTimeString()} - ${e.message.substring(0, 30)}...`,
            value: e.message // Using message as ID/Value for simplicity
        }));

    // Mock Audit Sequence
    const startAudit = () => {
        setAuditMode(true);
        setAuditorMood(50); // Start skeptical
        nextChallenge();
    };

    const stopAudit = () => {
        setAuditMode(false);
        setCurrentRequest(null);
    };

    const [nextChallengeTrigger, setNextChallengeTrigger] = useState(0);
    const nextChallenge = () => setNextChallengeTrigger((t) => t + 1);

    useEffect(() => {
        if (nextChallengeTrigger === 0) return;
        const target = controls[Math.floor(Math.random() * controls.length)];
        const id = setTimeout(() => {
            setCurrentRequest(target);
            setSelectedEvidence("");
        }, 0);
        return () => clearTimeout(id);
    }, [nextChallengeTrigger, controls]);

    const handleEvidenceUpload = () => {
        if (!currentRequest) return;

        // Verification Logic
        let success = false;

        // If checking Incident Handling (IR-4), we need evidence from an Incident
        if (currentRequest.id === 'IR-4') {
            if (selectedEvidence && availableEvidence.some(e => e.value === selectedEvidence)) {
                success = true;
            }
        }
        // If checking Access Control (AC-1), we check if the policy exists (auto-verified largely)
        else if (currentRequest.id === 'AC-1' && currentRequest.status === 'COMPLIANT') {
            // For policies, pointing to the policy itself is the evidence
            success = true;
        }

        if (success) {
            setAuditorMood(prev => Math.min(100, prev + 25));
            setTimeout(nextChallenge, 1500); // Move to next
        } else {
            setAuditorMood(prev => Math.max(0, prev - 20)); // Wrong evidence!
        }
    };

    return (
        <Card className={cn(
            "transition-all duration-500 overflow-hidden h-full flex flex-col",
            auditMode ? "border-red-500/50 bg-red-950/10 shadow-[0_0_50px_rgba(220,38,38,0.1)]" : "bg-card/30 border-primary/10"
        )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        {auditMode ? <Siren className="h-5 w-5 text-red-500 animate-pulse" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
                        {auditMode ? "AUDIT PROTOCOL ACTIVE" : "Audit Preparedness"}
                    </CardTitle>
                    <CardDescription>
                        {auditMode ? "External Auditor is in the building." : "Simulate an unannounced ISO audit check."}
                    </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="audit-mode" checked={auditMode} onCheckedChange={(c) => c ? startAudit() : stopAudit()} />
                    <Label htmlFor="audit-mode" className={auditMode ? "text-red-400 font-bold" : "text-muted-foreground"}>
                        {auditMode ? "LIVE" : "SIM"}
                    </Label>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <AnimatePresence mode="wait">
                    {auditMode && currentRequest ? (
                        <motion.div
                            key="audit-active"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-6"
                        >
                            <div className="p-4 rounded-lg bg-background/50 border border-primary/20 relative overflow-hidden">
                                <div className="flex justify-between items-center mb-2 relative z-10">
                                    <span className="text-sm font-mono text-muted-foreground">AUDITOR REQUEST:</span>
                                    <Badge variant="outline" className="animate-pulse border-red-500 text-red-500">
                                        EVIDENCE REQUIRED
                                    </Badge>
                                </div>
                                <div className="text-xl font-bold text-foreground mb-4 relative z-10">
                                    {currentRequest.id}: {currentRequest.name}
                                </div>
                                <div className="text-xs text-muted-foreground mb-4 relative z-10">
                                    &quot;{currentRequest.description}&quot;
                                </div>

                                {/* Dynamic Status Display */}
                                <div className={cn(
                                    "p-2 mb-4 rounded text-xs flex gap-2 items-center",
                                    currentRequest.status === 'COMPLIANT'
                                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                                )}>
                                    {currentRequest.status === 'COMPLIANT' ? (
                                        <><ShieldCheck className="h-4 w-4" /> Control seemingly effective. Provide proof.</>
                                    ) : (
                                        <><AlertCircle className="h-4 w-4" /> Control Ineffective: {currentRequest.details || "Not found"}</>
                                    )}
                                </div>

                                {/* Evidence Selection (Dynamic) */}
                                {currentRequest.id === 'IR-4' && (
                                    <div className="mb-4 relative z-10 space-y-2">
                                        <Label className="text-xs">Select Chain of Custody Log</Label>
                                        <Select onValueChange={setSelectedEvidence} value={selectedEvidence}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Select relevant artifact..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableEvidence.map((e, i) => (
                                                    <SelectItem key={i} value={e.value} className="text-xs">
                                                        <span className="font-mono">{e.label}</span>
                                                    </SelectItem>
                                                ))}
                                                {availableEvidence.length === 0 && (
                                                    <SelectItem value="none" disabled>No Evidence Found in Locker</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="flex gap-3 relative z-10">
                                    <Button
                                        onClick={handleEvidenceUpload}
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                        disabled={currentRequest.status !== 'COMPLIANT'} // Can't prove what is broken
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        {currentRequest.status === 'COMPLIANT' ? "Submit Evidence" : "Fix Issues First"}
                                    </Button>
                                    <Button variant="outline" className="flex-1" onClick={nextChallenge}>
                                        Skip (Risk Penalty)
                                    </Button>
                                </div>

                                {/* Background noise */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -z-0" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-mono">
                                    <span>AUDITOR SATISFACTION</span>
                                    <span className={auditorMood < 50 ? "text-red-500" : "text-emerald-500"}>{auditorMood}%</span>
                                </div>
                                <Progress value={auditorMood} className={cn(
                                    "h-2",
                                    auditorMood < 30 ? "bg-red-900" : auditorMood < 70 ? "bg-amber-900" : "bg-emerald-900"
                                )} />
                                {auditorMood < 40 && (
                                    <p className="text-[10px] text-red-400 flex items-center gap-1 animate-pulse">
                                        <Siren className="h-3 w-3" /> MAJOR NON-CONFORMITY IMMINENT
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="audit-idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center p-6 text-center space-y-3 opacity-50 h-full min-h-[200px]"
                        >
                            <FileCheck className="h-12 w-12 text-muted-foreground" />
                            <p className="text-sm max-w-[200px]">
                                Ready to simulate an external audit against {controls.length} live controls.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
