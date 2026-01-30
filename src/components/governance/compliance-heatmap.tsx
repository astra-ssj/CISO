"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Shield } from "lucide-react";

interface ControlType {
    id: string;
    name: string;
    status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
    domain: string;
}

const ANNEX_A_CONTROLS: ControlType[] = [
    { id: 'A.5.1', name: 'Policies for InfoSec', status: 'COMPLIANT', domain: 'Policies' },
    { id: 'A.5.10', name: 'Acceptable Use', status: 'COMPLIANT', domain: 'Policies' },
    { id: 'A.6.1', name: 'Internal Organization', status: 'PARTIAL', domain: 'Organization' },
    { id: 'A.7.2', name: 'During Employment', status: 'NON_COMPLIANT', domain: 'HR Security' },
    { id: 'A.8.1', name: 'Responsibility for Assets', status: 'COMPLIANT', domain: 'Asset Mgmt' },
    { id: 'A.9.1', name: 'Access Control Policy', status: 'COMPLIANT', domain: 'Access Control' },
    { id: 'A.9.2', name: 'User Access Mgmt', status: 'PARTIAL', domain: 'Access Control' },
    { id: 'A.10.1', name: 'Cryptography Controls', status: 'COMPLIANT', domain: 'Cryptography' },
    { id: 'A.11.1', name: 'Secure Areas', status: 'COMPLIANT', domain: 'Physical' },
    { id: 'A.12.1', name: 'Ops Procedures', status: 'PARTIAL', domain: 'Operations' },
    { id: 'A.12.3', name: 'Backup', status: 'NON_COMPLIANT', domain: 'Operations' },
    { id: 'A.13.1', name: 'Network Controls', status: 'COMPLIANT', domain: 'Comms Security' },
    { id: 'A.14.2', name: 'Secure Development', status: 'PARTIAL', domain: 'DevSecOps' },
    { id: 'A.15.1', name: 'Supplier Policy', status: 'COMPLIANT', domain: 'Supplier Relationships' },
    { id: 'A.16.1', name: 'Incident Mgmt', status: 'COMPLIANT', domain: 'Incident Mgmt' },
    { id: 'A.17.1', name: 'Continuity Planning', status: 'NON_COMPLIANT', domain: 'BCP/DR' },
];

export function ComplianceHeatmap() {
    return (
        <Card className="bg-card/30 border-primary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    ISO 27001 Annex A Heatmap
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                    {ANNEX_A_CONTROLS.map((control, index) => (
                        <motion.div
                            key={control.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                            className={cn(
                                "aspect-square flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-all hover:shadow-lg",
                                control.status === 'COMPLIANT' ? "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" :
                                    control.status === 'PARTIAL' ? "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20" :
                                        "bg-red-500/10 border-red-500/20 hover:bg-red-500/20"
                            )}
                        >
                            <span className="text-xs font-mono font-bold mb-1">{control.id}</span>
                            <div className="flex justify-center">
                                {control.status === 'COMPLIANT' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                {control.status === 'PARTIAL' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                {control.status === 'NON_COMPLIANT' && <XCircle className="h-4 w-4 text-red-500" />}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 text-center line-clamp-2 leading-tight">
                                {control.name}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
