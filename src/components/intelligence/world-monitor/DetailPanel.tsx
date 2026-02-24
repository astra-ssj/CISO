'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    X, MapPin, AlertTriangle, Building2, Anchor,
    Plane, Cable, Atom, Server, Shield, ArrowRight,
} from 'lucide-react';
import type { ProximityReport, ProximityItem } from '@/lib/intelligence/proximity-analyzer';

interface DetailPanelProps {
    title: string;
    description?: string;
    severity?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    proximity?: ProximityReport | null;
    onClose: () => void;
    onCreateRisk?: () => void;
    onCreateIncident?: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    military_base: <Shield className="h-3.5 w-3.5 text-orange-400" />,
    cable_landing: <Cable className="h-3.5 w-3.5 text-cyan-400" />,
    nuclear: <Atom className="h-3.5 w-3.5 text-yellow-400" />,
    datacenter: <Server className="h-3.5 w-3.5 text-purple-400" />,
    office: <Building2 className="h-3.5 w-3.5 text-green-400" />,
    pipeline: <Anchor className="h-3.5 w-3.5 text-blue-400" />,
};

const SEVERITY_COLORS: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/10 text-green-400 border-green-500/30',
    info: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    none: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

export function DetailPanel({
    title, description, severity, category, latitude, longitude,
    proximity, onClose, onCreateRisk, onCreateIncident,
}: DetailPanelProps) {
    return (
        <div className="absolute top-0 right-0 h-full w-[340px] bg-slate-950/95 backdrop-blur-md border-l border-border/30 z-50 animate-in slide-in-from-right-5 duration-200">
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between p-4 border-b border-border/30">
                    <div className="min-w-0 flex-1 mr-2">
                        <h3 className="text-sm font-semibold leading-tight">{title}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            {severity && (
                                <Badge variant="outline" className={`text-[9px] ${SEVERITY_COLORS[severity.toLowerCase()] || SEVERITY_COLORS.info}`}>
                                    {severity}
                                </Badge>
                            )}
                            {category && (
                                <Badge variant="outline" className="text-[9px]">{category}</Badge>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {/* Description */}
                        {description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                        )}

                        {/* Coordinates */}
                        {latitude != null && longitude != null && (
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                            </div>
                        )}

                        {/* Proximity Report */}
                        {proximity && proximity.nearbyItems.length > 0 && (
                            <Card className="bg-card/20 border-border/30">
                                <CardHeader className="p-3">
                                    <CardTitle className="text-xs flex items-center gap-2">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                        Infrastructure Proximity ({proximity.radiusKm}km)
                                    </CardTitle>
                                    {proximity.bcdrImpact !== 'none' && (
                                        <Badge variant="outline" className={`text-[9px] w-fit mt-1 ${SEVERITY_COLORS[proximity.bcdrImpact]}`}>
                                            BCDR Impact: {proximity.bcdrImpact}
                                        </Badge>
                                    )}
                                </CardHeader>
                                <CardContent className="p-3 pt-0 space-y-1.5">
                                    {proximity.nearbyItems.slice(0, 10).map((item: ProximityItem, i: number) => (
                                        <div key={`${item.id}-${i}`} className="flex items-center gap-2 text-[11px] py-1 border-b border-border/10 last:border-0">
                                            {TYPE_ICONS[item.type] || <MapPin className="h-3.5 w-3.5 text-slate-400" />}
                                            <span className="flex-1 min-w-0 truncate">{item.name}</span>
                                            <span className="text-muted-foreground shrink-0">{item.distanceKm}km</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Actions */}
                        <div className="space-y-2 pt-2">
                            {onCreateRisk && (
                                <Button variant="outline" size="sm" className="w-full justify-between text-xs" onClick={onCreateRisk}>
                                    Create Risk Scenario <ArrowRight className="h-3 w-3" />
                                </Button>
                            )}
                            {onCreateIncident && (
                                <Button variant="outline" size="sm" className="w-full justify-between text-xs" onClick={onCreateIncident}>
                                    Create Incident <ArrowRight className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
