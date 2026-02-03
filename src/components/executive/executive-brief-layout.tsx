"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useViewEngine } from "@/stores/view-engine-store";
import { ChevronDown } from "lucide-react";

export interface ExecutiveBriefLayoutProps {
    children: React.ReactNode;
    presenter?: string;
    date?: string;
}

export function ExecutiveBriefLayout({ children, presenter, date }: ExecutiveBriefLayoutProps) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const { context, setDimension } = useViewEngine();

    return (
        <div className="min-h-screen bg-black/95 text-foreground p-6 md:p-10 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header / Hero */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-800 pb-6">
                    <div>
                        <div className="text-zinc-500 text-sm font-medium uppercase tracking-widest mb-2">
                            {date || today} {presenter && <span className="text-zinc-700 mx-2">•</span>} {presenter && <span className="text-zinc-400">Presented by {presenter}</span>}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                            Executive <span className="text-zinc-600">Briefing</span>
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Real-time intelligence on risk, velocity, and investments.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                        {/* Dynamic Context Controls */}
                        <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800 backdrop-blur-md">
                            <ContextSelect
                                value={context.unit}
                                onChange={(v) => setDimension('unit', v)}
                                options={['Global', 'Engineering', 'Sales', 'Finance']}
                                label="Unit"
                            />
                            <div className="w-px h-4 bg-zinc-800" />
                            <ContextSelect
                                value={context.timeframe}
                                onChange={(v) => setDimension('timeframe', v)}
                                options={['Q1', 'Q2', 'Q3', 'YTD']}
                                label="Period"
                            />
                            <div className="w-px h-4 bg-zinc-800" />
                            <ContextSelect
                                value={context.region}
                                onChange={(v) => setDimension('region', v)}
                                options={['All', 'NA', 'EMEA', 'APAC']}
                                label="Region"
                            />
                        </div>

                        <div className="text-right">
                            <div className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">System Status</div>
                            <div className="flex items-center gap-2 justify-end">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-500 font-mono text-sm">OPERATIONAL</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Grid Content */}
                <main className="animate-fade-in-up">
                    {children}
                </main>
            </div>
        </div>
    );
}

function ContextSelect({ value, onChange, options, label }: { value: string, onChange: (v: any) => void, options: string[], label: string }) {
    return (
        <div className="relative group">
            <label className="absolute -top-2 left-1 text-[8px] text-zinc-500 bg-black px-1 font-bold tracking-wider uppercase">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-transparent text-zinc-300 text-xs font-medium pl-3 pr-8 py-1.5 rounded outline-none cursor-pointer hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-700"
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
        </div>
    )
}
