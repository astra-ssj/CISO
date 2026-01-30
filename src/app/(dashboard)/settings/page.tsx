"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ShieldCheck, Upload, AlertTriangle, FileJson, Server, X } from "lucide-react";
import { scanMicrosoftConfig, scanFirewallConfig, SecurityScore } from "@/lib/config-scanner";

export default function SettingsPage() {
    const [msConfig, setMsConfig] = useState("");
    const [fwConfig, setFwConfig] = useState("");
    const [result, setResult] = useState<SecurityScore | null>(null);
    const [resultType, setResultType] = useState<'MICROSOFT' | 'FIREWALL' | null>(null);

    // Dialog States
    const [msDialogOpen, setMsDialogOpen] = useState(false);
    const [fwDialogOpen, setFwDialogOpen] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'MICROSOFT' | 'FIREWALL') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                if (type === 'MICROSOFT') setMsConfig(text);
                else setFwConfig(text);
            };
            reader.readAsText(file);
        }
        // Reset input to allow re-uploading the same file if needed
        e.target.value = '';
    };

    const clearConfig = (type: 'MICROSOFT' | 'FIREWALL') => {
        if (type === 'MICROSOFT') setMsConfig("");
        else setFwConfig("");
        setResult(null);
    };

    const runAnalysis = (type: 'MICROSOFT' | 'FIREWALL') => {
        const data = type === 'MICROSOFT' ? msConfig : fwConfig;
        const res = type === 'MICROSOFT' ? scanMicrosoftConfig(data) : scanFirewallConfig(data);
        setResult(res);
        setResultType(type);
        if (type === 'MICROSOFT') setMsDialogOpen(true);
        else setFwDialogOpen(true);
    };

    const handleDialogChange = (open: boolean, type: 'MICROSOFT' | 'FIREWALL') => {
        if (type === 'MICROSOFT') setMsDialogOpen(open);
        else setFwDialogOpen(open);

        if (!open) {
            // Optional: Clear result when dialog closes to force fresh analysis next time?
            // Or keep it. User requested "clear cache", implies resetting state.
            // We will clear the result view state, but maybe keep the file loaded?
            // Let's keep the file but clear the result object to be safe.
            setResult(null);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuration Security</h1>
                <p className="text-muted-foreground">Automated review of infrastructure and cloud configurations against CIS Benchmarks.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Microsoft Tenant Review */}
                <Card className="bg-card border-primary/10 flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <ShieldCheck className="h-6 w-6 text-blue-500" />
                            </div>
                            <CardTitle>Microsoft 365 / Azure</CardTitle>
                        </div>
                        <CardDescription>Upload tenant configuration (JSON) or paste content directly.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                        <Tabs defaultValue="upload" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="upload">Upload File</TabsTrigger>
                                <TabsTrigger value="paste">Paste Config</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="mt-0">
                                <div className="border-2 border-dashed rounded-xl h-[200px] flex flex-col items-center justify-center bg-secondary/5 text-muted-foreground relative hover:bg-secondary/10 transition-colors">
                                    <FileJson className="h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">Upload Config JSON</p>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => handleFileUpload(e, 'MICROSOFT')}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-50"
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="paste" className="mt-0">
                                <Textarea
                                    placeholder="Paste Microsoft configuration JSON here..."
                                    className="h-[200px] font-mono text-xs resize-none"
                                    value={msConfig}
                                    onChange={(e) => setMsConfig(e.target.value)}
                                />
                            </TabsContent>
                        </Tabs>

                        {msConfig && (
                            <div className="flex items-center justify-between text-sm bg-secondary/20 p-2 rounded">
                                <span className="font-mono text-xs truncate max-w-[200px] text-emerald-600">Configuration Loaded</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">Ready</Badge>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => clearConfig('MICROSOFT')}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        <Dialog open={msDialogOpen} onOpenChange={(o) => handleDialogChange(o, 'MICROSOFT')}>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={!msConfig} onClick={() => runAnalysis('MICROSOFT')}>
                                Analyze Configuration
                            </Button>
                            <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>Configuration Analysis Report</DialogTitle>
                                    <DialogDescription>Findings based on CIS Benchmark standards.</DialogDescription>
                                </DialogHeader>
                                {result && resultType === 'MICROSOFT' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="text-4xl font-bold text-foreground">{result.score}%</div>
                                            <Progress value={result.score} className="h-4" />
                                        </div>
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                            {result.findings.map((f, i) => (
                                                <div key={i} className="p-4 border rounded-lg bg-red-500/5 border-red-500/10">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-semibold text-red-600 flex items-center gap-2">
                                                            <AlertTriangle className="h-4 w-4" /> {f.title}
                                                        </span>
                                                        <Badge variant="destructive">{f.severity}</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">{f.description}</p>
                                                    <div className="text-xs font-mono text-muted-foreground bg-background/50 p-1 rounded inline-block">
                                                        Ref: {f.cisControl}
                                                    </div>
                                                </div>
                                            ))}
                                            {result.findings.length === 0 && <div className="text-center text-emerald-500 py-8">No Issues Found. Configuration is secure.</div>}
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* Firewall Review */}
                <Card className="bg-card border-primary/10 flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Server className="h-6 w-6 text-orange-500" />
                            </div>
                            <CardTitle>Firewall Configuration</CardTitle>
                        </div>
                        <CardDescription>Review firewall rules (JSON/Text) or paste directly.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                        <Tabs defaultValue="upload" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="upload">Upload File</TabsTrigger>
                                <TabsTrigger value="paste">Paste Config</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="mt-0">
                                <div className="border-2 border-dashed rounded-xl h-[200px] flex flex-col items-center justify-center bg-secondary/5 text-muted-foreground relative hover:bg-secondary/10 transition-colors">
                                    <FileJson className="h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">Upload Rule Export</p>
                                    <input
                                        type="file"
                                        accept=".json,.txt"
                                        onChange={(e) => handleFileUpload(e, 'FIREWALL')}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-50"
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="paste" className="mt-0">
                                <Textarea
                                    placeholder="Paste firewall rules (e.g., 'permit ip any any') here..."
                                    className="h-[200px] font-mono text-xs resize-none"
                                    value={fwConfig}
                                    onChange={(e) => setFwConfig(e.target.value)}
                                />
                            </TabsContent>
                        </Tabs>

                        {fwConfig && (
                            <div className="flex items-center justify-between text-sm bg-secondary/20 p-2 rounded">
                                <span className="font-mono text-xs truncate max-w-[200px] text-emerald-600">Configuration Loaded</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">Ready</Badge>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => clearConfig('FIREWALL')}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        <Dialog open={fwDialogOpen} onOpenChange={(o) => handleDialogChange(o, 'FIREWALL')}>
                            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={!fwConfig} onClick={() => runAnalysis('FIREWALL')}>
                                Analyze Firewall Rules
                            </Button>
                            <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>Firewall Risk Report</DialogTitle>
                                    <DialogDescription>Findings based on Network Security best practices.</DialogDescription>
                                </DialogHeader>
                                {result && resultType === 'FIREWALL' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="text-4xl font-bold text-foreground">{result.score}%</div>
                                            <Progress value={result.score} className="h-4" />
                                        </div>
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                            {result.findings.map((f, i) => (
                                                <div key={i} className="p-4 border rounded-lg bg-orange-500/5 border-orange-500/10">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-semibold text-orange-600 flex items-center gap-2">
                                                            <AlertTriangle className="h-4 w-4" /> {f.title}
                                                        </span>
                                                        <Badge className="bg-orange-500 hover:bg-orange-600 border-orange-200">{f.severity}</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">{f.description}</p>
                                                    <div className="text-xs font-mono text-muted-foreground bg-background/50 p-1 rounded inline-block">
                                                        Ref: {f.cisControl}
                                                    </div>
                                                </div>
                                            ))}
                                            {result.findings.length === 0 && <div className="text-center text-emerald-500 py-8">No Issues Found. Configuration is secure.</div>}
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
