'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// ── Hardcoded office locations ──────────────────────────────────
const OFFICES = [
    { id: 'de', name: 'AstraLabs DE (HQ)', lat: 54.32, lng: 10.13, country: 'DE', cii: 8 },
    { id: 'gb', name: 'AstraLabs UK', lat: 51.50, lng: -0.12, country: 'GB', cii: 10 },
    { id: 'th', name: 'AstraLabs TH', lat: 13.75, lng: 100.50, country: 'TH', cii: 25 },
    { id: 'au', name: 'AstraLabs AU', lat: -33.87, lng: 151.21, country: 'AU', cii: 8 },
    { id: 'nz', name: 'AstraLabs NZ', lat: -36.85, lng: 174.76, country: 'NZ', cii: 5 },
    { id: 'es', name: 'AstraLabs ES', lat: 41.39, lng: 2.17, country: 'ES', cii: 12 },
    { id: 'at', name: 'AstraLabs AT', lat: 48.21, lng: 16.37, country: 'AT', cii: 7 },
];

// ── Conflict zones ──────────────────────────────────────────────
const CONFLICT_CENTERS = [
    { id: 'cz-ua', lat: 48.0, lng: 31.0, name: 'Ukraine', severity: 'critical' },
    { id: 'cz-gaza', lat: 31.4, lng: 34.4, name: 'Gaza', severity: 'critical' },
    { id: 'cz-sudan', lat: 12.75, lng: 30.0, name: 'Sudan', severity: 'critical' },
    { id: 'cz-redsea', lat: 14.5, lng: 42.0, name: 'Red Sea', severity: 'critical' },
    { id: 'cz-myanmar', lat: 19.0, lng: 96.75, name: 'Myanmar', severity: 'critical' },
    { id: 'cz-yemen', lat: 15.25, lng: 48.25, name: 'Yemen', severity: 'high' },
    { id: 'cz-syria', lat: 34.9, lng: 39.0, name: 'Syria', severity: 'high' },
    { id: 'cz-sahel', lat: 17.5, lng: 5.5, name: 'Sahel', severity: 'high' },
    { id: 'cz-drc', lat: -1.0, lng: 28.5, name: 'DR Congo', severity: 'high' },
    { id: 'cz-haiti', lat: 19.05, lng: -73.05, name: 'Haiti', severity: 'high' },
];

function ciiColor(score: number): string {
    if (score < 30) return '#22c55e';
    if (score < 60) return '#eab308';
    return '#ef4444';
}

const DARK_TILES = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO';

// ── Inner Leaflet map (browser-only) ────────────────────────────
function LeafletMiniMap() {
    const [RL, setRL] = useState<typeof import('react-leaflet') | null>(null);
    const [loaded, setLoaded] = useState(false);

    // Load react-leaflet on mount — must be in useEffect, NOT useState
    useEffect(() => {
        let cancelled = false;
        import('react-leaflet').then(mod => {
            if (!cancelled) {
                setRL(mod);
                setLoaded(true);
            }
        });
        return () => { cancelled = true; };
    }, []);

    if (!RL || !loaded) {
        return (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-500" />
                    <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest">Loading...</span>
                </div>
            </div>
        );
    }

    const { MapContainer, TileLayer, CircleMarker, Popup } = RL;

    return (
        <MapContainer
            center={[25, 20]}
            zoom={2}
            minZoom={1}
            maxZoom={6}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            zoomControl={false}
            dragging={true}
            scrollWheelZoom={false}
            doubleClickZoom={true}
            attributionControl={true}
        >
            <TileLayer url={DARK_TILES} attribution={TILE_ATTR} subdomains="abcd" />

            {/* Conflict zones */}
            {CONFLICT_CENTERS.map(cz => (
                <CircleMarker
                    key={cz.id}
                    center={[cz.lat, cz.lng]}
                    radius={cz.severity === 'critical' ? 6 : 5}
                    pathOptions={{
                        fillColor: '#ef4444',
                        fillOpacity: 0.85,
                        color: '#fca5a5',
                        weight: 1,
                        opacity: 1,
                    }}
                >
                    <Popup>
                        <div className="text-slate-200">
                            <div className="font-semibold text-sm mb-0.5">{cz.name}</div>
                            <span className="text-[10px] bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded font-bold uppercase">
                                {cz.severity}
                            </span>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}

            {/* Conflict pulse rings */}
            {CONFLICT_CENTERS.filter(c => c.severity === 'critical').map(cz => (
                <CircleMarker
                    key={`${cz.id}-ring`}
                    center={[cz.lat, cz.lng]}
                    radius={11}
                    pathOptions={{
                        fillColor: '#ef4444',
                        fillOpacity: 0.1,
                        color: '#ef4444',
                        weight: 1,
                        opacity: 0.3,
                    }}
                    interactive={false}
                />
            ))}

            {/* Office pins */}
            {OFFICES.map(o => (
                <CircleMarker
                    key={o.id}
                    center={[o.lat, o.lng]}
                    radius={7}
                    pathOptions={{
                        fillColor: '#22c55e',
                        fillOpacity: 0.9,
                        color: '#ffffff',
                        weight: 2,
                        opacity: 1,
                    }}
                >
                    <Popup>
                        <div className="text-slate-200">
                            <div className="font-semibold text-sm mb-1">{o.name}</div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400">CII: </span>
                                <span className="text-xs font-bold font-mono" style={{ color: ciiColor(o.cii) }}>
                                    {o.cii}
                                </span>
                            </div>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}

            {/* Office pulse rings */}
            {OFFICES.map(o => (
                <CircleMarker
                    key={`${o.id}-ring`}
                    center={[o.lat, o.lng]}
                    radius={13}
                    pathOptions={{
                        fillColor: '#22c55e',
                        fillOpacity: 0.1,
                        color: '#22c55e',
                        weight: 1,
                        opacity: 0.25,
                    }}
                    interactive={false}
                />
            ))}
        </MapContainer>
    );
}

const LeafletMiniMapDynamic = dynamic(() => Promise.resolve(LeafletMiniMap), { ssr: false });

// ── Main export ─────────────────────────────────────────────────
export default function MiniWorldMap() {
    const [isLoaded, setIsLoaded] = useState(false);

    // Track loading via timer after mount — no callback prop needed
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-secondary/5">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">🌐</span> Global Threat Monitor
                </h3>
                <div className="flex items-center gap-2">
                    {isLoaded && (
                        <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                        </span>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className="relative" style={{ height: 300, background: '#0a0e17' }}>
                <LeafletMiniMapDynamic />
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center z-[200]">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-500" />
                            <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest">Loading...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* CII scores row */}
            <div className="px-4 py-3 border-t border-border/30 bg-secondary/5">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                        {OFFICES.map(o => (
                            <div key={o.id} className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-slate-400 uppercase">{o.country}:</span>
                                <span className="text-xs font-bold font-mono" style={{ color: ciiColor(o.cii) }}>
                                    {o.cii}
                                </span>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/intelligence"
                        className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium whitespace-nowrap"
                    >
                        View Full Monitor →
                    </Link>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Offices</span>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Conflicts</span>
                    <span>CII = Country Instability Index</span>
                </div>
            </div>
        </div>
    );
}
