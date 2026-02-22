import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const [objectives, projects] = await Promise.all([
            prisma.objective.findMany({ orderBy: { createdAt: 'desc' } }),
            prisma.project.findMany({ orderBy: { createdAt: 'desc' } }),
        ]);
        const objList = objectives.map((o) => ({
            id: o.id,
            title: o.title,
            description: o.description,
            quarter: o.quarter,
            year: o.year,
            owner: o.owner,
            status: o.status,
            keyResults: JSON.parse(o.keyResults || '[]'),
            linkedRisks: o.linkedRisks ? JSON.parse(o.linkedRisks) : undefined,
        }));
        const projList = projects.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            owner: p.owner,
            status: p.status,
            priority: p.priority,
            budgetAllocated: p.budgetAllocated,
            budgetSpent: p.budgetSpent,
            linkedObjectives: JSON.parse(p.linkedObjectives || '[]'),
            linkedRisks: JSON.parse(p.linkedRisks || '[]'),
            startDate: p.startDate,
            targetEndDate: p.targetEndDate,
            tags: JSON.parse(p.tags || '[]'),
            phases: JSON.parse(p.phases || '[]'),
        }));
        return NextResponse.json({ objectives: objList, projects: projList });
    } catch (error: unknown) {
        console.error('OKR GET:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (body.objective) {
            const o = await prisma.objective.create({
                data: {
                    title: body.objective.title,
                    description: body.objective.description ?? '',
                    quarter: body.objective.quarter ?? 'Q1',
                    year: body.objective.year ?? new Date().getFullYear(),
                    owner: body.objective.owner ?? '',
                    status: body.objective.status ?? 'ON_TRACK',
                    keyResults: JSON.stringify(body.objective.keyResults ?? []),
                    linkedRisks: body.objective.linkedRisks ? JSON.stringify(body.objective.linkedRisks) : null,
                },
            });
            return NextResponse.json({
                objectives: [{
                    id: o.id,
                    title: o.title,
                    description: o.description,
                    quarter: o.quarter,
                    year: o.year,
                    owner: o.owner,
                    status: o.status,
                    keyResults: JSON.parse(o.keyResults || '[]'),
                    linkedRisks: o.linkedRisks ? JSON.parse(o.linkedRisks) : undefined,
                }],
                projects: [],
            }, { status: 201 });
        }
        if (body.project) {
            const p = await prisma.project.create({
                data: {
                    title: body.project.title,
                    description: body.project.description ?? '',
                    owner: body.project.owner ?? '',
                    status: body.project.status ?? 'NOT_STARTED',
                    priority: body.project.priority ?? 'MEDIUM',
                    budgetAllocated: body.project.budgetAllocated ?? 0,
                    budgetSpent: body.project.budgetSpent ?? 0,
                    linkedObjectives: JSON.stringify(body.project.linkedObjectives ?? []),
                    linkedRisks: JSON.stringify(body.project.linkedRisks ?? []),
                    startDate: body.project.startDate ?? '',
                    targetEndDate: body.project.targetEndDate ?? '',
                    tags: JSON.stringify(body.project.tags ?? []),
                    phases: JSON.stringify(body.project.phases ?? []),
                },
            });
            return NextResponse.json({
                objectives: [],
                projects: [{
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    owner: p.owner,
                    status: p.status,
                    priority: p.priority,
                    budgetAllocated: p.budgetAllocated,
                    budgetSpent: p.budgetSpent,
                    linkedObjectives: JSON.parse(p.linkedObjectives || '[]'),
                    linkedRisks: JSON.parse(p.linkedRisks || '[]'),
                    startDate: p.startDate,
                    targetEndDate: p.targetEndDate,
                    tags: JSON.parse(p.tags || '[]'),
                    phases: JSON.parse(p.phases || '[]'),
                }],
            }, { status: 201 });
        }
        return NextResponse.json({ error: 'Provide objective or project' }, { status: 400 });
    } catch (error: unknown) {
        console.error('OKR POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
