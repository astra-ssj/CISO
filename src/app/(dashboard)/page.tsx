"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ShieldCheck, AlertTriangle, FileCheck, Send, ShieldQuestion, FileDown, Terminal, DollarSign } from 'lucide-react';
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

export default function DashboardPage() {
  const { complianceScore, activeThreats, decisionQueue, systemStatus, addDecisionRequest } = useAstraStore();

  // Protocol Dialog State
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [protocolTitle, setProtocolTitle] = useState('');
  const [protocolDesc, setProtocolDesc] = useState('');

  // Decision Console State
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const pendingDecisions = decisionQueue.filter(d => d.status === 'PENDING');
  const statusColor = systemStatus === 'NOMINAL' ? 'text-emerald-400' : 'text-red-500';

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
      riskLevel: "MEDIUM", // Default risk for new protocols
      timestamp: new Date().toISOString()
    });

    // Reset and Close
    setProtocolTitle('');
    setProtocolDesc('');
    setIsProtocolOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome / Status Section */}
      <section className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Current Security Posture: <span className={`font-mono font-bold ${statusColor}`}>{systemStatus}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary"
            onClick={handleDownloadReport}
          >
            <FileDown className="h-4 w-4" />
            Download Report
          </Button>

          <Button
            variant="outline"
            className="border-primary/20 hover:bg-primary/10 hover:text-primary"
            onClick={() => alert("Audit Wizard Initiated. Scanned 452 assets. No critical anomalies found.")}
          >
            New Audit
          </Button>

          <Dialog open={isProtocolOpen} onOpenChange={setIsProtocolOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                Initiate Protocol
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] bg-card/95 backdrop-blur-xl border-primary/20 z-[60]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldQuestion className="h-5 w-5 text-primary" />
                  Security Consultation Request
                </DialogTitle>
                <DialogDescription>
                  Submit a proposed architecture, vendor, or access request for CISO governance review.
                  <br />
                  <span className="text-xs text-amber-500 mt-1 block font-semibold">
                    ⚠ ASTRA will enforce ISO 27001 & NIST CSF compliance on this request.
                  </span>
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
                      className="bg-secondary/50 border-input/50 focus-visible:ring-primary"
                      value={protocolTitle}
                      onChange={(e) => setProtocolTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="desc">Technical Description</Label>
                    <Textarea
                      id="desc"
                      placeholder="Describe architectural changes, data flows, and involved assets..."
                      className="bg-secondary/50 border-input/50 min-h-[100px] focus-visible:ring-primary"
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

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Compliance Score', value: `${complianceScore}%`, icon: FileCheck, color: 'text-emerald-400', sub: 'Calculated from active standards' },
          { label: 'Active Threats', value: activeThreats.toString(), icon: ShieldCheck, color: activeThreats > 0 ? 'text-red-500' : 'text-blue-400', sub: activeThreats === 0 ? 'System secure' : 'Action required' },
          { label: 'Pending Reviews', value: pendingDecisions.length.toString(), icon: Activity, color: pendingDecisions.length > 0 ? 'text-amber-400' : 'text-muted-foreground', sub: 'Requires CISO attention' },
          { label: 'Risk Exposure', value: 'Low', icon: AlertTriangle, color: 'text-indigo-400', sub: 'Within tolerance' },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/40 border-primary/10 backdrop-blur-sm relative overflow-hidden group hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategic Command Center Modules - Replaces Threat Map */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card/40 rounded-xl border border-dashed border-primary/20 p-8 flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
            <ShieldQuestion className="h-12 w-12 text-primary/40" />
            <div>
              <h3 className="text-xl font-bold text-foreground">Strategic Command Center</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                War Games, Budget Planning, and AI Intelligence modules are being initialized.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/wargames">
                <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
                  <Terminal className="mr-2 h-4 w-4" /> War Games
                </Button>
              </Link>
              <Link href="/budget">
                <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
                  <DollarSign className="mr-2 h-4 w-4" /> Budget Planner
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-1">
          <SecurityFeed />
        </div>

        <Card className="col-span-1 min-h-[400px] border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle>Rapid Decisions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingDecisions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10">All clean.</div>
            ) : (
              pendingDecisions.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequestId(request.id)}
                  className="p-3 rounded-md bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono text-primary group-hover:text-primary/80 transition-colors">{request.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${request.riskLevel === 'CRITICAL' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                      {request.riskLevel}
                    </span>
                  </div>
                  <div className="text-sm font-medium line-clamp-2 text-foreground/90">{request.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Req: {request.requester}
                  </div>
                </div>
              ))
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
