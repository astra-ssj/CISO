"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    GitBranch,
    Cloud,
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Play,
    Clock,
    GitCommit,
    Container,
    Lock,
    Key,
    Database,
    Server,
    RefreshCw,
    ExternalLink,
    Loader2,
    Bug,
    FileWarning,
    Scan
} from "lucide-react";

// Mock data for CI/CD pipelines
const MOCK_PIPELINES = [
    {
        id: "build-main",
        name: "Build & Deploy Main",
        repo: "astra-ciso/app",
        branch: "main",
        status: "success",
        securityScore: 92,
        lastRun: new Date(Date.now() - 1000 * 60 * 15),
        duration: "4m 32s",
        findings: {
            critical: 0,
            high: 1,
            medium: 3,
            low: 8
        },
        stages: [
            { name: "Build", status: "success", duration: "1m 12s" },
            { name: "SAST Scan", status: "success", duration: "45s" },
            { name: "Dependency Check", status: "warning", duration: "1m 05s" },
            { name: "Container Scan", status: "success", duration: "38s" },
            { name: "Deploy", status: "success", duration: "52s" }
        ]
    },
    {
        id: "build-feature",
        name: "Feature Branch CI",
        repo: "astra-ciso/app",
        branch: "feature/auth-refactor",
        status: "running",
        securityScore: null,
        lastRun: new Date(),
        duration: "2m 18s",
        findings: null,
        stages: [
            { name: "Build", status: "success", duration: "1m 08s" },
            { name: "SAST Scan", status: "running", duration: "1m 10s" },
            { name: "Dependency Check", status: "pending", duration: "-" },
            { name: "Container Scan", status: "pending", duration: "-" },
            { name: "Deploy", status: "pending", duration: "-" }
        ]
    },
    {
        id: "security-scan",
        name: "Nightly Security Scan",
        repo: "astra-ciso/*",
        branch: "all",
        status: "failed",
        securityScore: 68,
        lastRun: new Date(Date.now() - 1000 * 60 * 60 * 8),
        duration: "12m 45s",
        findings: {
            critical: 2,
            high: 5,
            medium: 12,
            low: 23
        },
        stages: [
            { name: "SAST", status: "success", duration: "3m 22s" },
            { name: "DAST", status: "failed", duration: "4m 15s" },
            { name: "SCA", status: "success", duration: "2m 05s" },
            { name: "Secrets Scan", status: "warning", duration: "1m 33s" },
            { name: "SBOM Gen", status: "success", duration: "1m 30s" }
        ]
    }
];

// Mock cloud security data
const MOCK_CLOUD_RESOURCES = [
    {
        type: "AWS",
        icon: "☁️",
        resources: 156,
        compliant: 142,
        critical: 2,
        high: 8,
        medium: 4,
        services: [
            { name: "EC2", count: 24, issues: 3 },
            { name: "S3", count: 45, issues: 2 },
            { name: "IAM", count: 32, issues: 5 },
            { name: "RDS", count: 8, issues: 1 },
            { name: "Lambda", count: 47, issues: 3 }
        ]
    },
    {
        type: "Azure",
        icon: "🔷",
        resources: 89,
        compliant: 81,
        critical: 1,
        high: 4,
        medium: 3,
        services: [
            { name: "VMs", count: 18, issues: 2 },
            { name: "Storage", count: 22, issues: 1 },
            { name: "AD", count: 15, issues: 3 },
            { name: "SQL", count: 12, issues: 1 },
            { name: "Functions", count: 22, issues: 1 }
        ]
    },
    {
        type: "GCP",
        icon: "🌐",
        resources: 45,
        compliant: 43,
        critical: 0,
        high: 1,
        medium: 1,
        services: [
            { name: "Compute", count: 12, issues: 1 },
            { name: "Storage", count: 15, issues: 0 },
            { name: "BigQuery", count: 8, issues: 1 },
            { name: "GKE", count: 10, issues: 0 }
        ]
    }
];

const MOCK_FINDINGS = [
    { id: "SEC-001", severity: "critical", title: "Exposed AWS Access Keys in Repository", resource: "github/astra-ciso/app", age: "2h" },
    { id: "SEC-002", severity: "critical", title: "Public S3 Bucket with Sensitive Data", resource: "aws/s3/logs-backup", age: "4h" },
    { id: "SEC-003", severity: "high", title: "Outdated Base Image with Known CVEs", resource: "docker/astra-api:latest", age: "1d" },
    { id: "SEC-004", severity: "high", title: "IAM User with Excessive Permissions", resource: "aws/iam/deploy-user", age: "3d" },
    { id: "SEC-005", severity: "high", title: "Unencrypted RDS Instance", resource: "aws/rds/analytics-db", age: "5d" },
    { id: "SEC-006", severity: "medium", title: "Missing Network Segmentation", resource: "azure/vnet/prod-network", age: "7d" },
    { id: "SEC-007", severity: "medium", title: "Deprecated TLS Version in Use", resource: "aws/elb/api-gateway", age: "14d" },
];

