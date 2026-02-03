"use client";

import React from "react";
import { SafeguardCell, Safeguard } from "./safeguard-cell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skull, Eye, Shield, Search, Zap, RotateCcw } from "lucide-react";

export interface ThreatRow {
    id: string;
    threat: string;
    description: string;
    severity: "High" | "Critical" | "Medium";
    identify: Safeguard[];
    protect: Safeguard[];
    detect: Safeguard[];
    respond: Safeguard[];
    recover: Safeguard[];
}

interface ThreatMatrixProps {
    data: ThreatRow[];
}

export function ThreatMatrix({ data }: ThreatMatrixProps) {
    const nistFunctions = [
        { key: 'identify', label: 'Identify', icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { key: 'protect', label: 'Protect', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { key: 'detect', label: 'Detect', icon: Search, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { key: 'respond', label: 'Respond', icon: Zap, color: 'text-red-400', bg: 'bg-red-500/10' },
        { key: 'recover', label: 'Recover', icon: RotateCcw, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    ];

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50">
            <table className="w-full min-w-[1200px] border-collapse">
                <thead>
                    <tr>
                        <th className="p-4 text-left w-[250px] border-b border-r border-zinc-800 bg-zinc-900/50 sticky left-0 z-10">
                            <div className="flex items-center gap-2">
                                <Skull className="w-4 h-4 text-zinc-400" />
                                <span className="font-semibold text-zinc-200">Threat Scenario</span>
                            </div>
                        </th>
                        {nistFunctions.map(fn => (
                            <th key={fn.key} className={cn("p-4 text-left border-b border-zinc-800 min-w-[180px]", fn.bg)}>
                                <div className="flex items-center gap-2">
                                    <fn.icon className={cn("w-4 h-4", fn.color)} />
                                    <span className={cn("font-semibold", fn.color)}>{fn.label}</span>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.id} className="group hover:bg-zinc-900/30 transition-colors">
                            <td className="p-4 border-b border-r border-zinc-800 bg-zinc-950 sticky left-0 group-hover:bg-zinc-900 transition-colors">
                                <div className="space-y-1">
                                    <div className="font-medium text-zinc-200 flex items-center justify-between">
                                        {row.threat}
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] px-1 h-5",
                                            row.severity === 'Critical' ? "border-red-500/50 text-red-500" :
                                                row.severity === 'High' ? "border-amber-500/50 text-amber-500" : "border-blue-500/50 text-blue-500"
                                        )}>
                                            {row.severity}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{row.description}</p>
                                </div>
                            </td>
                            {nistFunctions.map(fn => (
                                <td key={fn.key} className="p-2 border-b border-zinc-800 align-top">
                                    <div className="flex flex-col gap-2">
                                        {/* @ts-ignore - Dynamic key access */}
                                        {row[fn.key]?.length > 0 ? (
                                            /* @ts-ignore */
                                            row[fn.key].map((sg: Safeguard) => (
                                                <SafeguardCell key={sg.id} safeguard={sg} />
                                            ))
                                        ) : (
                                            <SafeguardCell emptyText="Gap" />
                                        )}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
