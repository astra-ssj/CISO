"use client";

import React, { useState } from "react";
import { BudgetSimulatorLayout } from "@/components/budget/budget-simulator-layout";
import { BudgetControls, BudgetState } from "@/components/budget/budget-controls";
import { SimulationMetrics } from "@/components/budget/simulation-metrics";
import { RiskProjectionChart } from "@/components/budget/risk-projection-chart";

// Default Scenario
const INITIAL_BUDGET: BudgetState = {
    appSec: 150000,
    infrastructure: 250000,
    governance: 120000,
    incidentResponse: 80000,
};

export default function BudgetPage() {
    const [budget, setBudget] = useState<BudgetState>(INITIAL_BUDGET);

    // Calculate dynamic risk score based on budget
    const calculateRisk = (b: BudgetState) => {
        // Simple formula: Base Risk (100) - (Spend / Factor)
        // Adjust factors so typical spread is ~40-60
        const total = b.appSec + b.infrastructure + b.governance + b.incidentResponse;
        const impact = total / 20000; // e.g. 600k / 20k = 30 pts reduction
        return Math.max(10, 85 - impact);
    };

    const riskScore = calculateRisk(budget);
    const prevRiskScore = calculateRisk(INITIAL_BUDGET); // Baseline

    const totalSpend = Object.values(budget).reduce((a, b) => a + b, 0);
    const baselineSpend = Object.values(INITIAL_BUDGET).reduce((a, b) => a + b, 0);

    return (
        <BudgetSimulatorLayout
            controls={
                <BudgetControls budget={budget} onChange={setBudget} />
            }
            metrics={
                <SimulationMetrics
                    riskScore={riskScore}
                    prevRiskScore={prevRiskScore}
                    totalSpend={totalSpend}
                    baselineSpend={baselineSpend}
                />
            }
            visualization={
                <RiskProjectionChart budget={budget} />
            }
        />
    );
}
