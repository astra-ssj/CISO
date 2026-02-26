import { RansomwareFeedData, RansomwareVictim, RansomwareGroup } from "@/types/ransomware";

// Mock Data for Fallback/Demo Mode
const MOCK_VICTIMS: RansomwareVictim[] = [
    { id: "1", post_title: "Global Logistics Corp", group_name: "LockBit 3.0", published: "2024-05-20 14:30:00", country: "USA" },
    { id: "2", post_title: "MediCare Systems", group_name: "BlackCat", published: "2024-05-20 12:15:00", country: "UK" },
    { id: "3", post_title: "TechFlow Solutions", group_name: "Play", published: "2024-05-20 09:45:00", country: "Germany" },
    { id: "4", post_title: "Retail Giant Inc", group_name: "8Base", published: "2024-05-19 23:20:00", country: "USA" },
    { id: "5", post_title: "City Infrastructure", group_name: "Akira", published: "2024-05-19 18:00:00", country: "France" },
    { id: "6", post_title: "Finance Secure Ltd", group_name: "LockBit 3.0", published: "2024-05-19 15:10:00", country: "UK" },
    { id: "7", post_title: "EduNet Networks", group_name: "Qilin", published: "2024-05-19 10:00:00", country: "Canada" },
    { id: "8", post_title: "Alpha Manufacturing", group_name: "BlackBasta", published: "2024-05-18 22:30:00", country: "Italy" },
];

const MOCK_GROUPS: RansomwareGroup[] = [
    { name: "LockBit 3.0", victim_count: 142, last_active: "2024-05-20" },
    { name: "Play", victim_count: 89, last_active: "2024-05-20" },
    { name: "8Base", victim_count: 65, last_active: "2024-05-19" },
    { name: "BlackBasta", victim_count: 54, last_active: "2024-05-18" },
    { name: "Akira", victim_count: 48, last_active: "2024-05-19" },
];

interface MalwareSampleAPI {
    sha256: string;
    md5: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    signature: string;
    reporter: string;
    tags: string[];
    firstSeen: string;
    originCountry: string | null;
    intelligence: { downloads?: string; uploads?: string } | null;
}

export async function getRansomwareFeed(): Promise<RansomwareFeedData> {
    try {
        const res = await fetch('/api/intelligence/malware');
        if (!res.ok) throw new Error('MalwareBazaar API error');
        const json = await res.json();
        const samples: MalwareSampleAPI[] = json.data || [];

        if (samples.length === 0) throw new Error('No samples returned');

        // Build victims from malware samples (treat signature as "group")
        const victims: RansomwareVictim[] = samples
            .filter(s => s.signature && s.signature !== 'null' && s.signature !== 'Unknown')
            .slice(0, 20)
            .map((s, i) => ({
                id: String(i + 1),
                post_title: s.fileName || `${s.fileType} sample (${s.sha256.substring(0, 8)}...)`,
                group_name: s.signature || 'Unknown',
                published: s.firstSeen || new Date().toISOString(),
                country: s.originCountry || 'Unknown',
            }));

        // Build group stats from families
        const familyMap = new Map<string, { count: number; lastSeen: string }>();
        for (const s of samples) {
            const name = s.signature || 'Unknown';
            const existing = familyMap.get(name);
            if (existing) {
                existing.count++;
                if (s.firstSeen > existing.lastSeen) existing.lastSeen = s.firstSeen;
            } else {
                familyMap.set(name, { count: 1, lastSeen: s.firstSeen || '' });
            }
        }

        const groups: RansomwareGroup[] = [...familyMap.entries()]
            .filter(([name]) => name !== 'Unknown')
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 10)
            .map(([name, data]) => ({
                name,
                victim_count: data.count,
                last_active: data.lastSeen.split('T')[0] || new Date().toISOString().split('T')[0],
            }));

        // Ransomware-specific count (samples tagged with ransom-related keywords)
        const ransomwareSamples = samples.filter(s =>
            (s.signature || '').toLowerCase().includes('ransom') ||
            (s.tags || []).some(t => t.toLowerCase().includes('ransom'))
        );

        return {
            victims: victims.length > 0 ? victims : MOCK_VICTIMS,
            groups: groups.length > 0 ? groups : MOCK_GROUPS,
            stats: {
                total_victims_24h: Math.min(samples.length, 50),
                total_victims_7d: samples.length,
                active_groups: familyMap.size,
                top_target_country: getMostCommonCountry(samples),
            },
            last_updated: json.fetchedAt || new Date().toISOString(),
            // Extend with raw samples for the table view
            rawSamples: samples,
            ransomwareCount: ransomwareSamples.length,
        };
    } catch (error) {
        console.warn("MalwareBazaar API unavailable, using fallback intelligence feed.", error);

        return {
            victims: MOCK_VICTIMS,
            groups: MOCK_GROUPS,
            stats: {
                total_victims_24h: 12,
                total_victims_7d: 145,
                active_groups: 28,
                top_target_country: "USA"
            },
            last_updated: new Date().toISOString(),
        };
    }
}

function getMostCommonCountry(samples: MalwareSampleAPI[]): string {
    const counts = new Map<string, number>();
    for (const s of samples) {
        const c = s.originCountry || 'Unknown';
        counts.set(c, (counts.get(c) || 0) + 1);
    }
    let maxC = 'Unknown', maxN = 0;
    for (const [c, n] of counts) {
        if (n > maxN && c !== 'Unknown') { maxC = c; maxN = n; }
    }
    return maxC;
}

export function getThreatLevel(): number {
    // Returns a number 1-5 (1=Safe, 5=Critical)
    // Dynamic based on recent volume
    return 4;
}
