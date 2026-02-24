"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Send,
  ShieldQuestion,
  Terminal,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Zap,
  BrainCircuit,
  BarChart3,
  FolderKanban,
  ClipboardCheck
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
import { DecisionConsole } from '@/components/governance/decision-console';
import { DataSourceConnector } from '@/components/dashboard/data-source-connector';
import { VulnerabilityFeed } from "@/components/dashboard/vulnerability-feed";
import { RemediationVelocity } from "@/components/dashboard/remediation-velocity";
import { BoardReportExport } from "@/components/reporting/board-export-btn";
import { TrafficFlow } from "@/components/visualizations/traffic-flow";
import { GitHubConnector, type GitHubStats } from "@/lib/connectors/github";
import { PostureGauge } from "@/components/dashboard/posture-gauge";
import { BoardDeckGenerator } from "@/components/reporting/board-deck-generator";
import { useDecisionStore } from '@/lib/decision-engine/router';
import { DecisionCard } from '@/components/decisions/decision-card';
import { useRiskRegisterStore } from '@/lib/risk-register-store';
import { useVendorRiskStore } from '@/lib/vendor-risk-store';
import { usePolicyStore } from '@/lib/policy-store';
import { usePlaybookStore } from '@/lib/playbook-store';
import { useEvidenceStore } from '@/lib/evidence-store';

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
  const v2Decisions = useDecisionStore(s => s.decisions);
  const v2Pending = useMemo(() => v2Decisions.filter(d => d.status === 'PENDING'), [v2Decisions]);

  const riskFetch = useRiskRegisterStore(s => s.fetchEntries);
  const vendorRiskFetch = useVendorRiskStore(s => s.fetchVendors);
  const policyFetch = usePolicyStore(s => s.fetchPolicies);
  const playbookFetch = usePlaybookStore(s => s.fetchPlaybooks);
  const evidenceFetch = useEvidenceStore(s => s.fetchEvidence);
  useEffect(() => {
    riskFetch();
    vendorRiskFetch();
    policyFetch();
    playbookFetch();
    evidenceFetch();
  }, [riskFetch, vendorRiskFetch, policyFetch, playbookFetch, evidenceFetch]);

  // Protocol Dialog State
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [protocolTitle, setProtocolTitle] = useState('');
  const [protocolDesc, setProtocolDesc] = useState('');

  // Decision Console State
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Real Data State
  interface TrafficData { nodes: { id: string; label: string; type: 'internet' | 'security' | 'app' | 'data'; x: number; y: number; status: 'active' | 'idle' | 'warning' }[]; paths: any[] }
  const [trafficData, setTrafficData] = useState<TrafficData | undefined>(undefined);
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null);

  // CAIQ metrics (from API)
  const [caiqMetrics, setCaiqMetrics] = useState<{
    lastAssessmentAt: string | null;
    coveragePercent: number;
    answersPendingReview: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/vendors/caiq/metrics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setCaiqMetrics(data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    // Simulate fetching real data from GitHub Connector
    const fetchData = async () => {
      const gh = new GitHubConnector();
      const stats = await gh.getStats();
      setGithubStats(stats);

      // Transform for traffic flow (simulated logic)
      // In reality, this would map repo traffic or API calls
      setTrafficData({
        nodes: [
          { id: 'internet', label: 'Public Internet', type: 'internet', x: 10, y: 50, status: 'active' },
          { id: 'waf', label: 'Cloudflare WAF', type: 'security', x: 30, y: 50, status: 'active' }, // Real brand name
          { id: 'lb', label: 'K8s Ingress', type: 'security', x: 45, y: 50, status: 'active' },
          { id: 'app-1', label: 'GraphQL Gateway', type: 'app', x: 65, y: 30, status: 'active' },
          { id: 'app-2', label: 'Auth Service', type: 'app', x: 65, y: 70, status: 'active' },
          { id: 'db-primary', label: 'Postgres Primary', type: 'data', x: 85, y: 30, status: 'active' },
          { id: 'db-cache', label: 'Redis Cluster', type: 'data', x: 85, y: 70, status: 'active' }
        ],
        paths: [
          { from: 'internet', to: 'waf', type: 'http' },
          { from: 'waf', to: 'lb', type: 'secure' },
          { from: 'lb', to: 'app-1', type: 'http' },
          { from: 'lb', to: 'app-2', type: 'secure' },
          { from: 'app-1', to: 'db-primary', type: 'sql' },
          { from: 'app-1', to: 'db-cache', type: 'sql' },
          { from: 'app-2', to: 'db-primary', type: 'sql' },
        ]
      });
    };
    fetchData();
  }, []);


  const pendingDecisions = decisionQueue.filter(d => d.status === 'PENDING');
  const statusColor = systemStatus === 'NOMINAL' ? 'text-emerald-500' : 'text-red-500';

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

          <BoardReportExport />

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
          value={githubStats ? String(githubStats.openAlerts) : activeThreats.toString()}
          icon={ShieldCheck}
          status={(githubStats?.openAlerts ?? activeThreats) > 0 ? 'danger' : 'success'}
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
        <MetricCard
          label="Last CAIQ Assessment"
          value={caiqMetrics?.lastAssessmentAt
            ? new Date(caiqMetrics.lastAssessmentAt).toLocaleDateString()
            : '—'}
          icon={ClipboardCheck}
          status="neutral"
        />
        <MetricCard
          label="CAIQ Coverage"
          value={caiqMetrics ? `${caiqMetrics.coveragePercent}%` : '—'}
          icon={FileCheck}
          status={caiqMetrics && caiqMetrics.coveragePercent >= 80 ? 'success' : caiqMetrics && caiqMetrics.coveragePercent > 0 ? 'warning' : 'neutral'}
        />
        <MetricCard
          label="Answers Pending Review"
          value={caiqMetrics ? caiqMetrics.answersPendingReview.toString() : '—'}
          icon={Activity}
          status={caiqMetrics && caiqMetrics.answersPendingReview > 0 ? 'warning' : 'neutral'}
        />
      </section>

      {/* Security Posture & Board Deck */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PostureGauge />
        </div>
        <BoardDeckGenerator />
      </section>

      {/* Live Telemetry & Traffic */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[350px]">
          <TrafficFlow data={trafficData} />
        </div>
        <div className="h-[350px]">
          <VulnerabilityFeed />
        </div>
      </section>

      {/* Remediation Velocity (Moved down) */}
      <section className="grid grid-cols-1">
        <RemediationVelocity />
      </section>

      {/* Rapid Decisions — powered by v2 Decision Engine */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold">Rapid Decisions</h2>
            {v2Pending.length > 0 && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">
                {v2Pending.length} awaiting
              </span>
            )}
          </div>
          <Link href="/decisions" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <BrainCircuit className="h-3 w-3" />
          </Link>
        </div>

        {v2Pending.length === 0 ? (
          <Card className="bg-card/30 border-border/30">
            <CardContent className="text-center py-8">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All caught up — no pending decisions.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {v2Pending.slice(0, 3).map(decision => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickActionCard title="War Games" description="Run tabletop exercises and AI simulations" icon={Terminal} href="/wargames" variant="primary" />
            <QuickActionCard title="KPI Dashboard" description="20 auto-computed security metrics" icon={BarChart3} href="/kpis" />
            <QuickActionCard title="Program Tracker" description="OKRs, projects, and budget tracking" icon={FolderKanban} href="/projects" />
            <QuickActionCard title="Risk Assessment" description="View governance and compliance status" icon={ShieldQuestion} href="/governance" />
          </div>
        </div>
        <div className="lg:col-span-1">
          <SecurityFeed />
        </div>
      </div>

      <DecisionConsole
        open={!!selectedRequestId}
        onOpenChange={(open) => !open && setSelectedRequestId(null)}
        requestId={selectedRequestId}
      />
    </div>
  );
}
