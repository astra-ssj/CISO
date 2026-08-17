import prisma from '@/lib/prisma';
import { recordObservation } from '@/lib/observations/record';
import { persistSkillRun } from '@/lib/skills/persist';
import { runEvidenceExpiry } from '@/lib/skills/evidence-expiry';
import { runIntelCorrelate } from '@/lib/skills/intel-correlate';
import { runPlaybookNextStep, type PlaybookPhase } from '@/lib/skills/playbook-next-step';

export interface WatcherTickResult {
    asOf: string;
    skillRunIds: string[];
    evidenceExpired: number;
    evidenceExpiring: number;
    intelHits: number;
    playbooksWithNextStep: number;
}

function iocsFromPayload(payload: string): string[] {
    const found = new Set<string>();
    try {
        const parsed = JSON.parse(payload) as unknown;
        const walk = (v: unknown) => {
            if (typeof v === 'string' && (v.includes('.') || /^\d+\.\d+\.\d+\.\d+$/.test(v))) {
                found.add(v);
            } else if (Array.isArray(v)) {
                v.forEach(walk);
            } else if (v && typeof v === 'object') {
                Object.values(v as Record<string, unknown>).forEach(walk);
            }
        };
        walk(parsed);
    } catch {
        // ignore corrupt snapshots
    }
    return [...found];
}

/**
 * OpenNeko watchers call this. Skills compute; this only schedules.
 */
export async function runWatcherTick(asOf: string = new Date().toISOString()): Promise<WatcherTickResult> {
    const skillRunIds: string[] = [];

    const evidence = await prisma.evidence.findMany({
        select: { id: true, title: true, status: true, expiresAt: true },
        take: 2000,
    });
    const expiry = runEvidenceExpiry({
        asOf,
        windowDays: 30,
        items: evidence.map((e) => ({
            id: e.id,
            title: e.title,
            status: e.status,
            expiresAt: e.expiresAt ? e.expiresAt.toISOString() : null,
        })),
    }, asOf);
    const expiryId = await persistSkillRun(expiry);
    if (expiryId) skillRunIds.push(expiryId);

    const [vendors, observations, scans, playbooks] = await Promise.all([
        prisma.vendor.findMany({ select: { name: true, website: true }, take: 500 }),
        prisma.observation.findMany({
            where: { integrationId: { in: ['threatfox', 'otx', 'urlhaus'] }, status: 'ok' },
            orderBy: { fetchedAt: 'desc' },
            take: 20,
        }),
        prisma.attackSurfaceScan.findMany({ orderBy: { scanDate: 'desc' }, take: 5 }),
        prisma.playbook.findMany({ where: { status: { not: 'READY' } }, take: 20 }),
    ]);

    const iocs = observations.flatMap((o) => iocsFromPayload(o.payload));
    const vendorDomains = vendors
        .map((v) => v.website || v.name)
        .filter((d): d is string => Boolean(d));
    const assetHosts: string[] = [];
    for (const scan of scans) {
        try {
            const parsed = JSON.parse(scan.results) as { assets?: Array<{ ip?: string; hostnames?: string[] }> };
            for (const a of parsed.assets ?? []) {
                if (a.ip) assetHosts.push(a.ip);
                assetHosts.push(...(a.hostnames ?? []));
            }
        } catch {
            // ignore
        }
    }

    const correlate = runIntelCorrelate({ iocs, vendorDomains, assetHosts }, asOf);
    const correlateId = await persistSkillRun(correlate, observations.map((o) => o.id));
    if (correlateId) skillRunIds.push(correlateId);

    let playbooksWithNextStep = 0;
    for (const pb of playbooks) {
        let phases: PlaybookPhase[] = [];
        try {
            phases = JSON.parse(pb.phases) as PlaybookPhase[];
        } catch {
            continue;
        }
        const next = runPlaybookNextStep({ playbookId: pb.id, phases }, asOf);
        const id = await persistSkillRun(next);
        if (id) skillRunIds.push(id);
        if (!next.output.done) playbooksWithNextStep += 1;
    }

    await recordObservation({
        integrationId: 'watcher',
        operation: 'tick',
        requestKey: asOf,
        status: 'ok',
        payload: {
            evidenceExpired: expiry.output.expired.length,
            intelHits: correlate.output.hits.length,
        },
        createdBy: 'watcher:tick',
    });

    return {
        asOf,
        skillRunIds,
        evidenceExpired: expiry.output.expired.length,
        evidenceExpiring: expiry.output.expiring.length,
        intelHits: correlate.output.hits.length,
        playbooksWithNextStep,
    };
}
