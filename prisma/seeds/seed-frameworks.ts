import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import 'dotenv/config';
import { config } from 'dotenv';
import { normalizeQuestion, extractKeywords } from '../../src/lib/knowledge/repository';

config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL || 'file:dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as never);

// --- Framework Generators ---

function generateGDPR() {
    const subjects = ["employee data", "customer PII", "financial records", "sensitive health data", "marketing lists", "third-party cookies"];
    const actions = [
        { verb: "obtain explicit consent for", ans: "Yes. Consent is explicitly acquired via our self-service privacy portal prior to any data processing. Consent records are immutably logged.", fw: "GDPR:Art7" },
        { verb: "facilitate the right to erasure for", ans: "Data subjects can exercise their right to be forgotten via our automated DSAR tool, which completely purges records from active DBs within 72 hours.", fw: "GDPR:Art17" },
        { verb: "govern cross-border transfers of", ans: "All out-of-region data transfers are strictly governed by Standard Contractual Clauses (SCCs) and require explicit Data Protection Officer (DPO) authorization.", fw: "GDPR:Art46" },
        { verb: "perform Data Protection Impact Assessments (DPIAs) on", ans: "We mandate comprehensive DPIAs for all net-new high-risk data processing activities. Findings are reviewed and signed off by our legal and privacy teams.", fw: "GDPR:Art35" },
        { verb: "enforce purpose limitation when processing", ans: "Data is strictly processed only for the specific, explicit, and legitimate purposes for which it was originally collected. Anomalous querying triggers security alerts.", fw: "GDPR:Art5(1)(b)" },
        { verb: "maintain records of processing activities (RoPA) for", ans: "A centralized, dynamic RoPA is maintained in our governance platform, detailing the categories of processing, data subjects, and recipients.", fw: "GDPR:Art30" }
    ];
    return combine(subjects, actions, "Privacy", "DSP", "GDPR Requirements Policy");
}

function generateNIS2() {
    const subjects = ["critical supply chain vendors", "cloud infrastructure providers", "managed service providers", "software dependencies"];
    const actions = [
        { verb: "assess the cybersecurity posture of", ans: "We mandate comprehensive vendor risk assessments leveraging standardized questionnaires and continuous attack surface monitoring prior to onboarding.", fw: "NIS2:Art21(2)(d)" },
        { verb: "report significant incidents affecting", ans: "Per NIS2 obligations, early warnings for significant incidents are transmitted to the relevant CSIRT or competent authority within 24 hours.", fw: "NIS2:Art23(1)" },
        { verb: "ensure business continuity for", ans: "Business Continuity Plans (BCPs) are rigorously maintained and tested targeting a maximum allowable downtime (MAD) of 4 hours for critical functions.", fw: "NIS2:Art21(2)(c)" },
        { verb: "implement basic cyber hygiene practices for", ans: "Strict cyber hygiene is enforced globally, including mandated zero-trust network access, robust patch management SLAs, and continuous security awareness training.", fw: "NIS2:Art21(2)(g)" },
        { verb: "secure the procurement of", ans: "Security requirements are explicitly embedded into procurement standard operating procedures, ensuring security-by-design for all third-party integrations.", fw: "NIS2:Art21(2)(d)" }
    ];
    return combine(subjects, actions, "Compliance", "GRC", "NIS2 Governance Plan");
}

function generateISO27001() {
    const subjects = ["information assets", "removable media", "teleworking environments", "cryptographic keys", "system logs", "source code"];
    const actions = [
        { verb: "maintain an accurate inventory of", ans: "A dynamic asset inventory is maintained via agent-based discovery tools. Assets are classified according to their criticality and associated risk.", fw: "ISO27001:A.8.1.1" },
        { verb: "restrict physical access to", ans: "Physical access is continuously monitored by CCTV and restricted by biometric authentication. Unescorted visitor access is strictly prohibited.", fw: "ISO27001:A.11.1.2" },
        { verb: "protect against malware targeting", ans: "Next-generation endpoint detection and response (EDR) agents are deployed globally, functioning alongside network-based intrusion prevention systems (IPS).", fw: "ISO27001:A.12.2.1" },
        { verb: "manage vulnerabilities affecting", ans: "Weekly authenticated vulnerability scans are executed. Critical CVSS scores mandate a 48-hour remediation SLA tracked via our ticketing platform.", fw: "ISO27001:A.12.6.1" },
        { verb: "ensure the secure disposal of", ans: "Secure disposal is executed in accordance with NIST 800-88 standards. Media is physically pulverized and cryptographic erasure is enforced for cloud volumes.", fw: "ISO27001:A.8.3.2" },
        { verb: "control access rights to", ans: "Access rights are provisioned exclusively via Role-Based Access Control (RBAC) and subjected to automated quarterly access reviews by data owners.", fw: "ISO27001:A.9.2.5" }
    ];
    return combine(subjects, actions, "Access Control", "IAM", "ISO Statement of Applicability (SoA)");
}

