import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

function makePrisma() {
    const dbUrl = process.env.DATABASE_URL || 'file:dev.db';
    const adapter = new PrismaBetterSqlite3({ url: dbUrl });
    // Adapter type from @prisma/adapter-better-sqlite3 is compatible but Prisma client expects a stricter Options type
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
