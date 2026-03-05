// =============================================================================
// Tabletop Exercise Module — Scoring & Assessment
// =============================================================================

import type { Grade, SessionState, Scenario, FinalAssessment } from "./types";

/**
 * Calculate letter grade from final exercise state.
 * Weighted: 40% financial, 30% internal reputation, 30% external reputation.
 */
export function calculateGrade(
    dollars: number,
    repInt: number,
    repExt: number
): Grade {
    // Normalize dollar impact to 0-100 scale
    // -€2M → 0, €0 → 50, positive → up to 100
    const dollarScore = Math.max(0, Math.min(100, 50 + (dollars / 20000)));
    const score = (dollarScore * 0.4) + (repInt * 0.3) + (repExt * 0.3);

    if (score >= 80) return "A";
    if (score >= 65) return "B";
    if (score >= 50) return "C";
    if (score >= 35) return "D";
    return "F";
}

/**
 * Generate a complete post-exercise assessment with
 * strengths, failures, and recommendations.
 */
export function generateAssessment(
    state: SessionState,
    scenario: Scenario
): FinalAssessment {
    const strengths: string[] = [];
    const failures: string[] = [];
    const recommendations: string[] = [];

    // Analyze decision patterns
    for (const record of state.history) {
        if (record.repInt >= 10) {
            strengths.push(
                `Strong internal leadership at ${record.time}: ${record.title}`
            );
        }
        if (record.repExt >= 15) {
            strengths.push(
                `Effective external communication at ${record.time}: ${record.title}`
            );
        }
        if (record.repInt <= -20) {
            failures.push(
                `Internal reputation crisis at ${record.time}: ${record.title}`
            );
        }
        if (record.repExt <= -25) {
            failures.push(
                `External communication blunder at ${record.time}: ${record.title}`
            );
        }
        if (record.dollars <= -400000) {
            failures.push(
                `Severe financial impact at ${record.time}: ${record.title}`
            );
        }
    }

    // Communication-specific analysis
    const commBlunders = state.history.filter((h) => h.repExt <= -30);
    if (commBlunders.length > 0) {
        recommendations.push(
            "Invest in crisis communication training — communication blunders caused more damage than the incident itself"
        );
    }

    if (state.repInternal < 50) {
        recommendations.push(
            "Internal trust is critically low — prioritize employee all-hands, transparency programs, and cultural recovery before external marketing"
        );
    }

    if (state.repExternal < 50) {
        recommendations.push(
            "External reputation is severely damaged — consider launching a Security Transparency Program with public reporting"
        );
    }

    // Financial analysis
    if (state.dollars < -1500000) {
        recommendations.push(
            "Total financial impact exceeds €1.5M — review incident response budget allocation and cyber insurance coverage"
        );
    }

    // Positive reinforcement
    if (state.repInternal >= 80 && state.repExternal >= 80) {
        strengths.push(
            "Maintained strong reputation on both internal and external fronts throughout the exercise"
        );
    }

    if (strengths.length === 0) {
        strengths.push("Completed the full exercise — practice builds preparedness");
    }

    if (recommendations.length === 0) {
        recommendations.push(
            "Continue regular tabletop exercises to maintain crisis response readiness"
        );
    }

    return {
        grade: calculateGrade(state.dollars, state.repInternal, state.repExternal),
        totalDollars: state.dollars,
        finalRepInternal: state.repInternal,
        finalRepExternal: state.repExternal,
        history: state.history,
        strengths,
        failures,
        recommendations,
    };
}

/**
 * Clamp a reputation value between 0 and 100.
 */
export function clampRep(value: number): number {
    return Math.max(0, Math.min(100, value));
}

/**
 * Format a dollar value with sign and € symbol.
 * e.g. -420000 → "-€420K", 200000 → "+€200K"
 */
export function formatDollars(value: number): string {
    const abs = Math.abs(value);
    const sign = value >= 0 ? "+" : "-";
    if (abs >= 1_000_000) {
        return `${sign}€${(abs / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1000) {
        return `${sign}€${Math.round(abs / 1000)}K`;
    }
    return `${sign}€${abs}`;
}
