"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Shield, Server, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BudgetState {
    appSec: number;
    infrastructure: number;
    governance: number;
    incidentResponse: number;
}

interface BudgetControlsProps {
    budget: BudgetState;
    onChange: (newBudget: BudgetState) => void;
}

export function BudgetControls({ budget, onChange }: BudgetControlsProps) {

    const categories = [
        { key: 'appSec', label: 'Application Security', icon: Shield, color: 'text-blue-500', desc: "SAST/DAST, Bug Bounty, PenTesting" },
        { key: 'infrastructure', label: 'Cloud & Infra', icon: Server, color: 'text-emerald-500', desc: "Firewalls, WAF, Cloud Defense" },
        { key: 'governance', label: 'GRC & Compliance', icon: FileText, color: 'text-purple-500', desc: "Audits, Policy Tools, Staffing" },
        { key: 'incidentResponse', label: 'Incident Response', icon: Zap, color: 'text-amber-500', desc: "SOC Tools, Retainers, SIEM" },
    ] as const;

    const handleChange = (key: keyof BudgetState, value: number[]) => {
        onChange({ ...budget, [key]: value[0] });
    };

    const formatCurrency = (val: number) => `$${(val / 1000)}k`;

    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    Investment Allocation
                    <span className="text-xs font-normal text-muted-foreground ml-auto bg-zinc-800 px-2 py-1 rounded">
                        Total: ${(Object.values(budget).reduce((a, b) => a + b, 0) / 1000).toFixed(0)}k
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                {categories.map((cat) => (
                    <div key={cat.key} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn("p-1.5 rounded-md bg-zinc-950 border border-zinc-800", cat.color)}>
                                    <cat.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <Label className="text-base font-medium">{cat.label}</Label>
                                    <p className="text-xs text-muted-foreground">{cat.desc}</p>
                                </div>
                            </div>
                            <div className="text-right font-mono font-bold text-zinc-200">
                                {formatCurrency(budget[cat.key as keyof BudgetState])}
                            </div>
                        </div>
                        <Slider
                            defaultValue={[budget[cat.key as keyof BudgetState]]}
                            max={500000}
                            step={10000}
                            onValueChange={(val) => handleChange(cat.key as keyof BudgetState, val)}
                            className={cn("py-2",
                                cat.key === 'appSec' && "[&>.bg-primary]:bg-blue-500",
                                cat.key === 'infrastructure' && "[&>.bg-primary]:bg-emerald-500",
                                cat.key === 'governance' && "[&>.bg-primary]:bg-purple-500",
                                cat.key === 'incidentResponse' && "[&>.bg-primary]:bg-amber-500",
                            )}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