function generateNISTCSF() {
    const subjects = ["network perimeters", "cloud endpoints", "industrial control systems (ICS)", "third-party integrations"];
    const actions = [
        { verb: "Identify threats to", ans: "We maintain a rigorous threat intelligence program. Cyber threat data is aggregated from multiple global sources and integrated directly into our SIEM.", fw: "NIST:ID.RA-3" },
        { verb: "Protect the confidentiality of", ans: "Confidentiality is protected via robust identity verification, granular authorization (RBAC), and AES-256 encryption at rest.", fw: "NIST:PR.DS-1" },
        { verb: "Detect anomalous events affecting", ans: "Continuous 24/7 security monitoring is empowered by advanced AI-driven behavioral analytics, ensuring rapid anomaly detection.", fw: "NIST:DE.CM-1" },
        { verb: "Respond to active compromises of", ans: "Our Incident Response team executes predefined playbooks prioritizing rapid containment and eradication. Legal counsel is engaged concurrently for data breach analysis.", fw: "NIST:RS.AN-1" },
        { verb: "Recover data and services for", ans: "Recovery procedures prioritize the restoration from immutable, air-gapped backups. Full recovery is validated bi-annually during disaster recovery exercises.", fw: "NIST:RC.RP-1" }
    ];
    return combine(subjects, actions, "Security Event Management", "SEF", "NIST System Security Plan (SSP)");
}

function generateSOC2() {
    const subjects = ["processing integrity", "system availability", "confidentiality of data", "logical access", "system changes"];
    const actions = [
        { verb: "monitor the operational effectiveness of", ans: "Operational effectiveness is continuously monitored via synthetic transactions and real-user monitoring. Alerts are configured for any degradation in SLAs.", fw: "SOC2:CC4.1" },
        { verb: "communicate security responsibilities regarding", ans: "Security responsibilities are explicitly communicated during initial onboarding and reinforced via mandatory annual security awareness training.", fw: "SOC2:CC2.2" },
        { verb: "assess and mitigate risks to", ans: "Formal enterprise risk assessments are conducted annually. Identified risks are documented in a centralized risk register and assigned explicit mitigation plans.", fw: "SOC2:CC3.1" },
        { verb: "authorize system access for", ans: "Access is strictly authorized based on the principle of least privilege. Approvals require multi-tiered authorization tracked via our identity governance platform.", fw: "SOC2:CC6.2" },
        { verb: "manage the deployment pipeline for", ans: "All deployments are managed via a strict CI/CD pipeline requiring mandatory peer review, automated static analysis (SAST), and dynamic scanning (DAST).", fw: "SOC2:CC8.1" }
    ];
    return combine(subjects, actions, "Change Control", "CCC", "SOC 2 Type II Report");
}

function combine(subjects: string[], actions: Array<{ verb: string; ans: string; fw: string }>, category: string, domain: string, evidence: string) {
    const results = [];
    let counter = 0;
    for (const a of actions) {
        for (const s of subjects) {
            const phrased = counter % 2 === 0
                ? `How does your organization ${a.verb} ${s}?`
                : `Describe the controls used to ${a.verb} ${s}.`;

            results.push({
                q: phrased,
                a: a.ans,
                cat: category,
                dom: domain,
                ev: evidence,
                fw: a.fw
            });
            counter++;
        }
    }
    return results;
}

async function main() {
    console.log('🌱 Generating and Seeding Framework-Specific Library...');

    // Total: 36 + 20 + 36 + 20 + 25 = 137 questions here.
    const allQuestions = [
        ...generateGDPR(),
        ...generateNIS2(),
        ...generateISO27001(),
        ...generateNISTCSF(),
        ...generateSOC2()
    ];

    // Add variations to hit ~240
    const variations = [];
    for (const base of allQuestions) {
        if (Math.random() > 0.3) {
            variations.push({
                q: base.q.replace('How does your organization', 'Do you').replace('Describe the controls used to', 'Have you implemented controls to'),
                a: "Yes. " + base.a,
                cat: base.cat,
                dom: base.dom,
                ev: base.ev,
                fw: base.fw
            });
        }
    }

    const finalSet = [...allQuestions, ...variations];

    console.log(`Generated ${finalSet.length} unique framework questions.`);

    let created = 0;
    let skipped = 0;

    for (const entry of finalSet) {
        const normalized = normalizeQuestion(entry.q);
        const keywords = extractKeywords(entry.q);

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
                questionText: entry.q,
                questionNormalized: normalized,
                keywords: keywords,
                domain: entry.dom,
                category: entry.cat,
                answerType: entry.a.toLowerCase().startsWith('yes') ? 'YES' : 'CONDITIONAL',
                answerText: entry.a,
                evidence: entry.ev,
                frameworks: entry.fw ? JSON.stringify([{ framework: entry.fw.split(':')[0], controlId: entry.fw.split(':')[1] }]) : null,
                source: 'Framework Standards Library',
                confidence: 1.0,
                approvedBy: 'SYSTEM',
                approvedAt: new Date(),
            }
        });
        created++;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log(`✅ Seed complete! Created: ${created}, Skipped: ${skipped} (Total in DB: ${await (prisma as any).knowledgeEntry.count()})`);
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
