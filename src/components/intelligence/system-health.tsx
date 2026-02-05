"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Server, Cpu, Router } from "lucide-react";

export function SystemHealthWidget() {
    return (
        <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-border/50">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    SYSTEM_HEALTH
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-4">

                {/* Metric 1: Active Agents */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Server className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-mono">ACTIVE_AGENTS</div>
                            <div className="text-lg font-bold">1,248</div>
                        </div>
                    </div>
                    <div className="text-[10px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        +12 NEW
                    </div>
                </div>

                <div className="h-[1px] bg-border/50 w-full" />

                {/* Metric 2: EPS */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Router className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-mono">EPS [AVG]</div>
                            <div className="text-lg font-bold">4,892</div>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-1 h-3 bg-blue-500/30 rounded-full" />
                        <div className="w-1 h-4 bg-blue-500/50 rounded-full" />
                        <div className="w-1 h-6 bg-blue-500 rounded-full" />
                        <div className="w-1 h-4 bg-blue-500/50 rounded-full" />
                        <div className="w-1 h-2 bg-blue-500/30 rounded-full" />
                    </div>
                </div>

                <div className="h-[1px] bg-border/50 w-full" />

                {/* Metric 3: Disconnected */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Cpu className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-mono">DISCONNECTED</div>
                            <div className="text-lg font-bold text-red-500">3</div>
                        </div>
                    </div>
                    <div className="text-[10px] text-red-500 font-mono">
                        CRITICAL
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
