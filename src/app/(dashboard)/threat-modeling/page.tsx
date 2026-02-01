"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Trash2,
    ArrowRight,
    ShieldAlert,
    Network,
    Server,
    Play,
    Download,
    Target,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Globe,
    Database,
    Smartphone,
    Cloud,
    Lock,
    Unlock,
    Zap,
    FileText,
    TrendingUp,
    Eye,
    Shield,
    Bug,
    Cpu,
    Box,
    Users,
    Key,
    RefreshCw,
    Sparkles,
    Layers,
    GitBranch,
    BarChart3,
    ChevronRight,
    Info
} from 'lucide-react';
import mermaid from 'mermaid';

// Types
type ComponentType = 'web_app' | 'api' | 'database' | 'storage' | 'external' | 'mobile' | 'iot' | 'cloud' | 'user';
type Protocol = 'HTTPS' | 'HTTP' | 'gRPC' | 'GraphQL' | 'WebSocket' | 'SQL' | 'TCP' | 'MQTT';
type TrustLevel = 'trusted' | 'semi-trusted' | 'untrusted';
type StrideCategory = 'S' | 'T' | 'R' | 'I' | 'D' | 'E';

interface Component {
    id: string;
    name: string;
    type: ComponentType;
    trustLevel: TrustLevel;
    isPublic: boolean;
    description?: string;
}

interface DataFlow {
    id: string;
    sourceId: string;
    targetId: string;
    label: string;
    protocol: Protocol;
    encrypted: boolean;
    authenticated: boolean;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
}

interface Threat {
    id: string;
    stride: StrideCategory;
    title: string;
    description: string;
    mitigation: string;
    riskScore: number; // 1-10
    likelihood: 'Low' | 'Medium' | 'High' | 'Critical';
    impact: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'identified' | 'mitigated' | 'accepted' | 'transferred';
    affectedAsset: string;
    cweId?: string;
}

const COMPONENT_ICONS: Record<ComponentType, React.ReactNode> = {
    web_app: <Globe className="h-4 w-4" />,
    api: <Zap className="h-4 w-4" />,
    database: <Database className="h-4 w-4" />,
    storage: <Box className="h-4 w-4" />,
    external: <Cloud className="h-4 w-4" />,
    mobile: <Smartphone className="h-4 w-4" />,
    iot: <Cpu className="h-4 w-4" />,
    cloud: <Cloud className="h-4 w-4" />,
    user: <Users className="h-4 w-4" />
};

const COMPONENT_COLORS: Record<ComponentType, string> = {
    web_app: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    api: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    database: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    storage: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
    external: 'from-rose-500/20 to-rose-600/10 border-rose-500/30',
    mobile: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    iot: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    cloud: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30',
    user: 'from-gray-500/20 to-gray-600/10 border-gray-500/30'
};

const STRIDE_INFO: Record<StrideCategory, { name: string; description: string; color: string; icon: React.ReactNode }> = {
    S: { name: 'Spoofing', description: 'Pretending to be something or someone else', color: 'bg-red-500', icon: <Users className="h-3.5 w-3.5" /> },
    T: { name: 'Tampering', description: 'Modifying data or code', color: 'bg-orange-500', icon: <FileText className="h-3.5 w-3.5" /> },
    R: { name: 'Repudiation', description: 'Claiming to not have performed an action', color: 'bg-amber-500', icon: <Eye className="h-3.5 w-3.5" /> },
    I: { name: 'Info Disclosure', description: 'Exposing information to unauthorized parties', color: 'bg-purple-500', icon: <Key className="h-3.5 w-3.5" /> },
    D: { name: 'Denial of Service', description: 'Deny or degrade service to users', color: 'bg-blue-500', icon: <XCircle className="h-3.5 w-3.5" /> },
    E: { name: 'Elevation', description: 'Gain capabilities without authorization', color: 'bg-rose-500', icon: <TrendingUp className="h-3.5 w-3.5" /> }
};

