import 'dotenv/config';
import { config } from 'dotenv';
import { normalizeQuestion, extractKeywords } from '../../src/lib/knowledge/repository';
import prisma from '../../src/lib/prisma';

config({ path: '.env.local' });

// --- High Volume Generator ---
// We will generate hundreds of distinct, highly specific technical questions by combining:
// System -> Component -> Security Control -> Operation

const systems = [
    { name: "AWS infrastructure", dom: "IAAS", cat: "Cloud Security" },
    { name: "Azure environments", dom: "IAAS", cat: "Cloud Security" },
    { name: "SaaS applications", dom: "SAAS", cat: "Application Security" },
    { name: "on-premise datacenters", dom: "DCS", cat: "Physical Security" },
    { name: "containerized workloads", dom: "CWP", cat: "Infrastructure Security" },
    { name: "serverless functions", dom: "CWP", cat: "Application Security" },
    { name: "edge networking devices", dom: "NET", cat: "Network Security" },
    { name: "corporate workstations", dom: "END", cat: "Endpoint Security" }
];

const components = [
    "management plane", "data plane", "API gateways", "load balancers",
    "object storage", "relational databases", "NoSQL data stores", "cache clusters",
    "message queues", "identity providers"
];

const controls = [
    { verb: "enforce strict rate limiting on", ans: "Yes, rate limiting is strictly enforced at the edge via our Web Application Firewall (WAF) and at the application layer to prevent volumetric attacks.", fw: "NIST:PR.PT-4" },
    { verb: "implement zero-trust access for", ans: "Zero-Trust Network Access (ZTNA) is fully implemented. Access requires continuous device posture checks, MFA, and is restricted to least-privilege micro-perimeters.", fw: "NIST:PR.AC-5" },
    { verb: "automate the rotation of secrets for", ans: "Secrets management is entirely automated via HashiCorp Vault. Passwords, API keys, and certificates are rotated automatically on a 30-day schedule without human intervention.", fw: "ISO27001:A.10.1.2" },
    { verb: "ensure temporal isolation for", ans: "Workloads are temporally isolated using ephemeral containers and immutable infrastructure patterns. No production instances live longer than 14 days.", fw: "SOC2:CC7.2" },
    { verb: "conduct dynamic application security testing (DAST) on", ans: "DAST is integrated into our weekly release cycles, automatically scanning pre-production environments for OWASP Top 10 vulnerabilities.", fw: "ISO27001:A.14.2.8" },
    { verb: "apply data loss prevention (DLP) across", ans: "DLP agents actively monitor for and block the unauthorized exfiltration of sensitive data patterns (e.g., PII, PHI, PCI) via web, email, and USB channels.", fw: "GDPR:Art32" },
    { verb: "perform configuration drift detection for", ans: "Configuration baseline drift is monitored continuously using Infrastructure as Code (IaC) state comparison tools. Deviations trigger immediate P1 alerts.", fw: "SOC2:CC7.1" },
    { verb: "manage the software bill of materials (SBOM) for", ans: "We generate and ingest SBOMs for every build artifact. Vulnerability scanning is performed continuously against this component inventory to detect supply chain risks.", fw: "NIST:PR.DS-8" }
];

async function main() {
    console.log('🌱 Generating and Seeding High Volume Technical Library...');

    // 8 systems * 10 components * 8 controls = 640 distinct questions
    const generated = [];

    for (const sys of systems) {
        for (const comp of components) {
            for (const ctrl of controls) {
                const q = `How do you ${ctrl.verb} the ${comp} within your ${sys.name}?`;
                generated.push({
                    q,
                    a: ctrl.ans,
                    cat: sys.cat,
                    dom: sys.dom,
                    ev: "System Architecture & Security Controls Matrix",
                    fw: ctrl.fw
                });
            }
        }
    }

    console.log(`Generated ${generated.length} unique technical questions.`);

    let created = 0;
    let skipped = 0;

    for (const entry of generated) {
        const normalized = normalizeQuestion(entry.q);

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
                keywords: extractKeywords(entry.q),
                domain: entry.dom,
                category: entry.cat,
                answerType: entry.a.toLowerCase().startsWith('yes') ? 'YES' : 'CONDITIONAL',
                answerText: entry.a,
                evidence: entry.ev,
                frameworks: entry.fw ? JSON.stringify([{ framework: entry.fw.split(':')[0], controlId: entry.fw.split(':')[1] }]) : null,
                source: 'Technical Controls Library',
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
