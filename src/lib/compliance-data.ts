
export interface FrameworkControl {
    id: string;
    name: string;
    description: string;
    status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
    domain: string;
    lastChecked: Date;
    evidenceCount: number;
    failureReason?: string;
}

export const ISO_DOMAINS = [
    'Policies', 'Organization', 'HR Security', 'Asset Mgmt',
    'Access Control', 'Cryptography', 'Physical', 'Operations',
    'Comms Security', 'DevSecOps', 'Supplier Relationships',
    'Incident Mgmt', 'BCP/DR', 'Compliance'
];

export const MOCK_CONTROLS: FrameworkControl[] = [
    { id: 'A.5.1', name: 'Policies for InfoSec', description: 'Management direction for information security', status: 'COMPLIANT', domain: 'Policies', lastChecked: new Date(), evidenceCount: 12 },
    { id: 'A.9.2', name: 'User Access Provisioning', description: 'Ensure user access rights are authorized', status: 'PARTIAL', domain: 'Access Control', lastChecked: new Date(), evidenceCount: 5, failureReason: '3 users created without tickets' },
    { id: 'A.12.3', name: 'Backup', description: 'Information backup and recovery', status: 'NON_COMPLIANT', domain: 'Operations', lastChecked: new Date(), evidenceCount: 0, failureReason: 'Daily backup failed for Prod-DB-01' },
    { id: 'A.14.2', name: 'Secure Development', description: 'Security in development and support processes', status: 'COMPLIANT', domain: 'DevSecOps', lastChecked: new Date(), evidenceCount: 24 },
    // Populate more dynamically in the store
];

export const generateMockControls = (): FrameworkControl[] => {
    // Generate a full set of Annex A controls
    const controls: FrameworkControl[] = [];
    let counter = 1;

    ISO_DOMAINS.forEach(domain => {
        // Generate 3-5 controls per domain
        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const statusRoll = Math.random();
            const status = statusRoll > 0.85 ? 'NON_COMPLIANT' : (statusRoll > 0.7 ? 'PARTIAL' : 'COMPLIANT');

            controls.push({
                id: `A.${5 + Math.floor(Math.random() * 10)}.${counter++}`,
                name: `${domain} Control ${i + 1}`,
                description: `Ensure adequate ${domain.toLowerCase()} measures are in place.`,
                status: status,
                domain: domain,
                lastChecked: new Date(),
                evidenceCount: Math.floor(Math.random() * 10),
                failureReason: status !== 'COMPLIANT' ? 'Automated check failed: Missing configuration' : undefined
            });
        }
    });
    return controls;
};
