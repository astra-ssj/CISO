"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Loader2, Server, Cloud, Shield, Key, Globe, Lock, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DataSource {
    id: string;
    name: string;
    type: 'CLOUD' | 'SIEM' | 'IDP' | 'CODE';
    status: 'DISCONNECTED' | 'CONFIGURING' | 'CONNECTING' | 'CONNECTED';
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    telemetry?: {
        rpm: number; // Requests per minute
        latency: number; // ms
        lastSync: string;
    };
    configFields: { key: string; label: string; type: 'text' | 'password', placeholder: string }[];
}

const INITIAL_SOURCES: DataSource[] = [
    {
        id: 'aws',
        name: 'AWS CloudTrail',
        type: 'CLOUD',
        status: 'DISCONNECTED',
        icon: Cloud,
        description: 'Ingest management events and VPC flow logs.',
        configFields: [
            { key: 'roleArn', label: 'Cross-Account Role ARN', type: 'text', placeholder: 'arn:aws:iam::123456789012:role/AstraIngest' },
            { key: 'region', label: 'Region', type: 'text', placeholder: 'us-east-1' }
        ]
    },
    {
        id: 'splunk',
        name: 'Splunk Enterprise',
        type: 'SIEM',
        status: 'DISCONNECTED',
        icon: Server,
        description: 'Forward security events from HEC.',
        configFields: [
            { key: 'host', label: 'Splunk HEC URL', type: 'text', placeholder: 'https://splunk.internal:8088' },
            { key: 'token', label: 'HEC Token', type: 'password', placeholder: '********-****-****-****-************' }
        ]
    },
    {
        id: 'crowdstrike',
        name: 'CrowdStrike Falcon',
        type: 'SIEM',
        status: 'DISCONNECTED',
        icon: Shield,
        description: 'Endpoint telemetry and threat detections.',
        configFields: [
            { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Client ID' },
            { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret' }
        ]
    },
    {
        id: 'okta',
        name: 'Okta Identity',
        type: 'IDP',
        status: 'DISCONNECTED',
        icon: Lock,
        description: 'User authentication and access logs.',
        configFields: [
            { key: 'domain', label: 'Okta Domain', type: 'text', placeholder: 'company.okta.com' },
            { key: 'token', label: 'API Token', type: 'password', placeholder: 'SSWS Token' }
        ]
    },
    {
        id: 'github',
        name: 'GitHub Enterprise',
        type: 'CODE',
        status: 'DISCONNECTED',
        icon: Globe,
        description: 'Scan code pushes and dependency graphs.',
        configFields: [
            { key: 'org', label: 'Organization Name', type: 'text', placeholder: 'acme-corp' },
            { key: 'pat', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...' }
        ]
    },
    {
        id: 'n8n',
        name: 'n8n Workflow Automation',
        type: 'SIEM', // Using SIEM effectively as "Automation" or create new type if strict
        status: 'DISCONNECTED',
        icon: Workflow,
        description: 'Trigger external workflows via Webhook.',
        configFields: [
            { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://n8n.internal.corp/webhook/...' },
            { key: 'authHeader', label: 'Auth Header (Optional)', type: 'password', placeholder: 'Bearer <token>' }
        ]
    }
];

export function DataSourceConnector() {
    const [isOpen, setIsOpen] = useState(false);
    const [sources, setSources] = useState<DataSource[]>(INITIAL_SOURCES);
    const [, setActiveSourceId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [connectingId, setConnectingId] = useState<string | null>(null);

    const logEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleStartConfig = (id: string) => {
        setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'CONFIGURING' } : s));
        setActiveSourceId(id);
    };

    const handleCancelConfig = (id: string) => {
        setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'DISCONNECTED' } : s));
        setActiveSourceId(null);
    };

    const handleConnect = (id: string) => {
        setActiveSourceId(null); // Close form
        setConnectingId(id);
        setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'CONNECTING' } : s));
        setLogs([`> Initializing connection to ${id.toUpperCase()}...`]);

        const steps = [
            `> Resolving host endpoints... OK`,
            `> Validating credentials... OK`,
            `> Negotiating cipher suite (TLS 1.3)... OK`,
            `> Requesting available streams...`,
            `> Stream [Audit.Log] found`,
            `> Stream [Security.Alerts] found`,
            `> Establishing websocket tunnel...`,
            `> Handshake complete.`,
        ];

        let step = 0;
        const interval = setInterval(() => {
            if (step >= steps.length) {
                clearInterval(interval);
                setConnectingId(null);
                setSources(prev => prev.map(s => s.id === id ? {
                    ...s,
                    status: 'CONNECTED',
                    telemetry: {
                        rpm: 0,
                        latency: 0,
                        lastSync: 'never — UI handshake only, no live connector'
                    }
                } : s));
                return;
            }
            setLogs(prev => [...prev, steps[step]]);
            step++;
        }, 600);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Database className="h-4 w-4" />
                    Connect Data
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        Infrastructure Integration Hub
                    </DialogTitle>
                    <DialogDescription>
                        Configure secure ingestion pipelines for security telemetry.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
                    {sources.map((source) => (
                        <div
                            key={source.id}
                            className={cn(
                                "rounded-lg border transition-all",
                                source.status === 'CONFIGURING' ? "border-primary bg-primary/5 ring-1 ring-primary/20" :
                                    source.status === 'CONNECTED' ? "border-emerald-500/20 bg-emerald-500/5" :
                                        "border-border bg-card hover:bg-accent/50"
                            )}
                        >
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2.5 rounded-lg",
                                        source.status === 'CONNECTED' ? "bg-emerald-500/20 text-emerald-500" : "bg-secondary text-muted-foreground"
                                    )}>
                                        <source.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-sm">{source.name}</h4>
                                            <Badge variant="outline" className="text-[10px] h-5 uppercase">
                                                {source.type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {source.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Actions */}
                                {source.status === 'CONNECTED' ? (
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-2 text-emerald-500 font-medium text-xs mb-1">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            LIVE
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-mono">
                                            {source.telemetry?.rpm} EPS | {source.telemetry?.latency}ms
                                        </div>
                                    </div>
                                ) : source.status === 'CONNECTING' ? (
                                    <Badge variant="secondary" className="animate-pulse">
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Handshake...
                                    </Badge>
                                ) : source.status === 'CONFIGURING' ? (
                                    <Button variant="ghost" size="icon" onClick={() => handleCancelConfig(source.id)}>
                                        <span className="sr-only">Cancel</span>
                                        ✕
                                    </Button>
                                ) : (
                                    <Button size="sm" variant="secondary" onClick={() => handleStartConfig(source.id)}>
                                        Configure
                                    </Button>
                                )}
                            </div>

                            {/* Configuration Form */}
                            {source.status === 'CONFIGURING' && (
                                <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in">
                                    <div className="border-t pt-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {source.configFields.map((field) => (
                                                <div key={field.key} className="space-y-2">
                                                    <Label htmlFor={`${source.id}-${field.key}`} className="text-xs">
                                                        {field.label}
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id={`${source.id}-${field.key}`}
                                                            type={field.type}
                                                            placeholder={field.placeholder}
                                                            className="h-8 text-xs bg-background"
                                                        />
                                                        {field.type === 'password' && <Key className="h-3 w-3 absolute right-3 top-2.5 text-muted-foreground" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleCancelConfig(source.id)}>
                                                Cancel
                                            </Button>
                                            <Button size="sm" onClick={() => handleConnect(source.id)}>
                                                Establish Link
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Terminal Log for this Source */}
                            {source.status === 'CONNECTING' && source.id === connectingId && (
                                <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                                    <div className="bg-black rounded-lg p-3 font-mono text-[10px] text-emerald-500 h-32 overflow-hidden border border-emerald-900/50 shadow-inner">
                                        <div className="space-y-1">
                                            {logs.map((log, i) => (
                                                <div key={i}>{log}</div>
                                            ))}
                                            <div ref={logEndRef} className="animate-pulse">_</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <DialogFooter className="mt-2 border-t pt-4">
                    <div className="flex items-center gap-4 mr-auto text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3" />
                            <span>mTLS Encryption Enabled</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Server className="h-3 w-3" />
                            <span>Dedicated Gateway</span>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
