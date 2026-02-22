"use client";

import React from "react";
import { DollarSign } from "lucide-react";
import { motion } from "framer-motion";

interface InvestmentItem {
    id: string;
    category: string;
    spend: number; // 0-100 normalized
    riskReduction: number; // 0-100 normalized
    actualSpend: string; // e.g. "$1.2M"
}

interface InvestmentHeatmapProps {
    items: InvestmentItem[];
}

export function InvestmentHeatmap({ items }: InvestmentHeatmapProps) {
    return (
        <div className="h-full flex flex-col relative">
            <div className="absolute top-0 right-0 z-10">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                    <span>Strategic</span>
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)] ml-2"></div>
                    <span>Waste</span>
                </div>
            </div>

            <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <DollarSign className="w-3 h-3" />
                Capital Efficiency
            </h3>

            <div className="flex-1 relative border border-zinc-800/50 bg-zinc-950/50 rounded-lg overflow-hidden">
                {/* Grid Background */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    <div className="border-r border-b border-zinc-800/30"></div>
                    <div className="border-b border-zinc-800/30"></div>
                    <div className="border-r border-zinc-800/30"></div>
                    <div></div>
                </div>

                {/* X/Y Labels (Subtle) */}
                <div className="absolute bottom-2 right-2 text-[9px] text-zinc-600 font-mono tracking-wider uppercase">Annual Spend →</div>
                <div className="absolute top-2 left-2 text-[9px] text-zinc-600 font-mono tracking-wider uppercase vertical-text">
                    Risk Reduction (Value) ↑
                </div>

                {/* Data Points */}
                <div className="absolute inset-4">
                    {items.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 + idx * 0.1, type: "spring" }}
                            className="absolute w-4 h-4 -ml-2 -mt-2 group cursor-help z-10"
                            style={{
                                left: `${item.spend}%`,
                                bottom: `${item.riskReduction}%`
                            }}
                        >
                            <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-300 group-hover:scale-150 group-hover:shadow-[0_0_20px_2px_rgba(255,255,255,0.3)]
                        ${getPointColor(item.spend, item.riskReduction)}
                    `} />

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-zinc-900 text-white text-[10px] rounded border border-zinc-800 p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                <div className="font-bold text-zinc-200">{item.category}</div>
                                <div className="text-zinc-500 font-mono mt-0.5">{item.actualSpend}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function getPointColor(spend: number, riskReduction: number) {
    if (spend > 50 && riskReduction < 50) return "bg-red-500"; // Bad
    if (spend > 50 && riskReduction >= 50) return "bg-emerald-400"; // Good
    if (spend <= 50 && riskReduction >= 50) return "bg-blue-400"; // Efficient
    return "bg-zinc-600"; // Neutral
}


