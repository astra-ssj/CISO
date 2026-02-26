/**
 * GET /api/intelligence/threats
 * Unified threat intelligence endpoint — aggregates ThreatFox, URLhaus, and MalwareBazaar
 * into a single normalized feed. Used by Command Center Active Threats widget and World Monitor.
 */

import { NextResponse } from 'next/server';
import { AbuseCHClient } from '@/lib/intelligence/clients/abusech-client';
import { recordUpdate, recordError } from '@/lib/intelligence/data-freshness';

const client = new AbuseCHClient();

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// ── Severity Mapping ──────────────────────────────────────────

interface UnifiedThreat {
    id: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    source: 'ThreatFox' | 'URLhaus' | 'MalwareBazaar';
    category: 'malware' | 'ransomware' | 'botnet' | 'phishing' | 'exploit' | 'c2';
    indicator: string;
    indicatorType: string;
    malwareFamily: string | null;
    confidence: number;
    firstSeen: string;
    lastSeen: string;
    tags: string[];
    reference: string | null;
    country: string | null;
}

function classifyThreatFoxSeverity(confidence: number): UnifiedThreat['severity'] {
    if (confidence >= 80) return 'CRITICAL';
    if (confidence >= 50) return 'HIGH';
    if (confidence >= 25) return 'MEDIUM';
    return 'LOW';
}

