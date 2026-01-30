"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Search, ShieldAlert, FileSearch, Eye, EyeOff, Upload, Lock } from "lucide-react";
import { scanContent, ScanResult } from "@/lib/pii-scanner";

export default function PrivacyPage() {
    const [inputText, setInputText] = useState("");
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);

    const handleScan = () => {
        if (!inputText) return;
        const result = scanContent(inputText);
        setScanResult(result);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setInputText(e.target?.result as string);
            reader.readAsText(file);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Lock className="h-8 w-8 text-primary" />
                    Data Privacy & GDPR Dissector
                </h1>
                <p className="text-muted-foreground text-lg">
                    Scan documents for PII, map to GDPR Articles, and generate redaction reports.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Input Area */}
                <Card className="md:col-span-1 h-fit border-primary/20 bg-card/50">
                    <CardHeader>
                        <CardTitle>Data Source</CardTitle>
                        <CardDescription>Paste text or upload a document to scan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative group">
                            <input
                                type="file"
                                id="pii-upload"
                                className="hidden"
                                accept=".txt,.md,.json,.csv"
                                onChange={handleFileUpload}
                            />
                            <div
                                onClick={() => document.getElementById('pii-upload')?.click()}
                                className="border-2 border-dashed border-border/50 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-primary/5 transition-colors cursor-pointer"
                            >
                                <Upload className="h-8 w-8 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                                <span className="text-sm font-medium">Drop file or click to upload</span>
                                <span className="text-xs text-muted-foreground mt-1">Local processing only. No data leaves your browser.</span>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/50" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or Paste Text</span>
                            </div>
                        </div>

                        <Textarea
                            placeholder="Paste raw data, email dumps, or logs here..."
                            className="min-h-[250px] font-mono text-xs bg-secondary/20 resize-none focus-visible:ring-primary"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />

                        <Button
                            onClick={handleScan}
                            disabled={!inputText}
                            className="w-full bg-primary hover:bg-primary/90 shadow-md"
                        >
                            <Search className="mr-2 h-4 w-4" />
                            Scan for PII
                        </Button>
                    </CardContent>
                </Card>

                {/* Results Area */}
                <div className="md:col-span-1 space-y-6">
                    {!scanResult ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 custom-dashed-border rounded-xl bg-secondary/10 text-muted-foreground">
                            <FileSearch className="h-16 w-16 mb-4 opacity-20" />
                            <h3 className="text-xl font-semibold mb-2">Awaiting Data</h3>
                            <p className="text-center max-w-xs text-sm">Upload content to identify GDPR risks and PII exposure.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Score Card */}
                            <Card className="overflow-hidden border-primary/20">
                                <div className={`h-1.5 w-full ${scanResult.riskScore > 75 ? 'bg-red-500' :
                                        scanResult.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`} />
                                <CardHeader className="pb-2 flex flex-row items-baseline justify-between">
                                    <CardTitle>Privacy Risk Score</CardTitle>
                                    <span className="text-2xl font-bold font-mono">{scanResult.riskScore}/100</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs uppercase tracking-wider">Total PII</span>
                                            <span className="font-semibold text-lg">{scanResult.totalPII}</span>
                                        </div>
                                        <div className="w-px bg-border h-10" />
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs uppercase tracking-wider text-red-500">High Sensitivity</span>
                                            <span className="font-semibold text-lg text-red-500">{scanResult.sensitiveCount}</span>
                                        </div>
                                    </div>

                                    {scanResult.sensitiveCount > 0 && (
                                        <Alert className="mt-4 bg-red-500/10 text-red-600 border-red-200 dark:border-red-900">
                                            <ShieldAlert className="h-4 w-4" />
                                            <AlertTitle>GDPR Article 9 Alert</AlertTitle>
                                            <AlertDescription className="text-xs">
                                                Special category data detected. Requires explicit consent or specific legal basis.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Detailed Views */}
                            <Tabs defaultValue="inventory" className="w-full">
                                <TabsList className="w-full grid grid-cols-2">
                                    <TabsTrigger value="inventory">Data Inventory</TabsTrigger>
                                    <TabsTrigger value="redacted">Redaction Preview</TabsTrigger>
                                </TabsList>

                                <TabsContent value="inventory" className="mt-4">
                                    <ScrollArea className="h-[400px] rounded-md border bg-card p-4">
                                        <div className="space-y-2">
                                            {scanResult.matches.map((m, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-secondary/50 border border-transparent hover:border-border transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className={`w-24 justify-center ${m.sensitivity === 'HIGH' ? 'border-red-500 text-red-500 bg-red-500/5' :
                                                                m.sensitivity === 'MEDIUM' ? 'border-amber-500 text-amber-500 bg-amber-500/5' :
                                                                    'border-blue-500 text-blue-500 bg-blue-500/5'
                                                            }`}>
                                                            {m.type}
                                                        </Badge>
                                                        <span className="text-sm font-mono truncate max-w-[150px]">{m.value}</span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
                                                        {m.gdprArticle}
                                                    </span>
                                                </div>
                                            ))}
                                            {scanResult.matches.length === 0 && (
                                                <div className="text-center py-10 text-muted-foreground">No PII detected.</div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="redacted" className="mt-4">
                                    <div className="relative">
                                        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur p-1 rounded border shadow-sm">
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <Textarea
                                            readOnly
                                            value={scanResult.redactedText}
                                            className="min-h-[400px] font-mono text-xs bg-secondary/30 resize-none text-muted-foreground"
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
