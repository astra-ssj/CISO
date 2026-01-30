"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, ArrowRight, ShieldAlert, Network, Server, Play, Save } from 'lucide-react';
import { Architecture, Component, DataFlow, Threat, analyzeArchitecture, generateMermaidDiagram } from "@/lib/threat-engine";
import mermaid from 'mermaid';

export default function ThreatModelingPage() {
    // Architectural State
    const [components, setComponents] = useState<Component[]>([]);
    const [flows, setFlows] = useState<DataFlow[]>([]);
    const [threats, setThreats] = useState<Threat[]>([]);
    const [diagramSvg, setDiagramSvg] = useState<string>('');
    const [activeTab, setActiveTab] = useState("design");

    // Form Stats
    const [newCompName, setNewCompName] = useState('');
    const [newCompType, setNewCompType] = useState<string>('WEB_APP');
    const [newCompPublic, setNewCompPublic] = useState(false);

    const [newFlowSource, setNewFlowSource] = useState('');
    const [newFlowTarget, setNewFlowTarget] = useState('');
    const [newFlowProto, setNewFlowProto] = useState<string>('HTTPS');
    const [newFlowAuth, setNewFlowAuth] = useState(true);

    // Initialize Mermaid
    useEffect(() => {
        mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    }, []);

    // Analyze & Render
    const runAnalysis = async () => {
        const arch: Architecture = { components, flows };

        // 1. Identify Threats
        const identifiedThreats = analyzeArchitecture(arch);
        setThreats(identifiedThreats);

        // 2. Generate Diagram Code
        const mermaidCode = generateMermaidDiagram(arch, identifiedThreats);

        // 3. Render Mermaid to SVG
        try {
            const { svg } = await mermaid.render('mermaid-diagram', mermaidCode);
            setDiagramSvg(svg);
        } catch (e) {
            console.error("Mermaid Render Error", e);
        }

        setActiveTab('analysis');
    };

    // Handlers
    const addComponent = () => {
        if (!newCompName) return;
        setComponents([...components, {
            id: `comp-${Date.now()}`,
            name: newCompName,
            type: newCompType as any,
            isPublic: newCompPublic
        }]);
        setNewCompName('');
    };

    const addFlow = () => {
        if (!newFlowSource || !newFlowTarget) return;
        setFlows([...flows, {
            id: `flow-${Date.now()}`,
            sourceId: newFlowSource,
            targetId: newFlowTarget,
            description: 'Data Transfer',
            protocol: newFlowProto as any,
            hasAuthentication: newFlowAuth
        }]);
    };

    const removeComponent = (id: string) => {
        setComponents(components.filter(c => c.id !== id));
        setFlows(flows.filter(f => f.sourceId !== id && f.targetId !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Threat Modeling Engine</h1>
                <p className="text-muted-foreground">
                    Design your architecture and run the STRIDE engine to auto-generate threat assessments and data flow diagrams.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
                {/* LEFT: Designer */}
                <Card className="lg:col-span-1 bg-card/50 border-primary/10 flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-primary" /> Architecture Designer
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 overflow-y-auto flex-1 p-4">

                        {/* Add Component */}
                        <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-white/5">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase">1. Add Components</h3>
                            <Input
                                placeholder="Component Name (e.g. Frontend)"
                                value={newCompName}
                                onChange={e => setNewCompName(e.target.value)}
                            />
                            <Select value={newCompType} onValueChange={setNewCompType}>
                                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WEB_APP">Web Application</SelectItem>
                                    <SelectItem value="API">API Service</SelectItem>
                                    <SelectItem value="DATABASE">Database</SelectItem>
                                    <SelectItem value="EXTERNAL_SERVICE">External 3rd Party</SelectItem>
                                    <SelectItem value="USER_BROWSER">User Browser</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={newCompPublic ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setNewCompPublic(!newCompPublic)}
                                    className="text-xs w-full"
                                >
                                    {newCompPublic ? "Publicly Accessible" : "Internal Only"}
                                </Button>
                            </div>
                            <Button className="w-full" onClick={addComponent} disabled={!newCompName}>
                                <Plus className="h-4 w-4 mr-2" /> Add Component
                            </Button>
                        </div>

                        {/* Inventory List */}
                        <div className="space-y-2">
                            {components.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-2 bg-black/20 rounded border border-white/5 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                                        <span>{c.name}</span>
                                        {c.isPublic && <Badge className="bg-red-500/20 text-red-500 text-[10px] border-0">PUBLIC</Badge>}
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => removeComponent(c.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="h-px bg-white/10" />

                        {/* Add Flow */}
                        <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-white/5">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase">2. Define Flows</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={newFlowSource} onValueChange={setNewFlowSource}>
                                    <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                                    <SelectContent>
                                        {components.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={newFlowTarget} onValueChange={setNewFlowTarget}>
                                    <SelectTrigger><SelectValue placeholder="Target" /></SelectTrigger>
                                    <SelectContent>
                                        {components.filter(c => c.id !== newFlowSource).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={newFlowProto} onValueChange={setNewFlowProto}>
                                    <SelectTrigger><SelectValue placeholder="Protocol" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HTTPS">HTTPS (Encrypted)</SelectItem>
                                        <SelectItem value="HTTP">HTTP (Cleartext)</SelectItem>
                                        <SelectItem value="SQL">SQL Connection</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant={newFlowAuth ? "default" : "destructive"}
                                    size="sm"
                                    onClick={() => setNewFlowAuth(!newFlowAuth)}
                                    className="text-xs"
                                >
                                    {newFlowAuth ? "Authenticated" : "No Auth"}
                                </Button>
                            </div>
                            <Button className="w-full" onClick={addFlow} disabled={!newFlowSource || !newFlowTarget}>
                                <Network className="h-4 w-4 mr-2" /> Link Components
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {flows.map(f => {
                                const src = components.find(c => c.id === f.sourceId)?.name;
                                const tgt = components.find(c => c.id === f.targetId)?.name;
                                return (
                                    <div key={f.id} className="flex items-center justify-between p-2 bg-black/20 rounded border border-white/5 text-sm">
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-muted-foreground">{src}</span>
                                            <ArrowRight className="h-3 w-3 mx-1" />
                                            <span className="text-muted-foreground">{tgt}</span>
                                        </div>
                                        <Badge variant="secondary" className="text-[10px]">{f.protocol}</Badge>
                                    </div>
                                )
                            })}
                        </div>

                    </CardContent>
                    <div className="p-4 border-t border-white/10">
                        <Button
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                            size="lg"
                            onClick={runAnalysis}
                            disabled={components.length < 2 || flows.length < 1}
                        >
                            <Play className="h-4 w-4 mr-2" /> Generate Threat Model
                        </Button>
                    </div>
                </Card>

                {/* RIGHT: Analysis & Visualization */}
                <Card className="lg:col-span-2 bg-black/40 border-primary/20 flex flex-col overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <div className="px-6 pt-4 border-b border-white/5">
                            <TabsList>
                                <TabsTrigger value="design">Diagram View</TabsTrigger>
                                <TabsTrigger value="analysis">
                                    Threat Analysis
                                    {threats.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5">{threats.length}</Badge>}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="design" className="flex-1 p-6 flex flex-col items-center justify-center bg-[#1a1a1a] relative min-h-[500px]">
                            {diagramSvg ? (
                                <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: diagramSvg }} />
                            ) : (
                                <div className="text-center text-muted-foreground space-y-4">
                                    <Network className="h-16 w-16 mx-auto opacity-20" />
                                    <p>Build your architecture on the left and click "Generate Threat Model"</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="analysis" className="flex-1 p-0 overflow-y-auto">
                            {threats.length === 0 ? (
                                <div className="p-10 text-center text-muted-foreground">No threats detected yet.</div>
                            ) : (
                                <div className="divide-y divide-white/10">
                                    {threats.map(threat => (
                                        <div key={threat.id} className="p-6 hover:bg-white/5 transition-colors group">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <ShieldAlert className="h-5 w-5 text-red-500" />
                                                    <h4 className="font-bold text-red-400 group-hover:text-red-300">{threat.title}</h4>
                                                </div>
                                                <Badge variant="outline" className="border-red-500/20 text-red-500 font-mono tracking-wider">
                                                    STRIDE: {threat.category}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4 pl-8">
                                                {threat.description}
                                            </p>
                                            <div className="pl-8">
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-sm flex items-start gap-2">
                                                    <Save className="h-4 w-4 text-emerald-500 mt-0.5" />
                                                    <div>
                                                        <span className="font-bold text-emerald-500 block text-xs uppercase mb-1">Recommended Mitigation</span>
                                                        <span className="text-emerald-200/80">{threat.mitigation}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
