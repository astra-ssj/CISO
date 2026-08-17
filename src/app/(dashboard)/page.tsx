"use client";

import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard, Presentation
} from 'lucide-react';
import { useVendorRiskStore } from '@/lib/vendor-risk-store';
import { usePolicyStore } from '@/lib/policy-store';
import { usePlaybookStore } from '@/lib/playbook-store';
import { useEvidenceStore } from '@/lib/evidence-store';
import { ExecutiveBriefTab } from '@/components/executive/executive-brief-tab';

// Command Center components
import { KPIStatusBar } from '@/components/command/KPIStatusBar';
import { ThreatMonitorWidget } from '@/components/command/ThreatMonitorWidget';
import { ActiveThreats } from '@/components/command/ActiveThreats';
import { PendingActions } from '@/components/command/PendingActions';
import { NeedsYou } from '@/components/command/NeedsYou';
import { RecentIncidents } from '@/components/command/RecentIncidents';
import { AIActivity } from '@/components/command/AIActivity';

function CommandCenterOverview() {
  const vendorRiskFetch = useVendorRiskStore(s => s.fetchVendors);
  const policyFetch = usePolicyStore(s => s.fetchPolicies);
  const playbookFetch = usePlaybookStore(s => s.fetchPlaybooks);
  const evidenceFetch = useEvidenceStore(s => s.fetchEvidence);

  useEffect(() => {
    vendorRiskFetch(); policyFetch(); playbookFetch(); evidenceFetch();
  }, [vendorRiskFetch, policyFetch, playbookFetch, evidenceFetch]);

  return (
    <div
      className="space-y-4 max-w-[1600px] mx-auto -mx-4 md:-mx-6 lg:-mx-8 -mb-4 md:-mb-6 lg:-mb-8 px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-2"
      style={{ background: '#050508', fontFamily: 'var(--font-dm-sans), sans-serif', minHeight: '100%' }}
    >
      {/* ═══ ROW 1: KPI STATUS BAR ═══ */}
      <KPIStatusBar />

      {/* ═══ ROW 2: MAIN CONTENT (2-column split) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* LEFT (60%): Global Threat Monitor */}
        <div className="lg:col-span-3">
          <ThreatMonitorWidget />
        </div>

        {/* RIGHT (40%): Active Threats + Pending Actions */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex-1 min-h-0">
            <ActiveThreats />
          </div>
          <div className="flex-1 min-h-0">
            <PendingActions />
          </div>
        </div>
      </div>

      {/* ═══ ROW 3: BOTTOM PANELS (3-column grid) ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NeedsYou />
        <RecentIncidents />
        <AIActivity />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-white">Command Center</h1>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,211,238,0.08)' }}>
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Supervised</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="executive" className="gap-2"><Presentation className="h-4 w-4" />Executive Brief</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><CommandCenterOverview /></TabsContent>
        <TabsContent value="executive"><ExecutiveBriefTab /></TabsContent>
      </Tabs>
    </div>
  );
}
