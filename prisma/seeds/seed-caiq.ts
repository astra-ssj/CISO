import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import 'dotenv/config';
import { config } from 'dotenv';
import { CAIQ_KNOWLEDGE_BASE } from '../../src/lib/caiq/caiq-knowledge-base';
import { normalizeQuestion, extractKeywords } from '../../src/lib/knowledge/repository';

config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL || 'file:dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
    console.log('🌱 Seeding CAIQ Knowledge Base (261 entries)...');

    let created = 0;
    let skipped = 0;

    for (const entry of CAIQ_KNOWLEDGE_BASE) {
        const normalized = normalizeQuestion(entry.question);

        // Dedup by normalized question
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = await (prisma as any).knowledgeEntry.findFirst({
            where: { questionNormalized: normalized }
        });

        if (existing) {
            skipped++;
            continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).knowledgeEntry.create({
            data: {
                questionText: entry.question,
                questionNormalized: normalized,
                keywords: entry.keywords?.length ? entry.keywords.join(',') : extractKeywords(entry.question),
                domain: entry.domain,
                category: entry.domainName,
                answerType: entry.yesNo,
                answerText: entry.answer,
                evidence: entry.evidenceRef,
                source: 'CAIQ v4 Baseline',
                confidence: 1.0,
                approvedBy: 'SYSTEM',
                approvedAt: new Date(),
            }
        });
        created++;
    }

    console.log(`✅ Seed complete! Created: ${created}, Skipped: ${skipped}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
