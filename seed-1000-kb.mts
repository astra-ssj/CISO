const domains = ['A&A', 'AIS', 'BCR', 'CCC', 'CEK', 'DSP', 'GRC', 'HRS', 'IAM', 'IVS', 'SEF'];
const categories = ['Cloud', 'Network', 'Endpoints', 'Data', 'Identity', 'Governance', 'Operations', 'Application'];

const answers = [
    "Yes. This is fully implemented and operational across production environments.",
    "Yes. We enforce this through automated technical controls and quarterly audits.",
    "Yes. Our policy mandates this, and compliance is monitored continuously.",
    "Yes. This is a core component of our security architecture and is tested annually.",
    "Yes. This is standard configuration for all deployments per our hardening guidelines."
];

function getRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
}

const actionTemplates = [
    "Is {tech} configured to enforce {control}?",
    "Are {tech} systems regularly audited for {control}?",
    "Does the organization implement {control} across all {tech} environments?",
    "Is there a documented procedure for {control} in {tech}?",
    "Are {tech} deployments subject to {control} before going into production?",
    "Do you require {control} when accessing {tech}?",
    "Is automated {control} enabled for {tech}?",
    "Are alerts generated when {control} fails on {tech}?",
    "Is {control} tested annually for {tech}?",
    "Is {control} formally reviewed for {tech}?"
];

const technologies = [
    "AWS", "Azure", "GCP", "Kubernetes", "Docker containers", "Linux servers", "Windows servers",
    "macOS endpoints", "Oracle databases", "PostgreSQL databases", "MongoDB clusters",
    "Redis caches", "React frontends", "Node.js backends", "Active Directory", "Okta",
    "Cisco routers", "Palo Alto firewalls", "Nginx load balancers", "Apache web servers",
    "Employee workstations", "Mobile devices", "IoT devices", "CI/CD pipelines", "GitHub repositories",
    "GitLab instances", "Jenkins servers", "Terraform modules", "Ansible playbooks", "S3 buckets"
];

const controls = [
    "multi-factor authentication (MFA)", "AES-256 encryption at rest", "TLS 1.2+ encryption in transit",
    "role-based access control (RBAC)", "least privilege access", "quarterly access reviews",
    "daily automated backups", "disaster recovery failover", "vulnerability scanning",
    "penetration testing", "static application security testing (SAST)", "dynamic application security testing (DAST)",
    "software composition analysis (SCA)", "data loss prevention (DLP)", "intrusion detection (IDS)",
    "intrusion prevention (IPS)", "security information and event management (SIEM) logging",
    "anti-malware protection", "endpoint detection and response (EDR)", "patch management",
    "configuration hardening", "zero trust network access (ZTNA)", "network segmentation",
    "web application firewall (WAF) filtering", "rate limiting and DDoS protection",
    "data retention policies", "data classification labeling", "incident response playbooks",
    "business impact analysis (BIA)", "background screening"
];

interface SeedEntry {
    questionText: string;
    answer: string;
    yesNo: string;
    confidence: number;
    domain: string;
    category: string;
    evidenceRef: string;
    source: string;
}

const entries: SeedEntry[] = [];
let count = 0;

for (const tech of technologies) {
    for (const control of controls) {
        for (const template of actionTemplates) {
            if (count >= 1000) break;

            const questionText = template.replace('{tech}', tech).replace('{control}', control);

            entries.push({
                questionText,
                answer: getRandom(answers),
                yesNo: 'YES',
                confidence: 1.0,
                domain: getRandom(domains),
                category: getRandom(categories),
                evidenceRef: 'Internal Security Policy v' + (Math.floor(Math.random() * 5) + 1) + '.0',
                source: 'Automated 1000 KB Seed'
            });
            count++;
        }
        if (count >= 1000) break;
    }
    if (count >= 1000) break;
}

async function run() {
    console.log("Fetching existing entries to delete...");
    const existingRes = await fetch('http://localhost:3000/api/knowledge?page=1&pageSize=10000');
    const existingData = await existingRes.json();

    if (existingData.entries && existingData.entries.length > 0) {
        console.log(`Found ${existingData.entries.length} entries to delete...`);
        let deleted = 0;
        for (const entry of existingData.entries) {
            await fetch(`http://localhost:3000/api/knowledge/${entry.id}`, { method: 'DELETE' });
            deleted++;
            if (deleted % 50 === 0) console.log(`Deleted ${deleted} entries...`);
        }
    }

    console.log(`Ingesting ${entries.length} new entries via API...`);

    const batchSize = 250;
    let created = 0;
    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        console.log(`Sending batch ${i} to ${i + batch.length}...`);
        const res = await fetch('http://localhost:3000/api/knowledge/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: batch, source: 'Automated 1000 KB Seed' }),
        });
        const d = await res.json();
        if (res.ok && d.success) {
            created += d.created;
        } else {
            console.error("Batch failed:", d);
        }
    }

    console.log(`Finished! Total created: ${created}`);

    const sr = await fetch('http://localhost:3000/api/knowledge?stats=true');
    const s = await sr.json();
    console.log(`\n📊 Knowledge Base Now Has:`);
    console.log(`   Total entries: ${s.total}`);
}

run().catch(console.error);
