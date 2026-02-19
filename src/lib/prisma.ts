import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

function makePrisma() {
    const adapter = new PrismaBetterSqlite3({ url: 'file:dev.db' });
    return new PrismaClient({ adapter } as any);
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
