"use server";

import prisma from "@/lib/prisma";
import { calculateGrade } from "./scoring";

// =============================================================================
// Session Management
// =============================================================================

export async function createSession(
    scenarioId: string,
    mode: "decision" | "discussion",
    facilitatorId?: string
) {
    const session = await prisma.tabletopSession.create({
        data: {
            scenarioId,
            mode,
            facilitatorId: facilitatorId ?? null,
            status: "in_progress",
            totalDollars: 0,
            finalRepInternal: 100,
            finalRepExternal: 100,
        },
    });
    return session;
}

export async function getSession(sessionId: string) {
    return prisma.tabletopSession.findUnique({
        where: { id: sessionId },
        include: {
            scenario: true,
            decisions: { orderBy: { decidedAt: "asc" } },
            responses: { orderBy: { respondedAt: "asc" } },
            commsDrafts: { orderBy: { draftedAt: "asc" } },
        },
    });
}

export async function completeSession(
    sessionId: string,
    totalDollars: number,
    repInternal: number,
    repExternal: number
) {
    const grade = calculateGrade(totalDollars, repInternal, repExternal);
    return prisma.tabletopSession.update({
        where: { id: sessionId },
        data: {
            status: "completed",
            completedAt: new Date(),
            totalDollars,
            finalRepInternal: repInternal,
            finalRepExternal: repExternal,
            grade,
        },
    });
}

export async function abandonSession(sessionId: string) {
    return prisma.tabletopSession.update({
        where: { id: sessionId },
        data: { status: "abandoned", completedAt: new Date() },
    });
}

// =============================================================================
// Decision Persistence
// =============================================================================

export async function saveDecision(data: {
    sessionId: string;
    stepId: number;
    stepTime: string;
    stepTitle: string;
    choiceId: string;
    choiceLabel: string;
    role: string;
    dollarImpact: number;
    repInternalDelta: number;
    repExternalDelta: number;
    consequence: string;
    confidence: "low" | "medium" | "high";
    cascadeFlag?: string;
}) {
    return prisma.tabletopDecision.create({ data });
}

// =============================================================================
// Discussion Response Persistence
// =============================================================================

export async function saveResponse(data: {
    sessionId: string;
    stepId: number;
    role: string;
    question: string;
    response: string;
}) {
    // Upsert: update if exists for same session/step/role, else create
    const existing = await prisma.tabletopResponse.findFirst({
        where: {
            sessionId: data.sessionId,
            stepId: data.stepId,
            role: data.role,
        },
    });

    if (existing) {
        return prisma.tabletopResponse.update({
            where: { id: existing.id },
            data: { response: data.response, respondedAt: new Date() },
        });
    }

    return prisma.tabletopResponse.create({ data });
}

// =============================================================================
// Communication Drafts
// =============================================================================

export async function saveCommsDraft(data: {
    sessionId: string;
    stepId: number;
    audience: string;
    template: string;
    draft: string;
}) {
    const existing = await prisma.tabletopCommsDraft.findFirst({
        where: {
            sessionId: data.sessionId,
            stepId: data.stepId,
            audience: data.audience,
        },
    });

    if (existing) {
        return prisma.tabletopCommsDraft.update({
            where: { id: existing.id },
            data: { draft: data.draft, draftedAt: new Date() },
        });
    }

    return prisma.tabletopCommsDraft.create({ data });
}

// =============================================================================
// Session History
// =============================================================================

export async function getSessionHistory() {
    return prisma.tabletopSession.findMany({
        where: { status: { in: ["completed", "abandoned"] } },
        include: { scenario: true },
        orderBy: { startedAt: "desc" },
        take: 50,
    });
}

// =============================================================================
// Scenario Management
// =============================================================================

export async function getScenarios() {
    return prisma.tabletopScenario.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
    });
}

export async function ensureScenariosSeeded(
    scenarios: Array<{
        slug: string;
        title: string;
        subtitle: string;
        severity: string;
        briefing: string;
        icon: string;
        color: string;
        stakes: Record<string, unknown>;
        steps: unknown[];
        modes: string[];
    }>
) {
    for (const s of scenarios) {
        const existing = await prisma.tabletopScenario.findUnique({
            where: { slug: s.slug },
        });
        if (!existing) {
            await prisma.tabletopScenario.create({
                data: {
                    slug: s.slug,
                    title: s.title,
                    subtitle: s.subtitle ?? null,
                    severity: s.severity,
                    briefing: s.briefing,
                    icon: s.icon ?? null,
                    color: s.color ?? null,
                    stakes: JSON.stringify(s.stakes),
                    steps: JSON.stringify(s.steps),
                    modes: JSON.stringify(s.modes),
                },
            });
        }
    }
}

// =============================================================================
// Last Run Data for Scenario Library
// =============================================================================

export async function getLastRunPerScenario() {
    const lastRuns = await prisma.tabletopSession.findMany({
        where: { status: "completed" },
        orderBy: { completedAt: "desc" },
        distinct: ["scenarioId"],
        include: { scenario: true },
    });

    // We want to map by the predefined static slugs:
    return Object.fromEntries(lastRuns.map(r => [r.scenario.slug, {
        mode: r.mode,
        grade: r.grade,
        totalDollars: r.totalDollars,
        completedAt: r.completedAt,
    }]));
}

// =============================================================================
// Insights and Patterns
// =============================================================================

export async function getExercisePatterns() {
    const sessions = await prisma.tabletopSession.findMany({
        where: { status: "completed", mode: "decision" }, // only decision mode has grades/rep
        include: { scenario: true },
        orderBy: { completedAt: "desc" },
        take: 20,
    });

    if (sessions.length < 2) return null;

    const patterns: string[] = [];

    // Average internal reputation
    const avgInternal = sessions.reduce((s, sess) => s + (sess.finalRepInternal || 0), 0) / sessions.length;
    if (avgInternal < 60) {
        patterns.push("Internal communication consistently underperforms — consider running Discussion mode focused on employee communication.");
    }

    // Average external reputation
    const avgExternal = sessions.reduce((s, sess) => s + (sess.finalRepExternal || 0), 0) / sessions.length;
    if (avgExternal < 60) {
        patterns.push("External communication needs attention — media and customer notification decisions trend negative.");
    }

    // Grade trend
    const gradeMap: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };
    const grades = sessions.filter(s => s.grade).map(s => gradeMap[s.grade![0]] || 0);
    if (grades.length >= 3) {
        const recent = grades.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const older = grades.slice(-3).reduce((a, b) => a + b, 0) / 3;
        if (recent > older) patterns.push("Improving trend — grades increasing across recent sessions.");
        if (recent < older) patterns.push("Performance declining — review fundamentals before advanced scenarios.");
    }

    // Scenario coverage
    const uniqueScenarios = new Set(sessions.map(s => s.scenario.slug));
    const allScenarios = ["supply-chain", "insider", "ransomware"];
    const unrun = allScenarios.filter(s => !uniqueScenarios.has(s));
    if (unrun.length > 0) {
        patterns.push(`Scenarios not yet attempted: ${unrun.map(s => s.replace("-", " ")).join(", ")}`);
    }

    return {
        totalSessions: sessions.length,
        avgGrade: sessions[0]?.grade || "—",
        avgDollars: Math.round(sessions.reduce((s, sess) => s + (sess.totalDollars || 0), 0) / sessions.length),
        avgInternal: Math.round(avgInternal),
        avgExternal: Math.round(avgExternal),
        patterns,
    };
}
