"use client";

import { RepMeter } from "../shared/RepMeter";
import { formatDollars } from "@/lib/exercises/scoring";
import type { SessionState } from "@/lib/exercises/types";
import { useScoreboard } from "@/hooks/exercises/useScoreboard";

interface ScoreboardProps {
    state: SessionState;
}

export function Scoreboard({ state }: ScoreboardProps) {
    const { formattedDollars, isNegativeDollars, grade } = useScoreboard(state);

    const gradeColors: Record<string, string> = {
        A: "text-emerald-400", B: "text-blue-400", C: "text-amber-400", D: "text-orange-400", F: "text-red-400",
    };

    return (
        <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 space-y-4 w-full max-w-xs">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Live Scoreboard</h3>
                <span className={`text-lg font-bold font-mono ${gradeColors[grade] ?? "text-muted-foreground"}`}>{grade}</span>
            </div>

            {/* Net impact */}
            <div className="space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Net Financial Impact</span>
                <p className={`text-2xl font-mono font-bold ${isNegativeDollars ? "text-red-400" : "text-emerald-400"}`}>
                    {formattedDollars}
                </p>
            </div>

            {/* Reputation meters */}
            <RepMeter label="Internal Reputation" value={state.repInternal} size="sm" />
            <RepMeter label="External Reputation" value={state.repExternal} size="sm" />

            {/* Recent decisions */}
            {state.history.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Recent</span>
                    {state.history.slice(-3).map((h, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground truncate max-w-[60%]">{h.time}</span>
                            <span className={h.dollars < 0 ? "text-red-400 font-mono" : "text-emerald-400 font-mono"}>
                                {formatDollars(h.dollars)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
