"use client";

import { useMemo } from "react";
import type { SessionState } from "@/lib/exercises/types";
import { calculateGrade, formatDollars } from "@/lib/exercises/scoring";

export function useScoreboard(state: SessionState) {
    return useMemo(() => ({
        formattedDollars: formatDollars(state.dollars),
        dollarsRaw: state.dollars,
        repInternal: state.repInternal,
        repExternal: state.repExternal,
        grade: calculateGrade(state.dollars, state.repInternal, state.repExternal),
        isNegativeDollars: state.dollars < 0,
        repInternalStatus: state.repInternal >= 70 ? "healthy" : state.repInternal >= 40 ? "warning" : "critical" as const,
        repExternalStatus: state.repExternal >= 70 ? "healthy" : state.repExternal >= 40 ? "warning" : "critical" as const,
        totalDecisions: state.history.length,
        blunders: state.history.filter((h) => h.repExt <= -25 || h.repInt <= -25).length,
    }), [state.dollars, state.repInternal, state.repExternal, state.history]);
}
