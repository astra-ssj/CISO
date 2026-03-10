"use client";

import { cn } from "@/lib/utils";

interface RiskHeatmapProps {
    data: { likelihood: number; impact: number }[];
    onCellClick: (likelihood: number, impact: number) => void;
    selectedCell?: { likelihood: number; impact: number } | null;
}

export function RiskHeatmap({ data, onCellClick, selectedCell }: RiskHeatmapProps) {
    // Initialize 5x5 grid with zeros
    const matrix: number[][] = Array(5).fill(0).map(() => Array(5).fill(0));

    // Populate counts
    data.forEach((risk) => {
        // Ensuring values are between 1 and 5
        const row = Math.min(5, Math.max(1, risk.likelihood)) - 1;
        const col = Math.min(5, Math.max(1, risk.impact)) - 1;
        matrix[row][col]++;
    });

    const getCellColor = (likelihood: number, impact: number, count: number) => {
        if (count === 0) return "bg-muted/10 border-transparent hover:bg-muted/20";

        const score = likelihood * impact;
        if (score >= 20) return "bg-red-500/20 border-red-500/50 text-red-500 hover:bg-red-500/30"; // Critical
        if (score >= 12) return "bg-orange-500/20 border-orange-500/50 text-orange-500 hover:bg-orange-500/30"; // High
        if (score >= 5) return "bg-amber-500/20 border-amber-500/50 text-amber-500 hover:bg-amber-500/30"; // Medium
        return "bg-blue-500/20 border-blue-500/50 text-blue-500 hover:bg-blue-500/30"; // Low
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="flex">
                {/* Y-axis Label */}
                <div className="flex flex-col justify-center items-center pr-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest -rotate-90 whitespace-nowrap">
                        Likelihood
                    </span>
                </div>

                {/* Grid Core */}
                <div className="flex-1">
                    <div className="grid grid-rows-5 gap-1">
                        {[5, 4, 3, 2, 1].map((likelihood) => (
                            <div key={`row-${likelihood}`} className="grid grid-cols-5 gap-1">
                                {[1, 2, 3, 4, 5].map((impact) => {
                                    const count = matrix[likelihood - 1][impact - 1];
                                    const isSelected = selectedCell?.likelihood === likelihood && selectedCell?.impact === impact;

                                    return (
                                        <button
                                            key={`cell-${likelihood}-${impact}`}
                                            onClick={() => onCellClick(likelihood, impact)}
                                            className={cn(
                                                "aspect-square rounded-md border flex flex-col items-center justify-center transition-all",
                                                getCellColor(likelihood, impact, count),
                                                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                                count === 0 && "cursor-default pointer-events-none text-muted"
                                            )}
                                        >
                                            <span className="text-lg font-bold">{count > 0 ? count : ""}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* X-axis Label below grid */}
                    <div className="flex justify-center mt-4">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                            Impact
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
