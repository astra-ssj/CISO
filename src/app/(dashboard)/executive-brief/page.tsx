"use client";

import { useState, useEffect } from "react";
import { ExecutiveBriefLayout } from "@/components/executive/executive-brief-layout";
import { TopRisksCard, RiskItem } from "@/components/executive/top-risks-card";
import { InvestmentHeatmap } from "@/components/executive/investment-heatmap";
import { RevenueVelocityGauge, VelocityMetric } from "@/components/executive/revenue-velocity-gauge";
import { StrategyPyramid, StrategyLevel } from "@/components/strategy/strategy-pyramid";

// Fallback Mock Data (Standard CISO Risks)
const FALLBACK_RISKS: RiskItem[] = [
    {
        id: "1",
        businessRisk: "Q3 European Expansion Delay",
        technicalRootCause: "GDPR Compliance Gap in Legacy Customer DB",
        trend: "up",
        severity: "critical",
        owner: "J. Smith (Legal/Eng)"
    }
];

const MOCK_INVESTMENTS = [
    { id: "1", category: "Legacy Firewall Maint.", spend: 85, riskReduction: 10, actualSpend: "$2.5M" }, // Over-investing
    { id: "2", category: "Endpoint Protection", spend: 75, riskReduction: 85, actualSpend: "$2.1M" }, // Strategic
    { id: "3", category: "Security Awareness", spend: 20, riskReduction: 30, actualSpend: "$400k" }, // Transactional
    { id: "4", category: "Automated Patching", spend: 30, riskReduction: 80, actualSpend: "$800k" }, // Efficient
    { id: "5", category: "Consulting Retainer", spend: 60, riskReduction: 40, actualSpend: "$1.5M" }, // Questionable
];

const MOCK_VELOCITY: VelocityMetric[] = [
    { id: "1", processName: "New Vendor Onboarding", delay: "+12 Days", impact: "high", status: "blocked" },
    { id: "2", processName: "DevOps Release Cycle", delay: "+4 Hours", impact: "low", status: "optimized" },
    { id: "3", processName: "Remote Access Provisioning", delay: "+2 Days", impact: "medium", status: "slow" },
    { id: "4", processName: "Cloud Resource Approval", delay: "+5 Days", impact: "medium", status: "slow" },
];

export default function ExecutiveBriefPage() {
    const [strategyLevel, setStrategyLevel] = useState<StrategyLevel>('kpi');
    const [risks, setRisks] = useState<RiskItem[]>(FALLBACK_RISKS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchTrivyData() {
            try {
                const res = await fetch('/api/integrations/trivy');
                const data = await res.json();

                if (data.Results) {
                    const adaptedRisks = adaptTrivyToRisks(data);
                    setRisks(adaptedRisks);
                }
            } catch (error) {
                console.error("Failed to fetch Trivy data:", error);
                // Keep fallback data
            } finally {
                setIsLoading(false);
            }
        }

        fetchTrivyData();
    }, []);

    const getSummaryText = () => {
        if (strategyLevel === 'okr') return "Strategic Alignment Analysis: Risks detected in critical dependencies.";
        if (strategyLevel === 'kpi') return "Tactical Execution: Velocity Impacted by Vendor Onboarding delays.";
        return "Operational Metrics: Supply Chain hygiene requires attention.";
    };

    return (
        <ExecutiveBriefLayout>
            <div className="flex flex-col gap-8 pb-20">
                {/* Dynamic Briefing Header */}
                <div className="border-l-2 border-emerald-500 pl-4 py-1">
                    <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-1">
                        Live Executive Summary
                    </div>
                    <p className="text-xl md:text-2xl font-light text-zinc-100">
                        {getSummaryText()}
                    </p>
                </div>

                {/* The Command Surface */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 min-h-[600px]">

                    {/* Column 1: Strategy Pyramid (The Controller) - Span 5 */}
                    <div className="lg:col-span-5 relative flex flex-col">
                        <div className="absolute top-0 right-0 z-10">
                            <span className="text-[10px] text-zinc-500 font-mono">[INTERACTIVE MODEL]</span>
                        </div>
                        <div className="flex-1 rounded-2xl bg-gradient-to-b from-zinc-900/50 to-black border border-zinc-800/50 relative overflow-hidden">
                            {/* Ambient Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />

                            <StrategyPyramid
                                selectedLevel={strategyLevel}
                                onSelectLevel={setStrategyLevel}
                                counts={{ okr: 3, kpi: 12, metric: 48 }}
                            />
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-xs text-zinc-500 uppercase tracking-widest">
                                Select a layer to filter intelligence
                            </p>
                        </div>
                    </div>

                    {/* Column 2: Intelligence Stream (Risks & Velocity) - Span 4 */}
                    <div className="lg:col-span-4 flex flex-col gap-8 border-l border-zinc-800/50 pl-0 lg:pl-8">
                        {/* Top Risks */}
                        <div className="flex-1 min-h-[300px]">
                            {isLoading ? (
                                <div className="text-xs text-zinc-500 animate-pulse">Scanning environment...</div>
                            ) : (
                                <TopRisksCard risks={risks} strategyLevel={strategyLevel} />
                            )}
                        </div>

                        {/* Velocity */}
                        <div className="flex-1 min-h-[250px] border-t border-zinc-800/50 pt-8">
                            <RevenueVelocityGauge metrics={MOCK_VELOCITY} />
                        </div>
                    </div>

                    {/* Column 3: Capital Efficiency (Investments) - Span 3 */}
                    <div className="lg:col-span-3 border-l border-zinc-800/50 pl-0 lg:pl-8 h-full">
                        <InvestmentHeatmap items={MOCK_INVESTMENTS} />
                    </div>

                </div>
            </div>
        </ExecutiveBriefLayout>
    );
}

// Adapter: Converts Trivy JSON to Executive Brief Risk Format
function adaptTrivyToRisks(trivyData: any): RiskItem[] {
    const risks: RiskItem[] = [];

    // Safety check
    if (!trivyData?.Results) return [];

    trivyData.Results.forEach((result: any, index: number) => {
        if (result.Vulnerabilities) {
            result.Vulnerabilities.forEach((vuln: any, vIndex: number) => {
                risks.push({
                    id: `${index}-${vIndex}`,
                    // Transform "CVE-2023-..." into Business Language
                    businessRisk: `Vulnerable Dependency: ${vuln.PkgName}`,
                    technicalRootCause: `${vuln.VulnerabilityID}: ${vuln.Title || 'Unknown Issue'}`,
                    trend: Math.random() > 0.5 ? "up" : "stable", // Simulated trend for now
                    severity: (vuln.Severity || "medium").toLowerCase() as any,
                    owner: "AppSec Team"
                });
            });
        }
    });

    // Provide default if empty
    if (risks.length === 0) return FALLBACK_RISKS;

    return risks;
}
