"use client";

import React, { useState } from "react";
import { StrategyPyramid, StrategyLevel } from "@/components/strategy/strategy-pyramid";
import { AlignmentView, OKR } from "@/components/strategy/alignment-view";
import { ExecutiveBriefLayout } from "@/components/executive/executive-brief-layout";

// MOCK DATA Hierarchy
const MOCK_STRATEGY: OKR[] = [
    {
        id: "okr-1",
        objective: "Achieve Zero Trust Architecture",
        progress: 65,
        status: "on-track",
        kpis: [
            {
                id: "kpi-1",
                name: "Identity-Aware Proxy Adoption",
                target: "95%",
                current: "78%",
                status: "warning",
                metrics: [
                    { id: "m-1", name: "Apps behind IAP", value: "45/120", trend: "up", status: "warning" },
                    { id: "m-2", name: "Legacy VPN Users", value: "240", trend: "down", status: "healthy" }
                ]
            },
            {
                id: "kpi-2",
                name: "Device Trust Coverage",
                target: "100%",
                current: "92%",
                status: "healthy",
                metrics: [
                    { id: "m-3", name: "Unmanaged Devices Blocked", value: "12/day", trend: "flat", status: "healthy" },
                    { id: "m-4", name: "CrowdStrike Install Rate", value: "99.8%", trend: "up", status: "healthy" }
                ]
            }
        ]
    },
    {
        id: "okr-2",
        objective: "Reduce Mean Time to Remediate (MTTR)",
        progress: 40,
        status: "at-risk",
        kpis: [
            {
                id: "kpi-3",
                name: "Critical Vuln Patch Velocity",
                target: "48 hours",
                current: "72 hours",
                status: "critical",
                metrics: [
                    { id: "m-5", name: "Open Critical vulns > 48h", value: "8", trend: "up", status: "critical" },
                    { id: "m-6", name: "Patch Deployment Success %", value: "88%", trend: "down", status: "warning" }
                ]
            }
        ]
    },
    {
        id: "okr-3",
        objective: "Secure Cloud Transformation",
        progress: 85,
        status: "on-track",
        kpis: [
            {
                id: "kpi-4",
                name: "Cloud Configuration Compliance",
                target: "100%",
                current: "98%",
                status: "healthy",
                metrics: []
            }
        ]
    }
];

export default function StrategyPage() {
    const [selectedLevel, setSelectedLevel] = useState<StrategyLevel>("okr");

    // Calculate counts
    const counts = {
        okr: MOCK_STRATEGY.length,
        kpi: MOCK_STRATEGY.reduce((acc, okr) => acc + okr.kpis.length, 0),
        metric: MOCK_STRATEGY.reduce((acc, okr) => acc + okr.kpis.reduce((kAcc, kpi) => kAcc + kpi.metrics.length, 0), 0)
    };

    return (
        <ExecutiveBriefLayout presenter="Strategist" date="Annual Strategy Alignment">
            <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)] min-h-[600px] gap-8">

                {/* Left: The Pyramid (Navigation) */}
                <div className="lg:w-1/2 h-full bg-zinc-900/20 rounded-xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-4 left-4 z-20">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Strategy Pyramid</h2>
                        <p className="text-zinc-500 text-sm">Aligning Vision to Operations</p>
                    </div>
                    <StrategyPyramid
                        selectedLevel={selectedLevel}
                        onSelectLevel={setSelectedLevel}
                        counts={counts}
                    />
                </div>

                {/* Right: The Breakdown (Data) */}
                <div className="lg:w-1/2 h-full">
                    <AlignmentView level={selectedLevel} data={MOCK_STRATEGY} />
                </div>
            </div>
        </ExecutiveBriefLayout>
    );
}
