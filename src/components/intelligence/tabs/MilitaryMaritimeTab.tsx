'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Plane, Ship, Building2, RefreshCw, Loader2,
    MapPin, AlertTriangle, Radar,
} from 'lucide-react';

interface FlightData {
    icao24: string;
    callsign: string;
    origin_country: string;
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    heading: number;
    on_ground: boolean;
    last_contact: number;
}

interface VesselData {
    mmsi: string;
    name: string;
    type: string;
    flag: string;
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    destination?: string;
    lastUpdate: string;
}

export function MilitaryMaritimeTab() {
    const [flights, setFlights] = useState<FlightData[]>([]);
    const [vessels, setVessels] = useState<VesselData[]>([]);
    const [flightLoading, setFlightLoading] = useState(false);
    const [vesselLoading, setVesselLoading] = useState(false);
    const [flightError, setFlightError] = useState('');
    const [vesselError, setVesselError] = useState('');
    const [activeTab, setActiveTab] = useState<'flights' | 'vessels' | 'bases'>('flights');

    const fetchFlights = async () => {
        setFlightLoading(true); setFlightError('');
        try {
            const res = await fetch('/api/intelligence/flights');
            if (!res.ok) { const d = await res.json(); setFlightError(d.message || 'Failed'); return; }
            setFlights((await res.json()).flights || []);
        } catch { setFlightError('Network error'); } finally { setFlightLoading(false); }
    };

    const fetchVessels = async () => {
        setVesselLoading(true); setVesselError('');
        try {
            const res = await fetch('/api/intelligence/vessels');
            if (!res.ok) { const d = await res.json(); setVesselError(d.message || 'Failed'); return; }
            setVessels((await res.json()).vessels || []);
        } catch { setVesselError('Network error'); } finally { setVesselLoading(false); }
    };

    useEffect(() => { fetchFlights(); fetchVessels(); }, []);

    const tabs = [
        { id: 'flights' as const, label: 'Military Flights', icon: Plane, count: flights.length },
        { id: 'vessels' as const, label: 'Naval Vessels', icon: Ship, count: vessels.length },
        { id: 'bases' as const, label: 'Military Bases', icon: Building2, count: '220+' },
    ];

    const renderApiWarning = (msg: string, hint: string) => (
        <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                    <p className="text-sm font-medium text-amber-400">API Key Required</p>
                    <p className="text-xs text-muted-foreground">{msg}</p>
                    <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-card/40 border border-transparent'}`}>
                            <Icon className="h-4 w-4" /> {tab.label}
                            <Badge variant="outline" className="text-[10px] ml-1">{tab.count}</Badge>
                        </button>
                    );
                })}
            </div>

            {activeTab === 'flights' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg"><Radar className="h-5 w-5 text-orange-400" /></div>
                            <div><h3 className="text-sm font-semibold">Military Flight Tracker</h3><p className="text-[10px] text-muted-foreground">OpenSky ADS-B · Military callsign patterns</p></div>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchFlights} disabled={flightLoading}>{flightLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
                    </div>
                    {flightError ? renderApiWarning(flightError, 'Configure OPENSKY credentials in Settings → Integrations') : (
                        <ScrollArea className="h-[500px] rounded-lg border border-border/30">
                            <div className="p-3 space-y-2">
                                {flights.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Plane className="h-10 w-10 mb-3 opacity-20" /><p className="text-sm">No military flights detected</p></div>
                                ) : flights.map((f) => (
                                    <Card key={f.icao24} className="bg-card/20"><CardContent className="p-3">
                                        <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><Plane className="h-4 w-4 text-orange-400" /><span className="text-sm font-mono font-bold">{f.callsign?.trim() || f.icao24}</span></div><Badge variant="outline" className="text-[9px]">{f.origin_country}</Badge></div>
                                        <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-muted-foreground"><div><MapPin className="h-3 w-3 inline mr-1" />{f.latitude.toFixed(2)}°, {f.longitude.toFixed(2)}°</div><div>Alt: {Math.round(f.altitude)}m</div><div>Vel: {Math.round(f.velocity)}m/s</div></div>
                                    </CardContent></Card>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            )}

            {activeTab === 'vessels' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><Ship className="h-5 w-5 text-blue-400" /></div>
                            <div><h3 className="text-sm font-semibold">Naval Vessel Monitor</h3><p className="text-[10px] text-muted-foreground">AIS maritime tracking</p></div>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchVessels} disabled={vesselLoading}>{vesselLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
                    </div>
                    {vesselError ? renderApiWarning(vesselError, 'Configure VESSELFINDER_API_KEY in Settings → Integrations') : (
                        <ScrollArea className="h-[500px] rounded-lg border border-border/30">
                            <div className="p-3 space-y-2">
                                {vessels.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Ship className="h-10 w-10 mb-3 opacity-20" /><p className="text-sm">No naval vessels tracked</p></div>
                                ) : vessels.map((v) => (
                                    <Card key={v.mmsi} className="bg-card/20"><CardContent className="p-3">
                                        <div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold">{v.name}</span><Badge variant="outline" className="text-[9px]">{v.flag}</Badge></div>
                                        <div className="text-[10px] text-muted-foreground">{v.type}</div>
                                        <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-muted-foreground"><div><MapPin className="h-3 w-3 inline mr-1" />{v.latitude.toFixed(2)}°, {v.longitude.toFixed(2)}°</div><div>Speed: {v.speed} kn</div>{v.destination && <div>Dest: {v.destination}</div>}</div>
                                    </CardContent></Card>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            )}

            {activeTab === 'bases' && (
                <Card className="bg-card/20"><CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground">
                    <Building2 className="h-12 w-12 mb-3 opacity-20" /><p className="text-sm font-medium">Enable on World Monitor Map</p><p className="text-xs mt-1">Switch to the World Monitor tab and enable &quot;Military Bases&quot; in the layer panel (visible at zoom 5+)</p>
                </CardContent></Card>
            )}
        </div>
    );
}
