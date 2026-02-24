/**
 * Proximity Analyzer — Finds critical infrastructure near events.
 *
 * When an intelligence signal occurs, identifies cables, pipelines,
 * datacenters, nuclear facilities, office locations, and military
 * bases within a configurable radius.
 */

import type { IntelligenceSignal } from './signal-aggregator';

// Static data imports (JSON)
import militaryBases from '@/data/intelligence/military-bases.json';
import underseaCables from '@/data/intelligence/undersea-cables.json';
import nuclearFacilities from '@/data/intelligence/nuclear-facilities.json';
import datacenters from '@/data/intelligence/datacenters.json';

// ── Types ─────────────────────────────────────────────────────

export interface ProximityItem {
    type: 'cable_landing' | 'pipeline' | 'datacenter' | 'nuclear' | 'military_base' | 'office';
    id: string;
    name: string;
    distanceKm: number;
    latitude: number;
    longitude: number;
    details: Record<string, unknown>;
}

export interface ProximityReport {
    event: {
        id: string;
        title: string;
        latitude: number;
        longitude: number;
    };
    radiusKm: number;
    nearbyItems: ProximityItem[];
    bcdrImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
    summary: string;
}

// ── Haversine Distance (km) ───────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Quick bounding-box pre-filter ─────────────────────────────

function inBBox(lat: number, lng: number, centerLat: number, centerLng: number, radiusKm: number): boolean {
    const degPerKm = 1 / 111;
    const dLat = radiusKm * degPerKm;
    const dLng = radiusKm * degPerKm / Math.cos(centerLat * Math.PI / 180);
    return (
        lat >= centerLat - dLat && lat <= centerLat + dLat &&
        lng >= centerLng - dLng && lng <= centerLng + dLng
    );
}

// ── Analysis ──────────────────────────────────────────────────

export function analyzeProximity(
    signal: IntelligenceSignal,
    options: {
        radiusKm?: number;
        officeLocations?: { id: string; name: string; lat: number; lng: number }[];
    } = {}
): ProximityReport {
    const { radiusKm = 600, officeLocations = [] } = options;
    const { latitude, longitude } = signal;
    const nearbyItems: ProximityItem[] = [];

    // ── Military Bases ──
    for (const base of militaryBases) {
        if (!inBBox(base.lat, base.lng, latitude, longitude, radiusKm)) continue;
        const dist = haversineKm(latitude, longitude, base.lat, base.lng);
        if (dist <= radiusKm) {
            nearbyItems.push({
                type: 'military_base',
                id: base.id,
                name: base.name,
                distanceKm: Math.round(dist),
                latitude: base.lat,
                longitude: base.lng,
                details: { country: base.country, operator: base.operator, baseType: base.type },
            });
        }
    }

    // ── Cable Landing Points ──
    for (const cable of underseaCables) {
        for (const lp of cable.landingPoints) {
            if (!inBBox(lp.lat, lp.lng, latitude, longitude, radiusKm)) continue;
            const dist = haversineKm(latitude, longitude, lp.lat, lp.lng);
            if (dist <= radiusKm) {
                nearbyItems.push({
                    type: 'cable_landing',
                    id: `${cable.id}-${lp.name}`,
                    name: `${cable.name} — ${lp.name}`,
                    distanceKm: Math.round(dist),
                    latitude: lp.lat,
                    longitude: lp.lng,
                    details: { cable: cable.name, country: lp.country, length_km: cable.length_km, owner: cable.owner },
                });
            }
        }
    }

    // ── Nuclear Facilities ──
    for (const nuc of nuclearFacilities) {
        if (!inBBox(nuc.lat, nuc.lng, latitude, longitude, radiusKm)) continue;
        const dist = haversineKm(latitude, longitude, nuc.lat, nuc.lng);
        if (dist <= radiusKm) {
            nearbyItems.push({
                type: 'nuclear',
                id: nuc.id,
                name: nuc.name,
                distanceKm: Math.round(dist),
                latitude: nuc.lat,
                longitude: nuc.lng,
                details: { country: nuc.country, facilityType: nuc.type, status: nuc.status, capacity_mw: nuc.capacity_mw },
            });
        }
    }

    // ── Datacenters ──
    for (const dc of datacenters) {
        if (!inBBox(dc.lat, dc.lng, latitude, longitude, radiusKm)) continue;
        const dist = haversineKm(latitude, longitude, dc.lat, dc.lng);
        if (dist <= radiusKm) {
            nearbyItems.push({
                type: 'datacenter',
                id: dc.id,
                name: dc.name,
                distanceKm: Math.round(dist),
                latitude: dc.lat,
                longitude: dc.lng,
                details: { country: dc.country, operator: dc.operator, dcType: dc.type, capacity: dc.capacity },
            });
        }
    }

    // ── Office Locations ──
    for (const office of officeLocations) {
        if (!inBBox(office.lat, office.lng, latitude, longitude, radiusKm)) continue;
        const dist = haversineKm(latitude, longitude, office.lat, office.lng);
        if (dist <= radiusKm) {
            nearbyItems.push({
                type: 'office',
                id: office.id,
                name: office.name,
                distanceKm: Math.round(dist),
                latitude: office.lat,
                longitude: office.lng,
                details: {},
            });
        }
    }

    // Sort by distance
    nearbyItems.sort((a, b) => a.distanceKm - b.distanceKm);

    // Compute BCDR impact
    const hasOffice = nearbyItems.some((i) => i.type === 'office');
    const hasNuclear = nearbyItems.some((i) => i.type === 'nuclear');
    const hasCable = nearbyItems.some((i) => i.type === 'cable_landing');
    const hasDC = nearbyItems.some((i) => i.type === 'datacenter');

    let bcdrImpact: ProximityReport['bcdrImpact'] = 'none';
    if (hasOffice && (hasNuclear || nearbyItems.length > 5)) bcdrImpact = 'critical';
    else if (hasOffice) bcdrImpact = 'high';
    else if (hasNuclear || (hasCable && hasDC)) bcdrImpact = 'high';
    else if (hasCable || hasDC || nearbyItems.length > 3) bcdrImpact = 'medium';
    else if (nearbyItems.length > 0) bcdrImpact = 'low';

    // Summary
    const typeCounts = nearbyItems.reduce<Record<string, number>>((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
    }, {});
    const parts = Object.entries(typeCounts).map(([t, c]) => `${c} ${t.replace('_', ' ')}${c > 1 ? 's' : ''}`);
    const summary = nearbyItems.length === 0
        ? `No critical infrastructure within ${radiusKm}km radius.`
        : `${nearbyItems.length} infrastructure items within ${radiusKm}km: ${parts.join(', ')}. BCDR impact: ${bcdrImpact}.`;

    return {
        event: { id: signal.id, title: signal.title, latitude, longitude },
        radiusKm,
        nearbyItems: nearbyItems.slice(0, 20), // Limit to 20 nearest
        bcdrImpact,
        summary,
    };
}
