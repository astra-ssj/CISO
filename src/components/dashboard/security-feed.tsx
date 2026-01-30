"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Globe, Shield } from "lucide-react";

interface FeedItem {
    id: string;
    type: 'THREAT' | 'GOVERNANCE' | 'INTERNAL';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
    message: string;
    timestamp: string;
}

const FEED_DATA: FeedItem[] = [
    { id: '1', type: 'THREAT', severity: 'CRITICAL', message: 'CVE-2024-3094: XZ Utils Backdoor detected in upstream deps', timestamp: '2m ago' },
    { id: '2', type: 'GOVERNANCE', severity: 'MEDIUM', message: 'EU AI Act: New compliance checklist published for GenAI models', timestamp: '15m ago' },
    { id: '3', type: 'INTERNAL', severity: 'HIGH', message: 'Unusual outbound traffic detected from Finance Subnet', timestamp: '32m ago' },
    { id: '4', type: 'THREAT', severity: 'MEDIUM', message: 'New phishing campaign targeting C-Suite executives', timestamp: '1h ago' },
    { id: '5', type: 'GOVERNANCE', severity: 'INFO', message: 'Quarterly Access Review cycle starting in 2 days', timestamp: '3h ago' },
    { id: '6', type: 'INTERNAL', severity: 'INFO', message: 'Automated backup completed successfully', timestamp: '4h ago' },
];

export function SecurityFeed() {
    return (
        <Card className="col-span-1 lg:col-span-2 min-h-[400px] border-primary/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ActivityIcon />
                    Live Security & Governance Feed
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono text-muted-foreground">LIVE</Badge>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-4">
                        {FEED_DATA.map((item) => (
                            <div key={item.id} className="flex gap-3 items-start p-3 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">
                                <div className="shrink-0 mt-0.5">
                                    <SeverityIcon type={item.type} severity={item.severity} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.type === 'THREAT' ? 'bg-red-100 text-red-700' :
                                                item.type === 'GOVERNANCE' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {item.type}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-mono">{item.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-foreground/90">{item.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

function ActivityIcon() {
    return (
        <span className="relative flex h-3 w-3 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
    )
}

function SeverityIcon({ type, severity }: { type: string, severity: string }) {
    if (type === 'THREAT') return <Shield className={`h-4 w-4 ${severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`} />;
    if (type === 'GOVERNANCE') return <FileText className="h-4 w-4 text-blue-500" />;
    return <Globe className="h-4 w-4 text-gray-500" />;
}
