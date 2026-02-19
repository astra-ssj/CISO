import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import 'dotenv/config'

const libsql = createClient({
    url: "file:dev.db",
})

const adapter = new PrismaLibSql(libsql as any)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Starting seed...')

    // 1. Create Users
    const ciso = await prisma.user.upsert({
        where: { email: 'ciso@astra.ai' },
        update: {},
        create: {
            email: 'ciso@astra.ai',
            name: 'Sarah Connor',
            role: 'CISO',
        },
    })

    // 2. Create Initial Risks (FAIR Model)
    const ransomwareRisk = await prisma.riskScenario.create({
        data: {
            title: 'Ransomware Attack on Production DB',
            description: 'Scenario: LockBit 3.0 encrypts main customer database.',
            ownerId: ciso.id,
            status: 'MITIGATING',
            threatActor: 'CYBER_CRIMINAL',
            threatEventFreq: 0.5, // Once every 2 years
            vulnerability: 0.3,   // 30% chance of success
            primaryLoss: 2000000, // $2M ransom
            secondaryLoss: 5000000, // $5M reputation/fines
            controlsEffective: 0.4,
            ale: 2100000, // Calculated manually for seed
            riskScore: 85,
        },
    })

    // 3. Create a Policy
    const passwordPolicy = await prisma.policy.create({
        data: {
            title: 'Global Password Standard',
            content: '# Password Policy\n\n1. Minimum 14 characters.\n2. MFA required.',
            version: '1.0.0',
            status: 'APPROVED',
            authorId: ciso.id,
            frameworks: JSON.stringify(['NIST_CSF_2_0', 'ISO_27001']),
            controls: JSON.stringify(['PR.AC-1', 'A.9.2']),
        },
    })

    console.log('✅ Seed complete!')
    console.log(`Created user: ${ciso.name}`)
    console.log(`Created risk: ${ransomwareRisk.title}`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
