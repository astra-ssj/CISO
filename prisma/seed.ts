import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })
import prisma from '../src/lib/prisma'

async function main() {
    if ((process.env.ASTRA_MODE || '').trim().toLowerCase() !== 'demo') {
        throw new Error(
            'Demo seed refused. Set ASTRA_MODE=demo explicitly before running prisma db seed.'
        );
    }

    console.log('🌱 Starting explicit demo seed...')

    const existingDemoUser = await prisma.user.findUnique({
        where: { email: 'ciso@astra.ai' },
        select: { id: true },
    });
    if (existingDemoUser) {
        console.log('✅ Demo dataset already present; skipping duplicate seed.');
        return;
    }

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
    const existingScenario = await prisma.riskScenario.findFirst({
        where: { title: 'Ransomware Attack on Production DB' },
    })
    if (!existingScenario) {
        await prisma.riskScenario.create({
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
    }

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

    // 4. Vendors
    const awsVendor = await prisma.vendor.create({
        data: {
            name: 'AWS (Amazon Web Services)', 
            category: 'Cloud Provider', 
            status: 'Approved', 
            riskTier: 'Critical',
            riskScore: 92,
            dataAccess: 'Critical',
            contactEmail: 'aws-support@amazon.com',
            complianceCertifications: JSON.stringify(['SOC 2 Type II', 'ISO 27001']),
            notes: 'Core Cloud Infrastructure Provider',
            lastAssessedAt: new Date('2025-11-15T00:00:00Z'),
            nextReviewDate: new Date('2026-11-15T00:00:00Z'),
        }
    })

    await prisma.vendor.create({
        data: {
            name: 'Slack', 
            category: 'SaaS', 
            status: 'Approved', 
            riskTier: 'Medium',
            riskScore: 65,
            dataAccess: 'Medium',
            contactEmail: 'security@slack.com',
            complianceCertifications: JSON.stringify(['SOC 2 Type II']),
            notes: 'Internal Communication Platform',
            lastAssessedAt: new Date('2026-01-10T00:00:00Z'),
            nextReviewDate: new Date('2027-01-10T00:00:00Z'),
        }
    });

    await prisma.vendorAssessment.create({
        data: {
            vendorId: awsVendor.id,
            assessmentDate: new Date('2025-11-15T00:00:00Z'),
            overallScore: 92,
            domainScores: JSON.stringify({}),
            criticalGaps: 0,
            status: 'Complete',
            assessedBy: 'Astra AI'
        },
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
            { type: 'SYSTEM', title: 'Astra seed complete', message: 'Local database seeded. Empty queues are honest — nothing here is a live CVE.', severity: 'INFO', read: false, timestamp: BigInt(Date.now()), actionUrl: '/decisions' },
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
