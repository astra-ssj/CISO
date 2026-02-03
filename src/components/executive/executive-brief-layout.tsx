"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function ExecutiveBriefLayout({ children }: { children: React.ReactNode }) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="min-h-screen bg-black/95 text-foreground p-6 md:p-10 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header / Hero */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-800 pb-6">
                    <div>
                        <div className="text-zinc-500 text-sm font-medium uppercase tracking-widest mb-2">{today}</div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                            Executive <span className="text-zinc-600">Briefing</span>
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Real-time intelligence on risk, velocity, and investments.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
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