// Templates for quick start
const ARCHITECTURE_TEMPLATES = [
    {
        id: 'web-api',
        name: 'Web + API Architecture',
        description: 'Standard 3-tier web application',
        components: [
            { id: 'user', name: 'End User', type: 'user' as ComponentType, trustLevel: 'untrusted' as TrustLevel, isPublic: true },
            { id: 'web', name: 'Web Frontend', type: 'web_app' as ComponentType, trustLevel: 'semi-trusted' as TrustLevel, isPublic: true },
            { id: 'api', name: 'API Gateway', type: 'api' as ComponentType, trustLevel: 'trusted' as TrustLevel, isPublic: false },
            { id: 'db', name: 'PostgreSQL', type: 'database' as ComponentType, trustLevel: 'trusted' as TrustLevel, isPublic: false }
        ],
        flows: [
            { id: 'f1', sourceId: 'user', targetId: 'web', label: 'Browser Request', protocol: 'HTTPS' as Protocol, encrypted: true, authenticated: false, dataClassification: 'public' as const },
            { id: 'f2', sourceId: 'web', targetId: 'api', label: 'API Calls', protocol: 'HTTPS' as Protocol, encrypted: true, authenticated: true, dataClassification: 'confidential' as const },
            { id: 'f3', sourceId: 'api', targetId: 'db', label: 'SQL Queries', protocol: 'SQL' as Protocol, encrypted: true, authenticated: true, dataClassification: 'restricted' as const }
        ]
    },
    {
        id: 'microservices',
        name: 'Microservices',
        description: 'Distributed microservices with message queue',
        components: [
            { id: 'gateway', name: 'API Gateway', type: 'api' as ComponentType, trustLevel: 'semi-trusted' as TrustLevel, isPublic: true },
            { id: 'auth', name: 'Auth Service', type: 'api' as ComponentType, trustLevel: 'trusted' as TrustLevel, isPublic: false },
            { id: 'orders', name: 'Orders Service', type: 'api' as ComponentType, trustLevel: 'trusted' as TrustLevel, isPublic: false },
            { id: 'payments', name: 'Payment Service', type: 'api' as ComponentType, trustLevel: 'trusted' as TrustLevel, isPublic: false },
            { id: 'db', name: 'Database Cluster', type: 'database' as ComponentType, trustLevel: 'trusted' as TrustLevel, isPublic: false },
            { id: 'ext', name: 'Stripe API', type: 'external' as ComponentType, trustLevel: 'semi-trusted' as TrustLevel, isPublic: true }
        ],
        flows: [
            { id: 'f1', sourceId: 'gateway', targetId: 'auth', label: 'Auth Request', protocol: 'gRPC' as Protocol, encrypted: true, authenticated: true, dataClassification: 'confidential' as const },
            { id: 'f2', sourceId: 'gateway', targetId: 'orders', label: 'Order Request', protocol: 'gRPC' as Protocol, encrypted: true, authenticated: true, dataClassification: 'confidential' as const },
            { id: 'f3', sourceId: 'orders', targetId: 'payments', label: 'Payment Init', protocol: 'gRPC' as Protocol, encrypted: true, authenticated: true, dataClassification: 'restricted' as const },
            { id: 'f4', sourceId: 'payments', targetId: 'ext', label: 'Stripe API', protocol: 'HTTPS' as Protocol, encrypted: true, authenticated: true, dataClassification: 'restricted' as const },
            { id: 'f5', sourceId: 'orders', targetId: 'db', label: 'Persist', protocol: 'SQL' as Protocol, encrypted: true, authenticated: true, dataClassification: 'confidential' as const }
        ]
    },
    {
        id: 'iot',
        name: 'IoT Platform',
        description: 'IoT devices with cloud backend',
        components: [
            { id: 'device', name: 'IoT Device', type: 'iot' as ComponentType, trustLevel: 'untrusted' as TrustLevel, isPublic: true },
            { id: 'edge', name: 'Edge Gateway', type: 'api' as ComponentType, trustLevel: 'semi-trusted' as TrustLevel, isPublic: true },
            { id: 'cloud', name: 'Cloud Backend', type: 'cloud' as ComponentType, trustLevel: 'trusted' as TrustLevel, isPublic: false },
            { id: 'db', name: 'Time Series DB', type: 'database' as ComponentType, trustLevel: 'trusted' as TrustLevel, isPublic: false },
            { id: 'mobile', name: 'Mobile App', type: 'mobile' as ComponentType, trustLevel: 'untrusted' as TrustLevel, isPublic: true }
        ],
        flows: [
            { id: 'f1', sourceId: 'device', targetId: 'edge', label: 'Telemetry', protocol: 'MQTT' as Protocol, encrypted: true, authenticated: true, dataClassification: 'internal' as const },
            { id: 'f2', sourceId: 'edge', targetId: 'cloud', label: 'Data Sync', protocol: 'HTTPS' as Protocol, encrypted: true, authenticated: true, dataClassification: 'confidential' as const },
            { id: 'f3', sourceId: 'cloud', targetId: 'db', label: 'Store Data', protocol: 'SQL' as Protocol, encrypted: true, authenticated: true, dataClassification: 'confidential' as const },
            { id: 'f4', sourceId: 'mobile', targetId: 'cloud', label: 'API Request', protocol: 'HTTPS' as Protocol, encrypted: true, authenticated: true, dataClassification: 'internal' as const }
        ]
    }
];

