"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface ThreatTickerProps {
    items: string[];
}

export function ThreatTicker({ items }: ThreatTickerProps) {
    return (
        <div className="w-full bg-red-950/30 border-y border-red-900/50 overflow-hidden py-2 flex items-center relative z-20">
            <div className="bg-red-950/80 absolute left-0 h-full px-3 flex items-center z-10 border-r border-red-900/50 text-red-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 mr-2 animate-pulse" />
                Live Threats
            </div>

            <div className="flex animate-marquee whitespace-nowrap">
                {items.map((item, i) => (
                    <span key={i} className="mx-8 text-sm text-red-200/80 font-mono flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse" />
                        {item}
                    </span>
                ))}
                {/* Duplicate for seamless loop */}
                {items.map((item, i) => (
                    <span key={`dup-${i}`} className="mx-8 text-sm text-red-200/80 font-mono flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse" />
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}
