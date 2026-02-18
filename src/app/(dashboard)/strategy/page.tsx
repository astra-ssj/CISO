"use client";

import { useAstraStore } from '@/lib/store';
import { KPI, OKR } from '@/lib/store';
import { KPIRow } from '@/components/strategy/kpi-row';
import { OKRCard } from '@/components/strategy/okr-card';
import { Plus, Target, TrendingUp, Shield } from 'lucide-react';
import { AccessGraph } from '@/components/visualizations/access-graph';
import { TrafficFlow } from '@/components/visualizations/traffic-flow';

export default function StrategyPage() {
    const kpis = useAstraStore(state => state.kpis);
    const okrs = useAstraStore(state => state.okrs);
    const addKPI = useAstraStore(state => state.addKPI);
    const addOKR = useAstraStore(state => state.addOKR);

    const handleAddKPI = () => {
        const title = prompt("Enter KPI Title:");
        if (!title) return;

        addKPI({
            title,
            value: 0,
            target: 100,
            unit: 'units',
            trend: 'neutral',
            status: 'warning'
        });
    };

    const handleAddOKR = () => {
        const title = prompt("Enter Objective Title:");
        if (!title) return;
        const description = prompt("Enter Objective Description:");

        addOKR({
            title,
            description: description || '',
            status: 'ON_TRACK',
            keyResults: []
        });
    };

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Target className="w-8 h-8 text-blue-500" />
                    Strategy & Objectives
                </h1>
                <p className="text-zinc-400 max-w-2xl">
                    Define and track your organization's high-level goals (OKRs) and Key Performance Indicators (KPIs).
                    Align security initiatives with business outcomes.
                </p>
            </div>

            {/* KPIs Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-xl font-semibold text-white">Key Performance Indicators</h2>
                    </div>
                    <button
                        onClick={handleAddKPI}
                        className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-md transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add KPI
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map(kpi => (
                        <KPIRow key={kpi.id} kpi={kpi} />
                    ))}

                    {kpis.length === 0 && (
                        <div className="col-span-full py-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                            No KPIs defined. Click "Add KPI" to start tracking metrics.
                        </div>
                    )}
                </div>
            </section>

            {/* Risk Analysis Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    <h2 className="text-xl font-semibold text-white">Strategic Risk Analysis (FAIR Model)</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quantitative Risk Cards */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                                <h3 className="text-zinc-400 text-sm mb-1">Annualized Loss Expectancy</h3>
                                <div className="text-2xl font-bold text-white">$2.4M</div>
                                <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> +12% from last quarter
                                </div>
                            </div>
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                                <h3 className="text-zinc-400 text-sm mb-1">Risk Score (Google Standard)</h3>
                                <div className="text-2xl font-bold text-amber-500">72/100</div>
                                <div className="text-xs text-zinc-500 mt-1">Criticality: High | Threat: High</div>
                            </div>
                        </div>

                        {/* Access Graph */}
                        <div className="p-1 rounded-xl border border-zinc-800 bg-zinc-950">
                            <AccessGraph />
                        </div>
                    </div>

                    {/* Traffic Flow & Analysis */}
                    <div className="space-y-4">
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl h-[100px] flex items-center justify-between">
                            <div>
                                <h3 className="text-zinc-100 font-medium">Top Risk Scenario: Ransomware on DB</h3>
                                <p className="text-sm text-zinc-500">LEF: 0.2/yr | Magnitude: $5M</p>
                            </div>
                            <div className="px-3 py-1 bg-red-500/10 text-red-500 rounded text-sm border border-red-500/20">
                                CRITICAL
                            </div>
                        </div>

                        {/* Traffic Flow */}
                        <div className="p-1 rounded-xl border border-zinc-800 bg-zinc-950">
                            <TrafficFlow />
                        </div>
                    </div>
                </div>
            </section>

            <div className="w-full h-px bg-zinc-800/50 my-8" />

            {/* OKRs Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Objectives & Key Results (OKRs)</h2>
                    <button
                        onClick={handleAddOKR}
                        className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Objective
                    </button>
                </div>

                <div className="grid gap-6">
                    {okrs.map(okr => (
                        <OKRCard key={okr.id} okr={okr} />
                    ))}

                    {okrs.length === 0 && (
                        <div className="py-12 text-center bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
                            <Target className="w-12 h-12 text-zinc-600 mx-auto mb-3 opacity-50" />
                            <h3 className="text-lg font-medium text-zinc-300">No Objectives Set</h3>
                            <p className="text-zinc-500 max-w-md mx-auto mt-2">
                                Create your first objective to clarify your security strategy and align your team.
                            </p>
                            <button
                                onClick={handleAddOKR}
                                className="mt-6 text-blue-400 hover:text-blue-300 text-sm font-medium"
                            >
                                + Define First Objective
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
