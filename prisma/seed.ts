import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

const dbUrl = process.env.DATABASE_URL || 'file:dev.db'
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter } as never)

async function main() {
    console.log('🌱 Starting seed...')

    // Passwords for NextAuth credentials (min 6 chars for auth.ts zod)
    const cisoHash = await bcrypt.hash('admin123', 10)
    const analystHash = await bcrypt.hash('user123', 10)
    const auditorHash = await bcrypt.hash('auditor123', 10)

    // 1. Create Users (with hashed passwords for NextAuth)
    const ciso = await prisma.user.upsert({
        where: { email: 'ciso@astra.ai' },
        update: { password: cisoHash },
        create: {
            email: 'ciso@astra.ai',
            name: 'Sarah Connor',
            role: 'CISO',
            password: cisoHash,
        },
    })

    await prisma.user.upsert({
        where: { email: 'analyst@astra.ai' },
        update: { password: analystHash },
        create: {
            email: 'analyst@astra.ai',
            name: 'Security Analyst',
            role: 'SEC_ENGINEER',
            password: analystHash,
        },
    })

    await prisma.user.upsert({
        where: { email: 'auditor@astra.ai' },
        update: { password: auditorHash },
        create: {
            email: 'auditor@astra.ai',
            name: 'External Auditor',
            role: 'AUDITOR',
            password: auditorHash,
        },
    })

    // 2. Create Initial Risks (FAIR Model)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // 4. Vendors (simple list)
    await prisma.vendor.createMany({
        data: [
            { name: 'AWS (Amazon Web Services)', serviceDescription: 'Core Cloud Infrastructure Provider', tier: 'TIER_1_CRITICAL', status: 'ACTIVE', lastAssessmentDate: '2025-11-15', inherentRiskScore: 92, contactEmail: 'aws-support@amazon.com' },
            { name: 'Slack', serviceDescription: 'Internal Communication Platform', tier: 'TIER_2_HIGH', status: 'ACTIVE', lastAssessmentDate: '2026-01-10', inherentRiskScore: 65, contactEmail: 'security@slack.com' },
        ],
    })

    // 5. Vendor Risk (rich)
    const vRisk = await prisma.vendorRisk.create({
        data: {
            name: 'CloudScale AWS',
            category: 'CLOUD_INFRASTRUCTURE',
            description: 'Primary cloud infrastructure provider.',
            status: 'APPROVED',
            riskTier: 'MEDIUM',
            riskScore: 42,
            dataAccess: JSON.stringify(['PII', 'FINANCIAL', 'OPERATIONAL']),
            complianceCertifications: JSON.stringify(['SOC 2 Type II', 'ISO 27001']),
            contractExpiry: '2027-03-15',
            lastAssessment: '2026-01-10',
            contactName: 'Sarah Chen',
            contactEmail: 'sarah@cloudscale.example',
            notes: 'Tier 1 critical vendor.',
        },
    })
    await prisma.vendorAssessment.create({
        data: { vendorRiskId: vRisk.id, date: '2026-01-10', score: 42, findings: JSON.stringify(['Shared responsibility gaps']), assessor: 'Internal Audit' },
    })

    // 6. Evidence
    await prisma.evidence.createMany({
        data: [
            { title: 'Information Security Policy v3.1', fileName: 'infosec-policy-v3.1.pdf', fileSize: 245000, mimeType: 'application/pdf', filePath: '', category: 'POLICY', status: 'ACTIVE', uploadedBy: ciso.id, uploadedByName: 'CISO Office', frameworks: JSON.stringify(['ISO 27001:A.5.1', 'NIST CSF:GV.OC-01']), tags: JSON.stringify(['policy', 'annual-review']) },
            { title: 'SOC 2 Type II Report 2025', fileName: 'soc2-typeii-2025.pdf', fileSize: 1800000, mimeType: 'application/pdf', filePath: '', category: 'AUDIT_REPORT', status: 'ACTIVE', expiresAt: new Date('2026-12-20'), uploadedBy: ciso.id, uploadedByName: 'External Auditor', frameworks: JSON.stringify(['SOC 2:CC6.1', 'NIST CSF:PR.AA-01']), tags: JSON.stringify(['soc2', 'audit']) },
        ],
    })

    // 7. Objectives & Projects
    await prisma.objective.create({
        data: {
            title: 'Reduce aggregate risk exposure by 30%',
            description: 'Lower total ALE through targeted risk treatments.',
            quarter: 'Q1',
            year: 2026,
            owner: 'CISO',
            status: 'ON_TRACK',
            keyResults: JSON.stringify([
                { id: 'KR-001-1', title: 'Achieve 95% patch SLA compliance', targetValue: 95, currentValue: 82, unit: '%', isAutoTracked: true, status: 'AT_RISK' },
                { id: 'KR-001-2', title: 'Complete FAIR analysis for top 20 assets', targetValue: 20, currentValue: 14, unit: 'count', isAutoTracked: false, status: 'ON_TRACK' },
            ]),
            linkedRisks: JSON.stringify(['RS-001']),
        },
    })
    await prisma.project.create({
        data: {
            title: 'Zero Trust Network Migration',
            description: 'Implement zero trust architecture.',
            owner: 'CISO',
            status: 'IN_PROGRESS',
            priority: 'CRITICAL',
            budgetAllocated: 450000,
            budgetSpent: 185000,
            linkedObjectives: JSON.stringify(['OBJ-001']),
            linkedRisks: JSON.stringify(['RS-001']),
            startDate: '2026-01-15',
            targetEndDate: '2026-09-30',
            tags: JSON.stringify(['infrastructure', 'zero-trust']),
            phases: JSON.stringify([
                { id: 'P1', title: 'Identity & Access Foundation', startDate: '2026-01-15', endDate: '2026-03-31', status: 'IN_PROGRESS', progress: 72, milestones: [] },
            ]),
        },
    })

    // 8. Notifications & Alert Rules
    await prisma.notification.createMany({
        data: [
            { type: 'THREAT', title: 'Critical CVE Detected', message: 'CVE-2026-1234 found in express@4.18.2 — RCE. CVSS 9.8.', severity: 'CRITICAL', read: false, timestamp: Date.now() - 300000, actionUrl: '/appsec' },
            { type: 'COMPLIANCE', title: 'NIST CSF Compliance', message: 'Overall compliance score above 70%.', severity: 'INFO', read: true, timestamp: Date.now() - 86400000 },
        ],
    })
    await prisma.alertRule.createMany({
        data: [
            { name: 'Critical CVE Alert', condition: 'cvss_score > threshold', threshold: 9.0, enabled: true, notificationType: 'THREAT' },
            { name: 'Compliance Score Drop', condition: 'compliance_score < threshold', threshold: 70, enabled: true, notificationType: 'COMPLIANCE' },
        ],
    })

    // 9. Playbooks
    await prisma.playbook.createMany({
        data: [
            {
                title: 'Ransomware Response Protocol',
                description: 'SOP for containment and eradication of ransomware.',
                severity: 'CRITICAL',
                status: 'READY',
                phases: JSON.stringify([
                    { id: 'phase-1', title: '1. Identification & Analysis', status: 'PENDING', steps: [{ id: '1.1', instruction: 'Isolate affected systems immediately.', type: 'CHECKBOX', isCompleted: false }] },
                    { id: 'phase-2', title: '2. Containment', status: 'PENDING', steps: [{ id: '2.1', instruction: 'Disable compromised user accounts.', type: 'CHECKBOX', isCompleted: false }] },
                ]),
                evidenceLog: JSON.stringify([]),
            },
            {
                title: 'DDoS Mitigation',
                description: 'Response plan for volumetric and application layer DoS.',
                severity: 'HIGH',
                status: 'READY',
                phases: JSON.stringify([
                    { id: 'phase-1', title: '1. Assessment', status: 'PENDING', steps: [{ id: '1.1', instruction: 'Verify if traffic is attack or legitimate surge.', type: 'CHECKBOX', isCompleted: false }] },
                ]),
                evidenceLog: JSON.stringify([]),
            },
        ],
    })

    // 10. Knowledge Repository — seed all 1000+ entries using the child scripts
    const { execSync } = await import('child_process');
    console.log('🌱 Delegating Knowledge Repository seeding to specialized scripts...');

    try {
        execSync('npx tsx prisma/seeds/seed-caiq.ts', { stdio: 'inherit' });
        execSync('npx tsx prisma/seeds/seed-baseline.ts', { stdio: 'inherit' });
        execSync('npx tsx prisma/seeds/seed-frameworks.ts', { stdio: 'inherit' });
        execSync('npx tsx prisma/seeds/seed-volume.ts', { stdio: 'inherit' });
        console.log('✅ All Knowledge Repository seeds completed.');
    } catch (e) {
        console.error('❌ Failed to run knowledge repository seed scripts:', e);
    }

    console.log('✅ Main Seed complete!');
    console.log(`Created user: ${ciso.name}`);
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
