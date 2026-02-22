"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Shield } from "lucide-react";
import { useComplianceStore } from "@/stores/compliance-store";
import { useEffect, useState } from "react";

export function ComplianceHeatmap() {
    const { controls, initialize, refreshStatus, overallScore } = useComplianceStore();
    const [selectedControl, setSelectedControl] = useState<typeof controls[0] | null>(null);

    // Initialize data on mount
    useEffect(() => {
        initialize();
        const interval = setInterval(refreshStatus, 5000);
        return () => clearInterval(interval);
    }, [initialize, refreshStatus]);

    return (
        <Card className="bg-card/30 border-primary/10 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    ISO 27001 Annex A Heatmap
                    <Badge variant="outline" className="ml-4 font-mono">
                        Score: {overallScore}%
                    </Badge>
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    LIVE MONITORING
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                    {controls.map((control, index) => (
                        <motion.div
                            key={control.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.02 }}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setSelectedControl(control)}
                            className={cn(
                                "aspect-square flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-all hover:shadow-lg relative overflow-hidden",
                                control.status === 'COMPLIANT' ? "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" :
                                    control.status === 'PARTIAL' ? "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20" :
                                        "bg-red-500/10 border-red-500/20 hover:bg-red-500/20"
                            )}
                        >
                            <span className="text-xs font-mono font-bold mb-1 z-10">{control.id}</span>
                            <div className="flex justify-center z-10">
                                {control.status === 'COMPLIANT' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                {control.status === 'PARTIAL' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                {control.status === 'NON_COMPLIANT' && <XCircle className="h-4 w-4 text-red-500" />}
                            </div>
                            <span className="text-[9px] text-muted-foreground mt-1 text-center line-clamp-2 leading-tight z-10 w-full px-1">
                                {control.name}
                            </span>

                            {/* Scanning effect overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-primary/5 to-transparent h-[200%] w-full animate-scan pointer-events-none opacity-20" />
                        </motion.div>
                    ))}
                </div>
            </CardContent>

            {/* Drill-down Dialog */}
            {selectedControl && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedControl(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card border border-primary/20 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span className="font-mono text-primary">{selectedControl.id}</span>
                                {selectedControl.name}
                            </h3>
                            <Badge className={
                                selectedControl.status === 'COMPLIANT' ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20' :
                                    selectedControl.status === 'PARTIAL' ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/20' :
                                        'bg-red-500/20 text-red-500 hover:bg-red-500/20'
                            }>
                                {selectedControl.status}
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-secondary/10 rounded-lg text-sm text-muted-foreground">
                                {selectedControl.description}
                            </div>

                            {selectedControl.failureReason && (
                                <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="font-bold mb-1">Control Failure Detected</div>
                                        {selectedControl.failureReason}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground mt-4">
                                <div className="bg-background/50 p-2 rounded">
                                    DOMAIN: {selectedControl.domain}
                                </div>
                                <div className="bg-background/50 p-2 rounded">
                                    EVIDENCE: {selectedControl.evidenceCount} items
                                </div>
                                <div className="bg-background/50 p-2 rounded col-span-2">
                                    LAST CHECK: {selectedControl.lastChecked.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-2">
                            <Button variant="ghost" onClick={() => setSelectedControl(null)}>Close</Button>
                            {selectedControl.status !== 'COMPLIANT' && (
                                <Button
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    onClick={() => {
                                        useComplianceStore.getState().fixControl(selectedControl.id);
                                        setSelectedControl(null);
                                    }}
                                >
                                    Initiate Remediation
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </Card>
    );
}
