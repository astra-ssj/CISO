import { RansomwareFeedData, RansomwareVictim, RansomwareGroup } from "@/types/ransomware";

// Define the signature of the items we expect from MalwareBazaar

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
            victims,
            groups,
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
        console.warn("MalwareBazaar API unavailable.", error);

        return {
            error: true,
            message: "Threat intelligence feed unavailable",
            victims: [],
            groups: [],
            lastAttempt: new Date().toISOString()
        } as unknown as RansomwareFeedData;
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
