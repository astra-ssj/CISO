"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { MotionConfig } from "framer-motion";

interface ExecutiveBriefLayoutProps {
    children: React.ReactNode;
    date?: string;
    presenter?: string;
    className?: string;
}

export function ExecutiveBriefLayout({
    children,
    date = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }),
    presenter = "CISO Office",
    className,
}: ExecutiveBriefLayoutProps) {
    return (
        <div
            className={cn(
                "min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30",
                className
            )}
        >
            <header className="px-8 py-6 border-b border-zinc-800 flex justify-between items-end bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                        Executive Risk Briefing
                    </h1>
                    <p className="text-zinc-400 text-sm font-medium tracking-wide">
                        {date}
                    </p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                            Live Data
                        </span>
                    </div>
                    <p className="text-zinc-500 text-xs mt-1">Prepared by {presenter}</p>
                </div>
            </header>

            <main className="p-8 max-w-[1920px] mx-auto">
                <MotionConfig transition={{ duration: 0.5, ease: "easeOut" }}>
                    {children}
                </MotionConfig>
            </main>
        </div>
    );
}
