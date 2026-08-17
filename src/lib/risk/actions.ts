"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { scoreFiveByFive, runFiveByFive } from "@/lib/skills/risk-five-by-five";
import { persistSkillRun } from "@/lib/skills/persist";

export async function createRisk(data: {
    title: string;
    description: string;
    category: string;
    likelihood: number;
    impact: number;
    owner: string;
    status: string;
    treatmentPlan?: string;
    reviewDate: Date;
}) {
    const scored = scoreFiveByFive({ likelihood: data.likelihood, impact: data.impact });
    void persistSkillRun(runFiveByFive({ likelihood: data.likelihood, impact: data.impact }, new Date().toISOString()));

    const risk = await prisma.risk.create({
        data: {
            ...data,
            inherentScore: scored.inherentScore,
        },
    });

    await prisma.riskHistory.create({
        data: {
            riskId: risk.id,
            field: "status",
            newValue: "Created",
        },
    });

    revalidatePath("/governance");
    return { success: true, riskId: risk.id };
}

export async function updateRisk(id: string, data: Partial<{
    title: string;
    description: string;
    category: string;
    likelihood: number;
    impact: number;
    residualScore: number | null;
    owner: string;
    status: string;
    treatmentPlan: string | null;
    reviewDate: Date;
}>) {
    const existingRisk = await prisma.risk.findUnique({ where: { id } });
    if (!existingRisk) throw new Error("Risk not found");

    const updates: import("@prisma/client").Prisma.RiskUpdateInput = { ...data };

    // Recalculate inherent score if likelihood or impact changed
    if (data.likelihood !== undefined || data.impact !== undefined) {
        const newLikelihood = data.likelihood ?? existingRisk.likelihood;
        const newImpact = data.impact ?? existingRisk.impact;
        const scored = scoreFiveByFive({ likelihood: newLikelihood, impact: newImpact });
        updates.inherentScore = scored.inherentScore;
        void persistSkillRun(runFiveByFive({ likelihood: newLikelihood, impact: newImpact }, new Date().toISOString()));
    }

    const updatedRisk = await prisma.risk.update({
        where: { id },
        data: updates,
    });

    // Track changes in history log
    const changes: { riskId: string, field: string, oldValue: string, newValue: string }[] = [];
    for (const [key, value] of Object.entries(updates)) {
        if (key === 'inherentScore' || value === existingRisk[key as keyof typeof existingRisk]) continue;

        changes.push({
            riskId: id,
            field: key,
            oldValue: String(existingRisk[key as keyof typeof existingRisk] || ""),
            newValue: String(value || ""),
        });
    }

    if (changes.length > 0) {
        await prisma.riskHistory.createMany({ data: changes });
    }

    revalidatePath("/governance");
    return { success: true, riskId: updatedRisk.id };
}

export async function deleteRisk(id: string) {
    await prisma.risk.delete({ where: { id } });
    revalidatePath("/governance");
    return { success: true };
}

export async function getRisks(filters?: { status?: string, category?: string, owner?: string }) {
    const where: import("@prisma/client").Prisma.RiskWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.owner) where.owner = filters.owner;

    return prisma.risk.findMany({
        where,
        orderBy: { inherentScore: 'desc' },
        include: {
            history: {
                orderBy: { changedAt: 'desc' },
                take: 5
            }
        }
    });
}

export async function getRiskById(id: string) {
    return prisma.risk.findUnique({
        where: { id },
        include: {
            history: {
                orderBy: { changedAt: 'desc' }
            }
        }
    });
}
