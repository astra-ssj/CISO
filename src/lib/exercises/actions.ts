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
