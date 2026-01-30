"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Server, Shield, Terminal, Zap } from "lucide-react";
import { scanFirewallConfig, scanMicrosoftConfig, scanSwitchConfig, scanSIEMConfig, SecurityScore } from "@/lib/config-scanner";

export default function InfrastructurePage() {
    const [configType, setConfigType] = useState("firewall");
    const [inputConfig, setInputConfig] = useState("");
    const [result, setResult] = useState<SecurityScore | null>(null);

    const handleScan = () => {
        let score: SecurityScore = { score: 100, findings: [] };
        if (configType === 'firewall') score = scanFirewallConfig(inputConfig);
        if (configType === 'cloud') score = scanMicrosoftConfig(inputConfig);
        if (configType === 'switch') score = scanSwitchConfig(inputConfig);
        if (configType === 'siem') score = scanSIEMConfig(inputConfig);
        setResult(score);
    };

    const getGoldenConfig = (type: string) => {
        if (type === 'nginx') return `# Nginx Hardened Config
server {
    listen 443 ssl http2;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self';" always;
    add_header X-Frame-Options "SAMEORIGIN";
    server_tokens off;
    # ... certs ...
}`;
        if (type === 'aws') return `# Terraform S3 Hardened
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "my-secure-data"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "example" {
  bucket = aws_s3_bucket.secure_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}`;
        return "";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Server className="h-8 w-8 text-primary" /> Infrastructure Security
                </h1>
                <p className="text-muted-foreground">Audit technical configurations and generate hardened baselines.</p>
            </div>

            <Tabs defaultValue="audit" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="audit">Config Auditor</TabsTrigger>
                    <TabsTrigger value="generate">Secure Generator</TabsTrigger>
                </TabsList>

                {/* AUDITOR TAB */}
                <TabsContent value="audit" className="space-y-4">
                    <Card className="bg-card/30 border-primary/10">
                        <CardHeader>
                            <CardTitle>Technical Audit Engine</CardTitle>
                            <CardDescription>Paste raw configuration files to scan for CIS benchmarks.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <Select value={configType} onValueChange={setConfigType}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="firewall">Firewall (ACLs)</SelectItem>
                                        <SelectItem value="switch">Network Switch (IOS)</SelectItem>
                                        <SelectItem value="cloud">Cloud Policy (JSON)</SelectItem>
                                        <SelectItem value="siem">SIEM (Splunk/ELK)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleScan} className="bg-primary hover:bg-primary/90">
                                    <Zap className="mr-2 h-4 w-4" /> Run Audit
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Textarea
                                    placeholder={`Paste your ${configType} config here...`}
                                    className="h-[400px] font-mono text-xs bg-black/50 border-white/10"
                                    value={inputConfig}
                                    onChange={(e) => setInputConfig(e.target.value)}
                                />

                                <div className="space-y-4">
                                    {result ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                            <Card className="border-border/50 bg-background/50">
                                                <CardContent className="pt-6 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                                                        <span className={`text-4xl font-bold ${result.score > 80 ? 'text-emerald-500' : result.score > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                                            {result.score}/100
                                                        </span>
                                                    </div>
                                                    <Shield className={`h-12 w-12 ${result.score > 80 ? 'text-emerald-500/20' : 'text-red-500/20'}`} />
                                                </CardContent>
                                            </Card>

                                            <div className="space-y-2">
                                                <h3 className="font-semibold text-sm">Findings ({result.findings.length})</h3>
                                                {result.findings.length === 0 && (
                                                    <div className="p-4 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4" /> No issues found.
                                                    </div>
                                                )}
                                                {result.findings.map((f) => (
                                                    <div key={f.id} className="p-3 rounded border border-red-500/20 bg-red-500/5 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-red-400 border-red-500/30">{f.severity}</Badge>
                                                                <span className="font-medium text-sm text-red-100">{f.title}</span>
                                                            </div>
                                                            <span className="text-[10px] font-mono text-muted-foreground">{f.id}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{f.description}</p>
                                                        {f.cisControl && <p className="text-[10px] text-primary">{f.cisControl}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                            <Terminal className="h-12 w-12 mb-2" />
                                            <p>Awaiting Input...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* GENERATOR TAB */}
                <TabsContent value="generate">
                    <Card className="bg-card/30 border-primary/10">
                        <CardHeader>
                            <CardTitle>Secure Config Generator</CardTitle>
                            <CardDescription>Generate pre-hardened configurations based on industry best practices.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg border border-border bg-card/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setInputConfig(getGoldenConfig('nginx'))}>
                                        <h3 className="font-bold flex items-center gap-2"><Server className="h-4 w-4" /> Nginx Web Server</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Includes HSTS, CSP, and TLS 1.3 enforcement.</p>
                                    </div>
                                    <div className="p-4 rounded-lg border border-border bg-card/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setInputConfig(getGoldenConfig('aws'))}>
                                        <h3 className="font-bold flex items-center gap-2"><Shield className="h-4 w-4" /> AWS S3 Bucket</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Terraform with Default Encryption and Versioning.</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Textarea
                                        className="h-[300px] font-mono text-xs bg-emerald-950/30 text-emerald-400 border-emerald-500/20"
                                        value={inputConfig}
                                        readOnly
                                    />
                                    <Button className="absolute top-2 right-2 h-6 text-xs" variant="secondary" onClick={() => navigator.clipboard.writeText(inputConfig)}>
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