export default function ThreatModelingPage() {
    const [components, setComponents] = useState<Component[]>([]);
    const [flows, setFlows] = useState<DataFlow[]>([]);
    const [threats, setThreats] = useState<Threat[]>([]);
    const [diagramSvg, setDiagramSvg] = useState<string>('');
    const [activeTab, setActiveTab] = useState('design');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);
    const [analysisComplete, setAnalysisComplete] = useState(false);

    // Form state
    const [newCompName, setNewCompName] = useState('');
    const [newCompType, setNewCompType] = useState<ComponentType>('api');
    const [newCompTrust, setNewCompTrust] = useState<TrustLevel>('semi-trusted');
    const [newCompPublic, setNewCompPublic] = useState(false);

    const [newFlowSource, setNewFlowSource] = useState('');
    const [newFlowTarget, setNewFlowTarget] = useState('');
    const [newFlowLabel, setNewFlowLabel] = useState('');
    const [newFlowProto, setNewFlowProto] = useState<Protocol>('HTTPS');
    const [newFlowEncrypted, setNewFlowEncrypted] = useState(true);
    const [newFlowAuth, setNewFlowAuth] = useState(true);
    const [newFlowClassification, setNewFlowClassification] = useState<'public' | 'internal' | 'confidential' | 'restricted'>('internal');

    // Initialize Mermaid
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            flowchart: {
                curve: 'basis',
                padding: 20
            }
        });
    }, []);

    // Generate diagram whenever components/flows change
    useEffect(() => {
        if (components.length > 0) {
            generateDiagram();
        }
    }, [components, flows]);

    const generateDiagram = useCallback(async () => {
        if (components.length === 0) return;

        let diagram = 'flowchart LR\n';

        // Subgraphs by trust level
        const trusted = components.filter(c => c.trustLevel === 'trusted');
        const semiTrusted = components.filter(c => c.trustLevel === 'semi-trusted');
        const untrusted = components.filter(c => c.trustLevel === 'untrusted');

        if (trusted.length > 0) {
            diagram += '    subgraph Trust["🔒 Trusted Zone"]\n';
            diagram += '        direction TB\n';
            trusted.forEach(c => {
                diagram += `        ${c.id}["${c.name}"]\n`;
            });
            diagram += '    end\n';
        }

        if (semiTrusted.length > 0) {
            diagram += '    subgraph Semi["⚠️ DMZ"]\n';
            diagram += '        direction TB\n';
            semiTrusted.forEach(c => {
                diagram += `        ${c.id}["${c.name}"]\n`;
            });
            diagram += '    end\n';
        }

        if (untrusted.length > 0) {
            diagram += '    subgraph Untrust["🌐 External"]\n';
            diagram += '        direction TB\n';
            untrusted.forEach(c => {
                diagram += `        ${c.id}["${c.name}"]\n`;
            });
            diagram += '    end\n';
        }

        // Flows
        flows.forEach((flow, idx) => {
            const icon = flow.encrypted ? '🔐' : '⚠️';
            diagram += `    ${flow.sourceId} -->|"${icon} ${flow.label}"| ${flow.targetId}\n`;
        });

        // Styles
        diagram += '    style Trust fill:#064e3b,stroke:#10b981\n';
        diagram += '    style Semi fill:#854d0e,stroke:#eab308\n';
        diagram += '    style Untrust fill:#7f1d1d,stroke:#ef4444\n';

        try {
            const id = `diagram-${Date.now()}`;
            const { svg } = await mermaid.render(id, diagram);
            setDiagramSvg(svg);
        } catch (e) {
            console.error('Mermaid error:', e);
        }
    }, [components, flows]);

    // STRIDE Analysis Engine
    const runAnalysis = async () => {
        setIsAnalyzing(true);
        setThreats([]);

        // Simulate progressive analysis
        await new Promise(r => setTimeout(r, 500));

        const identifiedThreats: Threat[] = [];
        let threatId = 0;

        // Analyze each component
        for (const comp of components) {
            // Spoofing - Public endpoints
            if (comp.isPublic && (comp.type === 'web_app' || comp.type === 'api' || comp.type === 'mobile')) {
                identifiedThreats.push({
                    id: `T${++threatId}`,
                    stride: 'S',
                    title: `Identity Spoofing on ${comp.name}`,
                    description: `Public-facing ${comp.type} "${comp.name}" may be vulnerable to identity spoofing attacks. Attackers could impersonate legitimate users or services.`,
                    mitigation: 'Implement strong authentication (OAuth 2.0/OIDC), MFA, and session management with secure token handling.',
                    riskScore: comp.trustLevel === 'untrusted' ? 8 : 6,
                    likelihood: 'High',
                    impact: 'High',
                    status: 'identified',
                    affectedAsset: comp.name,
                    cweId: 'CWE-287'
                });
            }

            // Tampering - Databases and storage
            if (comp.type === 'database' || comp.type === 'storage') {
                identifiedThreats.push({
                    id: `T${++threatId}`,
                    stride: 'T',
                    title: `Data Tampering in ${comp.name}`,
                    description: `Data store "${comp.name}" could be subject to unauthorized modification. Attackers with access could alter, delete, or corrupt data.`,
                    mitigation: 'Enable integrity controls (checksums, digital signatures), implement write-ahead logging, database activity monitoring, and principle of least privilege.',
                    riskScore: 7,
                    likelihood: 'Medium',
                    impact: 'Critical',
                    status: 'identified',
                    affectedAsset: comp.name,
                    cweId: 'CWE-494'
                });
            }

            // Repudiation - Untrusted components
            if (comp.trustLevel === 'untrusted') {
                identifiedThreats.push({
                    id: `T${++threatId}`,
                    stride: 'R',
                    title: `Non-Repudiation Gap for ${comp.name}`,
                    description: `Actions from untrusted component "${comp.name}" may lack sufficient audit trails, allowing users to deny their actions.`,
                    mitigation: 'Implement comprehensive logging, digital signatures for transactions, and tamper-evident audit trails.',
                    riskScore: 5,
                    likelihood: 'Medium',
                    impact: 'Medium',
                    status: 'identified',
                    affectedAsset: comp.name,
                    cweId: 'CWE-778'
                });
            }

            // DoS - Public-facing
            if (comp.isPublic) {
                identifiedThreats.push({
                    id: `T${++threatId}`,
                    stride: 'D',
                    title: `Denial of Service Risk for ${comp.name}`,
                    description: `Public component "${comp.name}" is exposed to potential DoS/DDoS attacks that could impact availability.`,
                    mitigation: 'Implement rate limiting, WAF, CDN with DDoS protection, auto-scaling, and circuit breakers.',
                    riskScore: comp.type === 'api' ? 7 : 5,
                    likelihood: 'High',
                    impact: 'High',
                    status: 'identified',
                    affectedAsset: comp.name,
                    cweId: 'CWE-400'
                });
            }
        }

        // Analyze flows
        for (const flow of flows) {
            const src = components.find(c => c.id === flow.sourceId);
            const tgt = components.find(c => c.id === flow.targetId);

            // Information Disclosure - Unencrypted
            if (!flow.encrypted) {
                identifiedThreats.push({
                    id: `T${++threatId}`,
                    stride: 'I',
                    title: `Cleartext Data Exposure: ${src?.name} → ${tgt?.name}`,
                    description: `Data flow "${flow.label}" transmits ${flow.dataClassification} data without encryption, exposing it to interception.`,
                    mitigation: 'Enforce TLS 1.3 for all data in transit. Implement certificate pinning for mobile clients.',
                    riskScore: flow.dataClassification === 'restricted' ? 9 : 7,
                    likelihood: 'High',
                    impact: flow.dataClassification === 'restricted' ? 'Critical' : 'High',
                    status: 'identified',
                    affectedAsset: `${src?.name} → ${tgt?.name}`,
                    cweId: 'CWE-319'
                });
            }

            // Elevation of Privilege - Missing Auth
            if (!flow.authenticated) {
                identifiedThreats.push({
                    id: `T${++threatId}`,
                    stride: 'E',
                    title: `Unauthenticated Access: ${src?.name} → ${tgt?.name}`,
                    description: `Data flow "${flow.label}" lacks authentication, potentially allowing unauthorized access or privilege escalation.`,
                    mitigation: 'Implement mutual TLS (mTLS), OAuth 2.0 token validation, or API key authentication with proper scoping.',
                    riskScore: 8,
                    likelihood: 'High',
                    impact: 'Critical',
                    status: 'identified',
                    affectedAsset: `${src?.name} → ${tgt?.name}`,
                    cweId: 'CWE-306'
                });
            }

            // Cross-boundary flows
            if (src?.trustLevel !== tgt?.trustLevel) {
                identifiedThreats.push({
                    id: `T${++threatId}`,
                    stride: 'T',
                    title: `Trust Boundary Crossing: ${src?.name} → ${tgt?.name}`,
                    description: `Data crosses trust boundaries from ${src?.trustLevel} to ${tgt?.trustLevel}. This is a critical point requiring input validation.`,
                    mitigation: 'Implement strict input validation, sanitization, and output encoding at trust boundaries. Use allowlists over blocklists.',
                    riskScore: 6,
                    likelihood: 'Medium',
                    impact: 'High',
                    status: 'identified',
                    affectedAsset: `${src?.name} → ${tgt?.name}`,
                    cweId: 'CWE-20'
                });
            }

            // Sensitive data over external
            if (flow.dataClassification === 'restricted' && (src?.type === 'external' || tgt?.type === 'external')) {
                identifiedThreats.push({
                    id: `T${++threatId}`,
                    stride: 'I',
                    title: `Restricted Data to External: ${flow.label}`,
                    description: `Restricted data is being transferred to/from external service. This requires additional controls and compliance review.`,
                    mitigation: 'Implement data masking, tokenization, or encryption at rest. Ensure vendor compliance with data protection regulations.',
                    riskScore: 8,
                    likelihood: 'Medium',
                    impact: 'Critical',
                    status: 'identified',
                    affectedAsset: flow.label,
                    cweId: 'CWE-200'
                });
            }
        }

        // Sort by risk score
        identifiedThreats.sort((a, b) => b.riskScore - a.riskScore);

        setThreats(identifiedThreats);
        setIsAnalyzing(false);
        setAnalysisComplete(true);
        setActiveTab('threats');
    };

    // Handlers
    const addComponent = () => {
        if (!newCompName.trim()) return;
        setComponents([...components, {
            id: `c${Date.now()}`,
            name: newCompName,
            type: newCompType,
            trustLevel: newCompTrust,
            isPublic: newCompPublic
        }]);
        setNewCompName('');
        setAnalysisComplete(false);
    };

    const addFlow = () => {
        if (!newFlowSource || !newFlowTarget || newFlowSource === newFlowTarget) return;
        setFlows([...flows, {
            id: `f${Date.now()}`,
            sourceId: newFlowSource,
            targetId: newFlowTarget,
            label: newFlowLabel || 'Data Flow',
            protocol: newFlowProto,
            encrypted: newFlowEncrypted,
            authenticated: newFlowAuth,
            dataClassification: newFlowClassification
        }]);
        setNewFlowLabel('');
        setAnalysisComplete(false);
    };

    const removeComponent = (id: string) => {
        setComponents(components.filter(c => c.id !== id));
        setFlows(flows.filter(f => f.sourceId !== id && f.targetId !== id));
        setAnalysisComplete(false);
    };

    const removeFlow = (id: string) => {
        setFlows(flows.filter(f => f.id !== id));
        setAnalysisComplete(false);
    };

    const loadTemplate = (templateId: string) => {
        const template = ARCHITECTURE_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setComponents(template.components);
            setFlows(template.flows);
            setShowTemplateDialog(false);
            setAnalysisComplete(false);
        }
    };

    const updateThreatStatus = (threatId: string, status: Threat['status']) => {
        setThreats(threats.map(t => t.id === threatId ? { ...t, status } : t));
    };

    // Calculate risk metrics
    const riskMetrics = {
        total: threats.length,
        critical: threats.filter(t => t.riskScore >= 8).length,
        high: threats.filter(t => t.riskScore >= 6 && t.riskScore < 8).length,
        medium: threats.filter(t => t.riskScore >= 4 && t.riskScore < 6).length,
        low: threats.filter(t => t.riskScore < 4).length,
        mitigated: threats.filter(t => t.status === 'mitigated').length,
        avgScore: threats.length ? (threats.reduce((a, t) => a + t.riskScore, 0) / threats.length).toFixed(1) : '0'
    };

    const strideBreakdown = {
        S: threats.filter(t => t.stride === 'S').length,
        T: threats.filter(t => t.stride === 'T').length,
        R: threats.filter(t => t.stride === 'R').length,
        I: threats.filter(t => t.stride === 'I').length,
        D: threats.filter(t => t.stride === 'D').length,
        E: threats.filter(t => t.stride === 'E').length
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl">
                            <Network className="h-6 w-6 text-primary" />
                        </div>
                        Threat Modeling Engine
                    </h1>
                    <p className="text-muted-foreground mt-1.5">
                        Design your architecture, analyze with STRIDE methodology, and generate actionable threat assessments
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)}>
                        <Layers className="h-4 w-4 mr-2" />
                        Load Template
                    </Button>
                    <Button
                        size="sm"
                        onClick={runAnalysis}
                        disabled={components.length < 2 || flows.length < 1 || isAnalyzing}
                        className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                    >
                        {isAnalyzing ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        {isAnalyzing ? 'Analyzing...' : 'Run STRIDE Analysis'}
                    </Button>
                </div>
            </div>

            {/* Risk Summary - Only show after analysis */}
            {analysisComplete && threats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <Card className="border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-600/5">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-red-500">{riskMetrics.critical}</div>
                            <div className="text-xs text-muted-foreground">Critical</div>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-orange-500">{riskMetrics.high}</div>
                            <div className="text-xs text-muted-foreground">High</div>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-amber-500">{riskMetrics.medium}</div>
                            <div className="text-xs text-muted-foreground">Medium</div>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-emerald-500">{riskMetrics.mitigated}</div>
                            <div className="text-xs text-muted-foreground">Mitigated</div>
                        </CardContent>
                    </Card>
                    {/* STRIDE breakdown */}
                    <Card className="col-span-2 md:col-span-4 lg:col-span-3 border-primary/10">
                        <CardContent className="p-4">
                            <div className="text-xs text-muted-foreground mb-2">STRIDE Distribution</div>
                            <div className="flex gap-2">
                                {(Object.entries(strideBreakdown) as [StrideCategory, number][]).map(([cat, count]) => (
                                    <div
                                        key={cat}
                                        className={`flex-1 text-center p-2 rounded-lg ${count > 0 ? STRIDE_INFO[cat].color + '/20' : 'bg-secondary/30'}`}
                                    >
                                        <div className="font-bold">{count}</div>
                                        <div className="text-[10px] opacity-70">{STRIDE_INFO[cat].name}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Panel - Designer */}
                <Card className="xl:col-span-1 border-primary/10 flex flex-col max-h-[800px]">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Server className="h-5 w-5 text-primary" />
                            Architecture Designer
                        </CardTitle>
                        <CardDescription>Define components and data flows</CardDescription>
                    </CardHeader>

                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            {/* Add Component */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-xl border border-border/50">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <Box className="h-4 w-4 text-primary" />
                                    Add Component
                                </h3>
                                <Input
                                    placeholder="Component name..."
                                    value={newCompName}
                                    onChange={e => setNewCompName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addComponent()}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Select value={newCompType} onValueChange={(v: ComponentType) => setNewCompType(v)}>
                                        <SelectTrigger className="text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="web_app">🌐 Web App</SelectItem>
                                            <SelectItem value="api">⚡ API Service</SelectItem>
                                            <SelectItem value="database">🗄️ Database</SelectItem>
                                            <SelectItem value="storage">📦 Storage</SelectItem>
                                            <SelectItem value="external">☁️ External</SelectItem>
                                            <SelectItem value="mobile">📱 Mobile App</SelectItem>
                                            <SelectItem value="iot">🔌 IoT Device</SelectItem>
                                            <SelectItem value="cloud">☁️ Cloud Service</SelectItem>
                                            <SelectItem value="user">👤 User/Actor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={newCompTrust} onValueChange={(v: TrustLevel) => setNewCompTrust(v)}>
                                        <SelectTrigger className="text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="trusted">🔒 Trusted</SelectItem>
                                            <SelectItem value="semi-trusted">⚠️ Semi-Trusted</SelectItem>
                                            <SelectItem value="untrusted">🌐 Untrusted</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={newCompPublic ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setNewCompPublic(!newCompPublic)}
                                        className="flex-1 text-xs"
                                    >
                                        {newCompPublic ? <Globe className="h-3.5 w-3.5 mr-1.5" /> : <Lock className="h-3.5 w-3.5 mr-1.5" />}
                                        {newCompPublic ? "Public" : "Internal"}
                                    </Button>
                                    <Button onClick={addComponent} disabled={!newCompName.trim()} className="flex-1">
                                        <Plus className="h-4 w-4 mr-1" /> Add
                                    </Button>
                                </div>
                            </div>

                            {/* Component List */}
                            {components.length > 0 && (
                                <div className="space-y-1.5">
                                    {components.map(c => (
                                        <div
                                            key={c.id}
                                            className={`flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r ${COMPONENT_COLORS[c.type]} border group transition-all hover:shadow-md`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {COMPONENT_ICONS[c.type]}
                                                <span className="text-sm font-medium truncate">{c.name}</span>
                                                {c.isPublic && (
                                                    <Badge variant="outline" className="text-[9px] px-1.5 border-amber-500/30 text-amber-500">
                                                        PUBLIC
                                                    </Badge>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                                                onClick={() => removeComponent(c.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="h-px bg-border" />

                            {/* Add Flow */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-xl border border-border/50">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <GitBranch className="h-4 w-4 text-primary" />
                                    Define Data Flow
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <Select value={newFlowSource} onValueChange={setNewFlowSource}>
                                        <SelectTrigger className="text-xs">
                                            <SelectValue placeholder="Source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {components.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={newFlowTarget} onValueChange={setNewFlowTarget}>
                                        <SelectTrigger className="text-xs">
                                            <SelectValue placeholder="Target" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {components.filter(c => c.id !== newFlowSource).map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Input
                                    placeholder="Flow description..."
                                    value={newFlowLabel}
                                    onChange={e => setNewFlowLabel(e.target.value)}
                                    className="text-xs"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Select value={newFlowProto} onValueChange={(v: Protocol) => setNewFlowProto(v)}>
                                        <SelectTrigger className="text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HTTPS">HTTPS</SelectItem>
                                            <SelectItem value="HTTP">HTTP</SelectItem>
                                            <SelectItem value="gRPC">gRPC</SelectItem>
                                            <SelectItem value="GraphQL">GraphQL</SelectItem>
                                            <SelectItem value="WebSocket">WebSocket</SelectItem>
                                            <SelectItem value="SQL">SQL</SelectItem>
                                            <SelectItem value="TCP">TCP</SelectItem>
                                            <SelectItem value="MQTT">MQTT</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={newFlowClassification} onValueChange={(v: any) => setNewFlowClassification(v)}>
                                        <SelectTrigger className="text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public">🟢 Public</SelectItem>
                                            <SelectItem value="internal">🟡 Internal</SelectItem>
                                            <SelectItem value="confidential">🟠 Confidential</SelectItem>
                                            <SelectItem value="restricted">🔴 Restricted</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={newFlowEncrypted ? "default" : "destructive"}
                                        size="sm"
                                        onClick={() => setNewFlowEncrypted(!newFlowEncrypted)}
                                        className="flex-1 text-xs"
                                    >
                                        {newFlowEncrypted ? <Lock className="h-3.5 w-3.5 mr-1" /> : <Unlock className="h-3.5 w-3.5 mr-1" />}
                                        {newFlowEncrypted ? "Encrypted" : "Cleartext"}
                                    </Button>
                                    <Button
                                        variant={newFlowAuth ? "default" : "destructive"}
                                        size="sm"
                                        onClick={() => setNewFlowAuth(!newFlowAuth)}
                                        className="flex-1 text-xs"
                                    >
                                        {newFlowAuth ? <Key className="h-3.5 w-3.5 mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                                        {newFlowAuth ? "Authenticated" : "No Auth"}
                                    </Button>
                                </div>
                                <Button
                                    onClick={addFlow}
                                    disabled={!newFlowSource || !newFlowTarget || newFlowSource === newFlowTarget}
                                    className="w-full"
                                >
                                    <ArrowRight className="h-4 w-4 mr-2" /> Connect
                                </Button>
                            </div>

                            {/* Flow List */}
                            {flows.length > 0 && (
                                <div className="space-y-1.5">
                                    {flows.map(f => {
                                        const src = components.find(c => c.id === f.sourceId);
                                        const tgt = components.find(c => c.id === f.targetId);
                                        return (
                                            <div
                                                key={f.id}
                                                className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/30 group"
                                            >
                                                <div className="flex items-center gap-2 text-xs min-w-0">
                                                    <span className="truncate">{src?.name}</span>
                                                    <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                                    <span className="truncate">{tgt?.name}</span>
                                                    <Badge variant="secondary" className="text-[9px]">{f.protocol}</Badge>
                                                    {!f.encrypted && <Badge variant="destructive" className="text-[9px]">⚠️</Badge>}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                    onClick={() => removeFlow(f.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Right Panel - Visualization & Threats */}
                <Card className="xl:col-span-2 border-primary/10 flex flex-col max-h-[800px]">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <div className="px-4 pt-4 border-b">
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="design" className="gap-2">
                                    <Network className="h-4 w-4" />
                                    Architecture Diagram
                                </TabsTrigger>
                                <TabsTrigger value="threats" className="gap-2">
                                    <ShieldAlert className="h-4 w-4" />
                                    Threat Analysis
                                    {threats.length > 0 && (
                                        <Badge variant="destructive" className="ml-1 h-5 px-1.5">{threats.length}</Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="design" className="flex-1 p-4 m-0">
                            {diagramSvg ? (
                                <div
                                    className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-xl p-4 overflow-auto"
                                    dangerouslySetInnerHTML={{ __html: diagramSvg }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center space-y-4 max-w-md">
                                        <div className="p-6 rounded-full bg-secondary/30 w-fit mx-auto">
                                            <Network className="h-12 w-12 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="font-semibold">Design Your Architecture</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Add components and data flows in the designer panel, or load a template to get started quickly.
                                        </p>
                                        <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                                            <Layers className="h-4 w-4 mr-2" />
                                            Browse Templates
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="threats" className="flex-1 m-0 overflow-hidden">
                            {threats.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center p-8">
                                    <div className="text-center space-y-4 max-w-md">
                                        <div className="p-6 rounded-full bg-secondary/30 w-fit mx-auto">
                                            <Shield className="h-12 w-12 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="font-semibold">No Threats Analyzed Yet</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Design your architecture and click "Run STRIDE Analysis" to identify potential security threats.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <ScrollArea className="h-full">
                                    <div className="p-4 space-y-3">
                                        {threats.map(threat => (
                                            <Card
                                                key={threat.id}
                                                className={`border-l-4 cursor-pointer transition-all hover:shadow-lg ${threat.riskScore >= 8 ? 'border-l-red-500 bg-red-500/5' :
                                                        threat.riskScore >= 6 ? 'border-l-orange-500 bg-orange-500/5' :
                                                            threat.riskScore >= 4 ? 'border-l-amber-500 bg-amber-500/5' :
                                                                'border-l-blue-500 bg-blue-500/5'
                                                    } ${threat.status === 'mitigated' ? 'opacity-60' : ''}`}
                                                onClick={() => setSelectedThreat(threat)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <Badge className={`${STRIDE_INFO[threat.stride].color} text-white text-[10px]`}>
                                                                    {threat.stride} - {STRIDE_INFO[threat.stride].name}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-[10px]">
                                                                    {threat.cweId}
                                                                </Badge>
                                                                {threat.status === 'mitigated' && (
                                                                    <Badge className="bg-emerald-500 text-white text-[10px]">
                                                                        <CheckCircle className="h-3 w-3 mr-1" /> Mitigated
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <h4 className="font-semibold text-sm">{threat.title}</h4>
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{threat.description}</p>
                                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                                                <span>Asset: <span className="text-foreground">{threat.affectedAsset}</span></span>
                                                                <span>•</span>
                                                                <span>Likelihood: <span className="text-foreground">{threat.likelihood}</span></span>
                                                                <span>•</span>
                                                                <span>Impact: <span className="text-foreground">{threat.impact}</span></span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className={`text-2xl font-bold ${threat.riskScore >= 8 ? 'text-red-500' :
                                                                    threat.riskScore >= 6 ? 'text-orange-500' :
                                                                        threat.riskScore >= 4 ? 'text-amber-500' :
                                                                            'text-blue-500'
                                                                }`}>
                                                                {threat.riskScore}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">Risk</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>

            {/* Template Dialog */}
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Load Architecture Template</DialogTitle>
                        <DialogDescription>Start with a pre-built architecture pattern</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {ARCHITECTURE_TEMPLATES.map(template => (
                            <Card
                                key={template.id}
                                className="cursor-pointer hover:border-primary transition-colors"
                                onClick={() => loadTemplate(template.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold">{template.name}</h4>
                                            <p className="text-sm text-muted-foreground">{template.description}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="secondary">{template.components.length} components</Badge>
                                                <Badge variant="secondary">{template.flows.length} flows</Badge>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Threat Detail Dialog */}
            <Dialog open={!!selectedThreat} onOpenChange={() => setSelectedThreat(null)}>
                <DialogContent className="max-w-2xl">
                    {selectedThreat && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className={`${STRIDE_INFO[selectedThreat.stride].color} text-white`}>
                                        {STRIDE_INFO[selectedThreat.stride].name}
                                    </Badge>
                                    <Badge variant="outline">{selectedThreat.cweId}</Badge>
                                    <Badge variant="outline" className={
                                        selectedThreat.riskScore >= 8 ? 'border-red-500 text-red-500' :
                                            selectedThreat.riskScore >= 6 ? 'border-orange-500 text-orange-500' :
                                                'border-amber-500 text-amber-500'
                                    }>
                                        Risk Score: {selectedThreat.riskScore}/10
                                    </Badge>
                                </div>
                                <DialogTitle>{selectedThreat.title}</DialogTitle>
                                <DialogDescription>Affected Asset: {selectedThreat.affectedAsset}</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Description</h4>
                                    <p className="text-sm text-muted-foreground">{selectedThreat.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg bg-secondary/30">
                                        <div className="text-xs text-muted-foreground mb-1">Likelihood</div>
                                        <div className="font-semibold">{selectedThreat.likelihood}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-secondary/30">
                                        <div className="text-xs text-muted-foreground mb-1">Impact</div>
                                        <div className="font-semibold">{selectedThreat.impact}</div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <h4 className="text-sm font-semibold text-emerald-500 mb-2 flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Recommended Mitigation
                                    </h4>
                                    <p className="text-sm">{selectedThreat.mitigation}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Update Status</h4>
                                    <div className="flex gap-2">
                                        {(['identified', 'mitigated', 'accepted', 'transferred'] as const).map(status => (
                                            <Button
                                                key={status}
                                                size="sm"
                                                variant={selectedThreat.status === status ? 'default' : 'outline'}
                                                onClick={() => {
                                                    updateThreatStatus(selectedThreat.id, status);
                                                    setSelectedThreat({ ...selectedThreat, status });
                                                }}
                                                className="capitalize"
                                            >
                                                {status}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedThreat(null)}>Close</Button>
                                <Button>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Threat
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
