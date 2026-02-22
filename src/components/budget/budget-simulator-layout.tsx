"use client";

import React from "react";

interface BudgetSimulatorLayoutProps {
    controls: React.ReactNode;
    visualization: React.ReactNode;
    metrics: React.ReactNode;
}

export function BudgetSimulatorLayout({ controls, visualization, metrics }: BudgetSimulatorLayoutProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
            {/* Left Control Panel */}
            <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">FinOps Simulator</h2>
                    <p className="text-muted-foreground text-sm">
                        Adjust investment levers to see real-time impact on organizational risk and compliance posture.
                    </p>
                </div>
                {controls}
            </div>

            {/* Right Visualization Panel */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                {metrics}
                <div className="flex-1 min-h-[400px] rounded-xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm p-6 relative overflow-hidden">
                    {visualization}
                </div>
            </div>
        </div>
    );
}
