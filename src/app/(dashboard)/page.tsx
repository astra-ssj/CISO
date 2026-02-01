"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Send,
  ShieldQuestion,
  FileDown,
  Terminal,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAstraStore } from '@/lib/store';
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
import { Textarea } from "@/components/ui/textarea";
import { SecurityFeed } from "@/components/dashboard/security-feed";
import { generateExecutiveReport } from "@/lib/export-utils";
import { DecisionConsole } from '@/components/governance/decision-console';
import { DataSourceConnector } from '@/components/dashboard/data-source-connector';

// Metric Card Component
function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  status
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const statusColors = {
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
    neutral: 'text-primary'
  };

  const statusBg = {
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    danger: 'bg-red-500/10',
    neutral: 'bg-primary/10'
  };

  return (
    <Card className="relative overflow-hidden group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className={`p-2 rounded-lg ${statusBg[status || 'neutral']} transition-colors`}>
          <Icon className={`h-4 w-4 ${statusColors[status || 'neutral']}`} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
          {trend && trendValue && (
            <span className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-emerald-500' :
              trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
              {trend === 'up' && <TrendingUp className="h-3 w-3 mr-0.5" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 mr-0.5" />}
              {trendValue}
            </span>
          )}
        </div>

        {/* Mini sparkline placeholder */}
        <div className="mt-3 h-8 flex items-end gap-0.5">
          {[40, 65, 50, 75, 60, 80, 70, 90, 85].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/20 rounded-sm transition-all group-hover:bg-primary/30"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Action Card
function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  variant = 'default'
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  variant?: 'default' | 'primary' | 'destructive';
}) {
  const variants = {
    default: 'border-border hover:border-primary/30 hover:bg-primary/5',
    primary: 'border-primary/30 bg-primary/5 hover:bg-primary/10',
    destructive: 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
  };

  return (
    <Link href={href}>
      <Card className={`h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${variants[variant]}`}>
        <CardContent className="p-5 flex flex-col gap-3">
          <div className={`p-2.5 rounded-lg w-fit ${variant === 'primary' ? 'bg-primary/20' :
            variant === 'destructive' ? 'bg-red-500/20' : 'bg-secondary'
            }`}>
            <Icon className={`h-5 w-5 ${variant === 'primary' ? 'text-primary' :
              variant === 'destructive' ? 'text-red-500' : 'text-muted-foreground'
              }`} />
          </div>
          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              {title}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { complianceScore, activeThreats, decisionQueue, systemStatus, addDecisionRequest } = useAstraStore();

  // Protocol Dialog State
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [protocolTitle, setProtocolTitle] = useState('');
  const [protocolDesc, setProtocolDesc] = useState('');

  // Decision Console State
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const pendingDecisions = decisionQueue.filter(d => d.status === 'PENDING');
  const statusColor = systemStatus === 'NOMINAL' ? 'text-emerald-500' : 'text-red-500';

  const handleDownloadReport = () => {
    generateExecutiveReport({
      date: new Date().toLocaleString(),
      complianceScore: complianceScore,
      activeRisks: 3,
      openIncidents: activeThreats,
      vendorRiskScore: 68,
      topRisks: [
        { title: "Supply Chain Attack via NPM", severity: "Critical" },
        { title: "Legacy VPN Vulnerabilities", severity: "High" },
        { title: "Shadow AI Usage", severity: "High" }
      ]
    });
  };

  const handleSubmitProtocol = () => {
    if (!protocolTitle || !protocolDesc) return;

    addDecisionRequest({
      title: protocolTitle,
      description: protocolDesc,
      requester: "Security Architect",
      riskLevel: "MEDIUM",
      timestamp: new Date().toISOString()
    });

    setProtocolTitle('');
    setProtocolDesc('');
    setIsProtocolOpen(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            System Status:
            <span className={`inline-flex items-center gap-1.5 font-mono font-semibold ${statusColor}`}>
              <span className={`h-2 w-2 rounded-full ${systemStatus === 'NOMINAL' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
              {systemStatus}
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          <DataSourceConnector />

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleDownloadReport}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export Report
          </Button>

          <Dialog open={isProtocolOpen} onOpenChange={setIsProtocolOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <Sparkles className="h-4 w-4 mr-2" />
                Initiate Protocol
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldQuestion className="h-5 w-5 text-primary" />
                  Security Consultation Request
                </DialogTitle>
                <DialogDescription>
                  Submit a proposed architecture, vendor, or access request for CISO governance review.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSubmitProtocol();
              }}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Protocol Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Deploy New Kubernetes Cluster"
                      value={protocolTitle}
                      onChange={(e) => setProtocolTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="desc">Technical Description</Label>
                    <Textarea
                      id="desc"
                      placeholder="Describe architectural changes, data flows, and involved assets..."
                      className="min-h-[100px]"
                      value={protocolDesc}
                      onChange={(e) => setProtocolDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Submit for Analysis
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Compliance Score"
          value={`${complianceScore}%`}
          icon={FileCheck}
          trend="up"
          trendValue="+2.3%"
          status="success"
        />
        <MetricCard
          label="Active Threats"
          value={activeThreats.toString()}
          icon={ShieldCheck}
          status={activeThreats > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          label="Pending Reviews"
          value={pendingDecisions.length.toString()}
          icon={Activity}
          status={pendingDecisions.length > 0 ? 'warning' : 'neutral'}
        />
        <MetricCard
          label="Risk Exposure"
          value="Low"
          icon={AlertTriangle}
          trend="down"
          trendValue="-5%"
          status="success"
        />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickActionCard
              title="War Games"
              description="Run tabletop exercises and AI simulations"
              icon={Terminal}
              href="/wargames"
              variant="primary"
            />
            <QuickActionCard
              title="Budget Planner"
              description="Analyze and optimize security spend"
              icon={DollarSign}
              href="/budget"
            />
            <QuickActionCard
              title="Policy Engine"
              description="Review and generate security policies"
              icon={FileCheck}
              href="/policies"
            />
            <QuickActionCard
              title="Risk Assessment"
              description="View governance and compliance status"
              icon={ShieldQuestion}
              href="/governance"
            />
          </div>
        </div>

        {/* Security Feed */}
        <div className="lg:col-span-1">
          <SecurityFeed />
        </div>

        {/* Pending Decisions */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Rapid Decisions</CardTitle>
              {pendingDecisions.length > 0 && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-600">
                  {pendingDecisions.length} pending
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingDecisions.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">All caught up. No pending decisions.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingDecisions.map((request) => (
                  <div
                    key={request.id}
                    onClick={() => setSelectedRequestId(request.id)}
                    className="p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-muted-foreground">{request.id}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${request.riskLevel === 'CRITICAL'
                        ? 'bg-red-500/10 text-red-600'
                        : request.riskLevel === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-blue-500/10 text-blue-600'
                        }`}>
                        {request.riskLevel}
                      </span>
                    </div>
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {request.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
                      <span>Requester: {request.requester}</span>
                      <span>•</span>
                      <span>{new Date(request.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DecisionConsole
        open={!!selectedRequestId}
        onOpenChange={(open) => !open && setSelectedRequestId(null)}
        requestId={selectedRequestId}
      />
    </div>
  );
}
