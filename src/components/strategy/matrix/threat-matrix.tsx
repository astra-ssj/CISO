"use client";

import React, { useState } from "react";
import { SafeguardCell, Safeguard } from "./safeguard-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skull, Eye, Shield, Search, Zap, RotateCcw, Filter, LayoutGrid, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    const [filter, setFilter] = useState<"all" | "critical" | "gaps">("all");
    const [xAxis, setXAxis] = useState<'function' | 'severity' | 'status'>('function');
    const [yAxis, setYAxis] = useState<'scenario' | 'asset'>('scenario');

    // Calculate Global Health Score
    // (Mock logic: Average of all safeguards across all rows)
    const allSafeguards = data.flatMap(r => [
        ...r.identify, ...r.protect, ...r.detect, ...r.respond, ...r.recover
    ]);
    const healthScore = Math.round(
        allSafeguards.reduce((acc, s) => acc + s.score, 0) / allSafeguards.length
    );

    const filteredData = data.filter(row => {
        if (filter === "critical") return row.severity === "Critical";
        if (filter === "gaps") {
            // Show only rows that have empty arrays in any column
            return [row.identify, row.protect, row.detect, row.respond, row.recover].some(arr => arr.length === 0);
        }
        return true;
    });

    const nistFunctions = [
        { key: 'identify', label: 'IDENTIFY', icon: Eye, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
        { key: 'protect', label: 'PROTECT', icon: Shield, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
        { key: 'detect', label: 'DETECT', icon: Search, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
        { key: 'respond', label: 'RESPOND', icon: Zap, color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' },
        { key: 'recover', label: 'RECOVER', icon: RotateCcw, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
    ];

    return (
        <div className="space-y-4">
            {/* Control Bar */}
            <div className="flex items-center justify-between p-1">
                <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                    {/* View Configuration */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 px-2">
                                <Settings2 className="w-3.5 h-3.5" />
                                Configure View
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 bg-zinc-900 border-zinc-800">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">X-Axis Dimension</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setXAxis('function')}>NIST Function</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setXAxis('severity')}>Severity Level</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Y-Axis Dimension</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setYAxis('scenario')}>Threat Scenario</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setYAxis('asset')}>Asset Class</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="w-px h-4 bg-zinc-800 mx-1" />

                    <Button
                        variant={filter === "all" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("all")}
                        className="h-7 text-xs"
                    >
                        <LayoutGrid className="w-3 h-3 mr-1.5" /> All Scenarios
                    </Button>
                    <Button
                        variant={filter === "critical" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("critical")}
                        className="h-7 text-xs text-red-400 hover:text-red-300"
                    >
                        <AlertBadge count={data.filter(r => r.severity === 'Critical').length} />
                        Critical Only
                    </Button>
                    <Button
                        variant={filter === "gaps" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("gaps")}
                        className="h-7 text-xs text-amber-400 hover:text-amber-300"
                    >
                        <Filter className="w-3 h-3 mr-1.5" /> Coverage Gaps
                    </Button>
                </div>

                <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-full">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Defense Posture</span>
                    <div className="flex items-baseline gap-1">
                        <span className={cn(
                            "text-lg font-bold font-mono",
                            healthScore > 80 ? "text-emerald-400" : "text-amber-400"
                        )}>{healthScore}/100</span>
                    </div>
                </div>
            </div>

            {/* The Grid */}
            <div className="w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1400px] border-collapse text-sm">
                        <thead className="bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-20">
                            <tr>
                                <th className="p-4 text-left w-[300px] border-b border-r border-zinc-800/50 sticky left-0 z-30 bg-zinc-900">
                                    <div className="flex items-center gap-2 text-zinc-400 pl-2">
                                        <Skull className="w-4 h-4" />
                                        <span className="font-semibold tracking-wide text-xs uppercase">Threat Scenario</span>
                                    </div>
                                </th>
                                {nistFunctions.map(fn => (
                                    <th key={fn.key} className={cn("py-3 px-4 text-left border-b border-zinc-800/50 min-w-[200px]", fn.bg)}>
                                        <div className="flex items-center gap-2 justify-center opacity-90">
                                            <fn.icon className={cn("w-3.5 h-3.5", fn.color)} />
                                            <span className={cn("font-bold text-[10px] tracking-widest", fn.color)}>{fn.label}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            <AnimatePresence>
                                {filteredData.map((row, idx) => (
                                    <motion.tr
                                        key={row.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-zinc-900/40 transition-colors"
                                    >
                                        <td className="p-0 border-r border-zinc-800/50 sticky left-0 z-10 bg-zinc-950 group-hover:bg-zinc-900/40 transition-colors">
                                            <div className="h-full w-full p-4 relative">
                                                <div className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-1",
                                                    row.severity === 'Critical' ? "bg-red-500" :
                                                        row.severity === 'High' ? "bg-amber-500" : "bg-blue-500"
                                                )} />
                                                <div className="pl-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-zinc-200">{row.threat}</span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 max-w-[260px]">
                                                        {row.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        {nistFunctions.map(fn => (
                                            <td key={fn.key} className="p-3 align-top border-l border-zinc-800/30">
                                                <div className="flex flex-col gap-1.5 min-h-[60px]">
                                                    {/* @ts-ignore */}
                                                    {row[fn.key]?.length > 0 ? (
                                                        /* @ts-ignore */
                                                        row[fn.key].map((sg: Safeguard) => (
                                                            <SafeguardCell key={sg.id} safeguard={sg} />
                                                        ))
                                                    ) : (
                                                        <SafeguardCell emptyText="" compact />
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function AlertBadge({ count }: { count: number }) {
    if (count === 0) return null;
    return (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500/20 text-[9px] font-bold text-red-500 mr-1.5">
            {count}
        </span>
    );
}
