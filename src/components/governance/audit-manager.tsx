"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Upload, AlertCircle, ShieldCheck, Siren } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function AuditManager() {
    const [auditActive, setAuditActive] = useState(false);
    const [satisfaction, setSatisfaction] = useState(65);
    const [currentChallenge, setCurrentChallenge] = useState<string | null>(null);

    const toggleAudit = (enabled: boolean) => {
        setAuditActive(enabled);
        if (enabled) {
            setSatisfaction(40); // Initial auditor skepticism
            setCurrentChallenge("A.12.3 Backup & Redundancy");
        } else {
            setCurrentChallenge(null);
        }
    };

    const handleUpload = () => {
        // Simulate evidence upload
        const newScore = Math.min(100, satisfaction + 15);
        setSatisfaction(newScore);
        if (newScore >= 95) {
            setCurrentChallenge("AUDIT PASSED");
        } else {
            // Cycle to next mock challenge
            setTimeout(() => {
                setCurrentChallenge("A.9.2 User Provisioning Logs");
            }, 1000);
        }
    };

    return (
        <Card className={cn(
            "transition-all duration-500 overflow-hidden",
            auditActive ? "border-red-500/50 bg-red-950/20 shadow-[0_0_50px_rgba(220,38,38,0.1)]" : "bg-card/30 border-primary/10"
        )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        {auditActive ? <Siren className="h-5 w-5 text-red-500 animate-pulse" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
                        {auditActive ? "AUDIT PROTOCOL ACTIVE" : "Audit Preparedness"}
                    </CardTitle>
                    <CardDescription>
                        {auditActive ? "External Auditor is requesting evidence." : "Simulate an unannounced audit."}
                    </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="audit-mode" checked={auditActive} onCheckedChange={toggleAudit} />
                    <Label htmlFor="audit-mode" className={auditActive ? "text-red-400 font-bold" : "text-muted-foreground"}>
                        {auditActive ? "LIVE" : "SIM"}
                    </Label>
                </div>
            </CardHeader>
            <CardContent>
                <AnimatePresence mode="wait">
                    {auditActive ? (
                        <motion.div
                            key="audit-active"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-6"
                        >
                            <div className="p-4 rounded-lg bg-background/50 border border-primary/20">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-mono text-muted-foreground">AUDITOR REQUEST:</span>
                                    <Badge variant="outline" className="animate-pulse border-red-500 text-red-500">REQUIRED NOW</Badge>
                                </div>
                                <div className="text-xl font-bold text-foreground mb-4">
                                    {currentChallenge}
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={handleUpload} className="flex-1 bg-primary hover:bg-primary/90">
                                        <Upload className="mr-2 h-4 w-4" /> Upload Artifact
                                    </Button>
                                    <Button variant="outline" className="flex-1">
                                        Link Policy
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-mono">
                                    <span>AUDITOR SATISFACTION</span>
                                    <span>{satisfaction}%</span>
                                </div>
                                <Progress value={satisfaction} className={cn(
                                    "h-2",
                                    satisfaction < 50 ? "bg-red-900" : "bg-emerald-900"
                                )} />
                                {satisfaction < 50 && (
                                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> Risk of Major Non-Conformity
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="audit-idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center p-6 text-center space-y-3 opacity-50"
                        >
                            <FileCheck className="h-12 w-12 text-muted-foreground" />
                            <p className="text-sm">Ready to simulate 60+ audit scenarios.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
