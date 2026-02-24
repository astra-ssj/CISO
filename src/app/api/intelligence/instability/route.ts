import { NextResponse } from 'next/server';
import { computeAllCII, type CIIResult } from '@/lib/intelligence/instability-index';
import type { IntelligenceSignal } from '@/lib/intelligence/signal-aggregator';

/**
 * GET /api/intelligence/instability
 *
 * Computes the Country Instability Index (CII) for all tracked countries
 * using the weighted blend algorithm: baseline (40%), unrest (20%),
 * security (20%), info velocity (20%).
 *
 * Query params:
 * - threshold: CII threshold for alerts (default: 50)
 * - countries: comma-separated ISO codes to filter (optional)
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const threshold = Number(searchParams.get('threshold') || '50');
        const countryFilter = searchParams.get('countries')?.split(',').map(c => c.trim().toUpperCase());

        // Default tracked countries (would be from Company model in production)
        const defaultCountries = [
            'UA', 'SD', 'MM', 'SY', 'YE', 'HT', 'SO', 'AF', 'CD', 'LY',
            'ET', 'PK', 'LB', 'VE', 'IQ', 'NG', 'IR', 'RU', 'CN', 'US',
            'DE', 'GB', 'FR', 'AT', 'ES', 'AU', 'NZ', 'TH', 'SG', 'JP',
            'KR', 'IN', 'IL', 'TR', 'EG', 'SA', 'AE', 'ZA', 'BR', 'CA',
        ];

        const countries = countryFilter || defaultCountries;

        // In production, signals would come from aggregated API feeds
        // For now, use empty signals (only baseline scores)
        const signals: IntelligenceSignal[] = [];

        const results = computeAllCII(countries, signals, { threshold });

        // Separate countries that exceed threshold for BCDR alerts
        const alerts = results.filter((r: CIIResult) => r.exceedsThreshold);

        return NextResponse.json({
            countries: results.map((r: CIIResult) => ({
                country: r.country,
                countryCode: r.countryCode,
                instabilityIndex: r.score,
                riskLevel: r.riskLevel,
                trend: r.trend,
                factors: r.factors,
                breakdown: r.breakdown,
                exceedsThreshold: r.exceedsThreshold,
            })),
            alerts: alerts.map((a: CIIResult) => ({
                country: a.country,
                score: a.score,
                message: `⚠️ Elevated instability in ${a.country} — CII score ${a.score}. Review BCDR plan.`,
            })),
            count: results.length,
            threshold,
            computedAt: new Date().toISOString(),
            methodology: 'CII = baseline (40%) + unrest (20%) + security activity (20%) + info velocity (20%)',
        });
    } catch (error) {
        console.error('[INSTABILITY API] Error:', error);
        return NextResponse.json({ countries: [], error: 'Failed to compute instability index' }, { status: 500 });
    }
}
