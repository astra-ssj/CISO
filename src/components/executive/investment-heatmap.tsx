"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Loader2, DollarSign } from "lucide-react";
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
        <Card className="h-full bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    Investment Efficiency
                </CardTitle>
                <p className="text-zinc-500 text-sm">
                    Where are we over-investing? (Spend vs. Risk Reduction)
                </p>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] relative p-6">
                {/* Axis Labels */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-zinc-600 tracking-widest uppercase origin-center whitespace-nowrap">
                    Risk Reduction Value
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-zinc-600 tracking-widest uppercase">
                    Annual Spend
                </div>

                {/* The Grid */}
                <div className="absolute inset-8 border border-zinc-800 bg-zinc-950/50 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2">
                    {/* Quadrants */}
                    <div className="bg-red-500/5 p-2 flex items-start justify-end border-r border-b border-zinc-800/50">
                        <span className="text-[10px] font-mono text-red-500/50 uppercase text-right">High Spend<br />Low Value<br />(Over-Investing)</span>
                    </div>
                    <div className="bg-emerald-500/5 p-2 flex items-start justify-end border-b border-zinc-800/50">
                        <span className="text-[10px] font-mono text-emerald-500/50 uppercase text-right">High Spend<br />High Value<br />(Strategic)</span>
                    </div>
                    <div className="p-2 flex items-end justify-start border-r border-zinc-800/50">
                        <span className="text-[10px] font-mono text-zinc-700 uppercase">Low Spend<br />Low Value<br />(Transactional)</span>
                    </div>
                    <div className="bg-blue-500/5 p-2 flex items-end justify-start">
                        <span className="text-[10px] font-mono text-blue-500/50 uppercase">Low Spend<br />High Value<br />(Efficient)</span>
                    </div>
                </div>

                {/* Data Points */}
                <div className="absolute inset-8">
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
                            <div className={`w-4 h-4 rounded-full border-2 shadow-lg transition-transform group-hover:scale-150
                        ${getPointColor(item.spend, item.riskReduction)}
                    `} />

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-zinc-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-zinc-700">
                                <div className="font-bold mb-1">{item.category}</div>
                                <div className="text-zinc-400">{item.actualSpend}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </CardContent>
        </Card>
    );
}

function getPointColor(spend: number, riskReduction: number) {
    if (spend > 50 && riskReduction < 50) return "bg-red-500 border-red-300"; // Bad
    if (spend > 50 && riskReduction >= 50) return "bg-emerald-500 border-emerald-300"; // Good
    if (spend <= 50 && riskReduction >= 50) return "bg-blue-500 border-blue-300"; // Efficient
    return "bg-zinc-500 border-zinc-300"; // Neutral
}
