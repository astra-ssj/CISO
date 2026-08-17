import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * v3 decision-loop uses Postgres (GraphJin / OpenNeko cannot read SQLite).
 * DATABASE_URL must be postgresql://...
 */
function makePrisma() {
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
        throw new Error(
            'Astra v3 requires Postgres. Set DATABASE_URL=postgresql://astra:astra@localhost:5432/astra and run: docker compose up -d postgres',
        );
    }
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter } as never);
}

type PrismaClientSingleton = ReturnType<typeof makePrisma>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