function classifyCategory(
    threatType: string,
    malware: string,
    tags: string[],
): UnifiedThreat['category'] {
    const lower = `${threatType} ${malware} ${tags.join(' ')}`.toLowerCase();
    if (lower.includes('botnet') || lower.includes('botnet_cc')) return 'botnet';
    if (lower.includes('ransom')) return 'ransomware';
    if (lower.includes('cobalt strike') || lower.includes('c2') || lower.includes('command')) return 'c2';
    if (lower.includes('phish')) return 'phishing';
    if (lower.includes('exploit')) return 'exploit';
    return 'malware';
}

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data, {
                headers: { 'Cache-Control': 'public, max-age=300' },
            });
        }

        // Fetch all three sources in parallel
        const [tfResult, uhResult, mbResult] = await Promise.allSettled([
            client.getRecentIOCs(7),
            client.getRecentMaliciousURLs(100),
            client.getRecentMalware(50),
        ]);

        const threats: UnifiedThreat[] = [];
        const seenIndicators = new Set<string>();

        // ── Normalize ThreatFox IOCs ──
        if (tfResult.status === 'fulfilled') {
            recordUpdate('threatfox');
            for (const ioc of tfResult.value.slice(0, 50)) {
                const indicator = String(ioc.ioc || '');
                if (seenIndicators.has(indicator)) continue;
                seenIndicators.add(indicator);

                threats.push({
                    id: `tf-${ioc.id}`,
                    title: `${ioc.malware_printable || 'Unknown'}: ${ioc.threat_type_desc || ioc.threat_type || 'IOC'} — ${indicator.substring(0, 60)}`,
                    severity: classifyThreatFoxSeverity(Number(ioc.confidence_level || 0)),
                    source: 'ThreatFox',
                    category: classifyCategory(String(ioc.threat_type || ''), String(ioc.malware_printable || ''), ioc.tags || []),
                    indicator,
                    indicatorType: String(ioc.ioc_type || ''),
                    malwareFamily: String(ioc.malware_printable || '') || null,
                    confidence: Number(ioc.confidence_level || 0),
                    firstSeen: String(ioc.first_seen || ''),
                    lastSeen: String(ioc.last_seen || ''),
                    tags: ioc.tags || [],
                    reference: ioc.reference || null,
                    country: null,
                });
            }
        } else {
            recordError('threatfox', 'Failed to fetch');
        }

        // ── Normalize URLhaus URLs ──
        if (uhResult.status === 'fulfilled') {
            recordUpdate('urlhaus');
            for (const u of uhResult.value.slice(0, 30)) {
                const indicator = String(u.url || '');
                if (seenIndicators.has(indicator)) continue;
                seenIndicators.add(indicator);

                const isOnline = u.url_status === 'online';
                threats.push({
                    id: `uh-${u.id}`,
                    title: `Malicious URL${isOnline ? ' (ONLINE)' : ''}: ${String(u.host || '')} — ${String(u.threat || 'unknown threat')}`,
                    severity: isOnline ? 'HIGH' : 'MEDIUM',
                    source: 'URLhaus',
                    category: classifyCategory(String(u.threat || ''), '', u.tags || []),
                    indicator,
                    indicatorType: 'url',
                    malwareFamily: null,
                    confidence: isOnline ? 70 : 40,
                    firstSeen: String(u.date_added || ''),
                    lastSeen: String(u.date_added || ''),
                    tags: u.tags || [],
                    reference: u.urlhaus_reference || null,
                    country: null,
                });
            }
        } else {
            recordError('urlhaus', 'Failed to fetch');
        }

        // ── Normalize MalwareBazaar samples ──
        if (mbResult.status === 'fulfilled') {
            recordUpdate('malware');
            for (const s of mbResult.value.slice(0, 30)) {
                const indicator = String(s.sha256_hash || '');
                if (seenIndicators.has(indicator)) continue;
                seenIndicators.add(indicator);

                const sig = String(s.signature || 'Unknown');
                const isRansomware = sig.toLowerCase().includes('ransom') ||
                    (s.tags || []).some((t: string) => t.toLowerCase().includes('ransom'));
                const ctiScore = typeof (s.intelligence as Record<string, unknown>)?.downloads === 'string'
                    ? Math.min(100, parseInt(String((s.intelligence as Record<string, unknown>).downloads), 10) || 0)
                    : 0;

                threats.push({
                    id: `mb-${s.sha256_hash?.substring(0, 12)}`,
                    title: `${sig} sample: ${String(s.file_type || '')} (${String(s.file_name || indicator.substring(0, 16) + '...')})`,
                    severity: isRansomware ? 'CRITICAL' : ctiScore >= 80 ? 'CRITICAL' : ctiScore >= 50 ? 'HIGH' : 'MEDIUM',
                    source: 'MalwareBazaar',
                    category: isRansomware ? 'ransomware' : 'malware',
                    indicator,
                    indicatorType: 'sha256',
                    malwareFamily: sig !== 'Unknown' ? sig : null,
                    confidence: Math.max(ctiScore, isRansomware ? 80 : 50),
                    firstSeen: String(s.first_seen || ''),
                    lastSeen: String(s.last_seen || s.first_seen || ''),
                    tags: s.tags || [],
                    reference: null,
                    country: s.origin_country || null,
                });
            }
        } else {
            recordError('malware', 'Failed to fetch');
        }

        // Sort: CRITICAL first, then HIGH, then by recency
        const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
        threats.sort((a, b) => {
            const sv = (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
            if (sv !== 0) return sv;
            return new Date(b.firstSeen || 0).getTime() - new Date(a.firstSeen || 0).getTime();
        });

        const response = {
            data: threats.slice(0, 50),
            count: threats.length,
            sources: {
                threatfox: tfResult.status === 'fulfilled',
                urlhaus: uhResult.status === 'fulfilled',
                malwarebazaar: mbResult.status === 'fulfilled',
            },
            fetchedAt: new Date().toISOString(),
            cached: false,
        };

        cache = { data: response, timestamp: Date.now() };
        return NextResponse.json(response, {
            headers: { 'Cache-Control': 'public, max-age=300' },
        });
    } catch (error) {
        console.error('[THREATS API] Error:', error);
        if (cache) {
            return NextResponse.json({ ...(cache.data as object), cached: true, stale: true });
        }
        return NextResponse.json(
            { data: [], error: 'Failed to fetch threat data', cached: false },
            { status: 500 },
        );
    }
}
