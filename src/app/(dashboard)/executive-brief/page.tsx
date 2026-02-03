"use client";

import React from "react";
import { ExecutiveBriefLayout } from "@/components/executive/executive-brief-layout";
import { TopRisksCard, RiskItem } from "@/components/executive/top-risks-card";
import { InvestmentHeatmap } from "@/components/executive/investment-heatmap";
import { RevenueVelocityGauge } from "@/components/executive/revenue-velocity-gauge";

// MOCK DATA
const MOCK_RISKS: RiskItem[] = [
    {
        id: "1",
        businessRisk: "Q3 European Expansion Delay",
        technicalRootCause: "GDPR Compliance Gap in Legacy Customer DB",
        trend: "up",
        severity: "critical",
        owner: "J. Smith (Legal/Eng)"
    },
    {
        id: "2",
        businessRisk: "Payment Processing Continuity Risk",
        technicalRootCause: "Single Point of Failure in Gateway API",
        trend: "stable",
        severity: "high",
        owner: "S. Chen (FinTech)"
    },
    {
        id: "3",
        businessRisk: "Supply Chain Intellectual Property Theft",
        technicalRootCause: "Unsecured Third-Party Contractor Access",
        trend: "down",
        severity: "medium",
        owner: "M. Johnson (Procurement)"
    },
];

const MOCK_INVESTMENTS = [
    { id: "1", category: "Legacy Firewall Maint.", spend: 85, riskReduction: 10, actualSpend: "$2.5M" }, // Over-investing
    { id: "2", category: "Endpoint Protection", spend: 75, riskReduction: 85, actualSpend: "$2.1M" }, // Strategic
    { id: "3", category: "Security Awareness", spend: 20, riskReduction: 30, actualSpend: "$400k" }, // Transactional
    { id: "4", category: "Automated Patching", spend: 30, riskReduction: 80, actualSpend: "$800k" }, // Efficient
    { id: "5", category: "Consulting Retainer", spend: 60, riskReduction: 40, actualSpend: "$1.5M" }, // Questionable
];

const MOCK_VELOCITY = [
    { id: "1", processName: "New Vendor Onboarding", delay: "+12 Days", impact: "high", status: "blocked" },
    { id: "2", processName: "DevOps Release Cycle", delay: "+4 Hours", impact: "low", status: "optimized" },
    { id: "3", processName: "Remote Access Provisioning", delay: "+2 Days", impact: "medium", status: "slow" },
    { id: "4", processName: "Cloud Resource Approval", delay: "+5 Days", impact: "medium", status: "slow" },
] as const;

export default function ExecutiveBriefPage() {
    return (
        <ExecutiveBriefLayout>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

                {/* Bento Item 1: Top Risks (Tall, Span 2 on small, 1 on large?) -> Let's make it Prominent Left Col */}
                <div className="md:col-span-2 lg:col-span-1 row-span-2">
                    <TopRisksCard risks={MOCK_RISKS} />
                </div>

                {/* Bento Item 2: Velocity (Small Square-ish) */}
                <div className="md:col-span-2 lg:col-span-1 row-span-2">
                    <RevenueVelocityGauge metrics={MOCK_VELOCITY} />
                </div>

                {/* Bento Item 3: Investment Heatmap (Wide, Span 2) */}
                <div className="md:col-span-4 lg:col-span-2 row-span-2">
                    <InvestmentHeatmap items={MOCK_INVESTMENTS} />
                </div>

                {/* Placeholder for future expansion or "Key Insight" */}
                {/* <div className="md:col-span-4 lg:col-span-4 h-32 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex items-center justify-center text-zinc-500 italic">
                    "Security is not a blocker, it is a quality attribute of velocity."
                </div> */}
            </div>
        </ExecutiveBriefLayout>
    );
}