function PipelineCard({ pipeline }: { pipeline: typeof MOCK_PIPELINES[0] }) {
    const statusConfig = {
        success: { color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle },
        failed: { color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
        running: { color: "text-blue-500", bg: "bg-blue-500/10", icon: Loader2 },
        warning: { color: "text-amber-500", bg: "bg-amber-500/10", icon: AlertTriangle }
    };

    const config = statusConfig[pipeline.status as keyof typeof statusConfig] || statusConfig.success;
    const StatusIcon = config.icon;

    return (
        <Card className="border-border hover:border-primary/30 transition-all">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h4 className="font-semibold flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                            {pipeline.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {pipeline.repo} • {pipeline.branch}
                        </p>
                    </div>
                    <div className={`p-1.5 rounded-lg ${config.bg}`}>
                        <StatusIcon className={`h-4 w-4 ${config.color} ${pipeline.status === 'running' ? 'animate-spin' : ''}`} />
                    </div>
                </div>

                {/* Stages */}
                <div className="flex gap-1 mb-3">
                    {pipeline.stages.map((stage, i) => (
                        <div
                            key={i}
                            className={`flex-1 h-1.5 rounded-full ${stage.status === 'success' ? 'bg-emerald-500' :
                                    stage.status === 'failed' ? 'bg-red-500' :
                                        stage.status === 'warning' ? 'bg-amber-500' :
                                            stage.status === 'running' ? 'bg-blue-500 animate-pulse' :
                                                'bg-secondary'
                                }`}
                            title={`${stage.name}: ${stage.status}`}
                        />
                    ))}
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {pipeline.duration}
                    </span>
                    {pipeline.findings && (
                        <div className="flex gap-2">
                            {pipeline.findings.critical > 0 && (
                                <Badge variant="destructive" className="text-[10px] h-5">
                                    {pipeline.findings.critical} Critical
                                </Badge>
                            )}
                            {pipeline.findings.high > 0 && (
                                <Badge className="bg-amber-500/20 text-amber-600 text-[10px] h-5 hover:bg-amber-500/20">
                                    {pipeline.findings.high} High
                                </Badge>
                            )}
                        </div>
                    )}
                    {pipeline.securityScore && (
                        <span className={`font-mono font-bold ${pipeline.securityScore >= 90 ? 'text-emerald-500' :
                                pipeline.securityScore >= 70 ? 'text-amber-500' : 'text-red-500'
                            }`}>
                            {pipeline.securityScore}%
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function CloudProviderCard({ provider }: { provider: typeof MOCK_CLOUD_RESOURCES[0] }) {
    const complianceRate = Math.round((provider.compliant / provider.resources) * 100);

    return (
        <Card className="border-border">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                            <h4 className="font-semibold">{provider.type}</h4>
                            <p className="text-xs text-muted-foreground">{provider.resources} resources</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${complianceRate >= 90 ? 'text-emerald-500' :
                                complianceRate >= 70 ? 'text-amber-500' : 'text-red-500'
                            }`}>
                            {complianceRate}%
                        </div>
                        <p className="text-xs text-muted-foreground">compliant</p>
                    </div>
                </div>

                <Progress value={complianceRate} className="h-2 mb-4" />

                <div className="flex gap-2 mb-3">
                    {provider.critical > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                            {provider.critical} Critical
                        </Badge>
                    )}
                    {provider.high > 0 && (
                        <Badge className="bg-amber-500/20 text-amber-600 text-[10px] hover:bg-amber-500/20">
                            {provider.high} High
                        </Badge>
                    )}
                    {provider.medium > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                            {provider.medium} Medium
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {provider.services.slice(0, 4).map((service, i) => (
                        <div key={i} className="text-xs bg-secondary/30 p-2 rounded flex justify-between">
                            <span className="text-muted-foreground">{service.name}</span>
                            <span className={service.issues > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                                {service.issues > 0 ? `${service.issues} issues` : '✓'}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function SecOpsPage() {
    const [isScanning, setIsScanning] = useState(false);

    const totalFindings = {
        critical: MOCK_FINDINGS.filter(f => f.severity === 'critical').length,
        high: MOCK_FINDINGS.filter(f => f.severity === 'high').length,
        medium: MOCK_FINDINGS.filter(f => f.severity === 'medium').length
    };

    const runScan = () => {
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 3000);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">SecOps Center</h1>
                    <p className="text-muted-foreground mt-1">CI/CD security, cloud posture, and vulnerability management</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={runScan} disabled={isScanning}>
                        {isScanning ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Scan className="h-4 w-4 mr-2" />
                        )}
                        {isScanning ? 'Scanning...' : 'Run Full Scan'}
                    </Button>
                    <Button size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View All Findings
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-red-500/20 bg-red-500/5">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <XCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-500">{totalFindings.critical}</div>
                            <p className="text-xs text-muted-foreground">Critical Findings</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-amber-500">{totalFindings.high}</div>
                            <p className="text-xs text-muted-foreground">High Priority</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Shield className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-emerald-500">87%</div>
                            <p className="text-xs text-muted-foreground">Cloud Posture</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <GitCommit className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-primary">24</div>
                            <p className="text-xs text-muted-foreground">Pipelines Secured</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="pipelines" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="pipelines" className="gap-2">
                        <GitBranch className="h-4 w-4" />
                        CI/CD Pipelines
                    </TabsTrigger>
                    <TabsTrigger value="cloud" className="gap-2">
                        <Cloud className="h-4 w-4" />
                        Cloud Security
                    </TabsTrigger>
                    <TabsTrigger value="findings" className="gap-2">
                        <Bug className="h-4 w-4" />
                        Findings
                    </TabsTrigger>
                </TabsList>

                {/* Pipelines Tab */}
                <TabsContent value="pipelines" className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MOCK_PIPELINES.map(pipeline => (
                            <PipelineCard key={pipeline.id} pipeline={pipeline} />
                        ))}
                    </div>

                    <Card className="border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Container className="h-5 w-5 text-primary" />
                                Security Gates Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { name: "SAST", passed: 18, failed: 2, icon: Scan },
                                    { name: "DAST", passed: 12, failed: 3, icon: Bug },
                                    { name: "SCA", passed: 20, failed: 0, icon: Database },
                                    { name: "Secrets", passed: 19, failed: 1, icon: Key },
                                    { name: "Container", passed: 15, failed: 2, icon: Container }
                                ].map((gate, i) => (
                                    <div key={i} className="p-3 bg-secondary/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <gate.icon className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{gate.name}</span>
                                        </div>
                                        <div className="flex gap-2 text-xs">
                                            <span className="text-emerald-500">{gate.passed} ✓</span>
                                            <span className="text-red-500">{gate.failed} ✗</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Cloud Security Tab */}
                <TabsContent value="cloud" className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        {MOCK_CLOUD_RESOURCES.map((provider, i) => (
                            <CloudProviderCard key={i} provider={provider} />
                        ))}
                    </div>

                    <Card className="border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                Cloud Security Benchmarks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { name: "CIS AWS Foundations", score: 89, total: 120, passed: 107 },
                                    { name: "CIS Azure Foundations", score: 85, total: 95, passed: 81 },
                                    { name: "SOC 2 Controls", score: 92, total: 64, passed: 59 },
                                    { name: "PCI DSS", score: 78, total: 48, passed: 37 }
                                ].map((benchmark, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-48">
                                            <span className="text-sm font-medium">{benchmark.name}</span>
                                        </div>
                                        <div className="flex-1">
                                            <Progress value={benchmark.score} className="h-2" />
                                        </div>
                                        <div className="w-24 text-right">
                                            <span className={`font-mono font-bold ${benchmark.score >= 90 ? 'text-emerald-500' :
                                                    benchmark.score >= 70 ? 'text-amber-500' : 'text-red-500'
                                                }`}>
                                                {benchmark.score}%
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-2">
                                                ({benchmark.passed}/{benchmark.total})
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Findings Tab */}
                <TabsContent value="findings" className="space-y-4">
                    <Card className="border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileWarning className="h-5 w-5 text-primary" />
                                Active Security Findings
                            </CardTitle>
                            <CardDescription>Prioritized by severity and age</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {MOCK_FINDINGS.map((finding, i) => (
                                    <div
                                        key={finding.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${finding.severity === 'critical' ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10' :
                                                finding.severity === 'high' ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10' :
                                                    'border-border bg-secondary/30 hover:bg-secondary/50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono text-muted-foreground">{finding.id}</span>
                                                    <Badge className={`text-[10px] ${finding.severity === 'critical' ? 'bg-red-500 hover:bg-red-500' :
                                                            finding.severity === 'high' ? 'bg-amber-500 hover:bg-amber-500' :
                                                                'bg-secondary'
                                                        }`}>
                                                        {finding.severity.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <h4 className="font-medium text-sm">{finding.title}</h4>
                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                    <Server className="h-3 w-3" />
                                                    {finding.resource}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-muted-foreground">{finding.age} ago</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
