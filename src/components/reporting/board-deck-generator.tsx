"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileBarChart, Download, Loader2, CheckCircle } from 'lucide-react';
import { useRiskRegisterStore } from '@/lib/risk-register-store';
import { useVendorRiskStore } from '@/lib/vendor-risk-store';
import { useEvidenceStore } from '@/lib/evidence-store';
import { usePolicyStore } from '@/lib/policy-store';
import { usePlaybookStore } from '@/lib/playbook-store';
import { calculateComplianceScore, getDynamicControls } from '@/lib/governance';

export function BoardDeckGenerator() {
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);

    const { policies } = usePolicyStore();
    const { playbooks } = usePlaybookStore();
    const riskStore = useRiskRegisterStore();
    const vendorStore = useVendorRiskStore();
    const evidenceStore = useEvidenceStore();

    const handleGenerate = async () => {
        setGenerating(true);
        setGenerated(false);

        // Gather all data
        const controls = getDynamicControls(policies, playbooks);
        const complianceScore = calculateComplianceScore(controls);
        const topRisks = riskStore.getTopRisks(5);
        const vendors = vendorStore.vendors;
        const evidenceStats = evidenceStore.getCoverageStats();
        const resolvedIncidents = playbooks.filter(p => p.status === 'RESOLVED').length;

        // Use dynamic import for jspdf to avoid SSR issues
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'landscape' });

        // ─── Slide 1: Title ───
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 297, 210, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(32);
        doc.text('CISO Board Report', 148.5, 70, { align: 'center' });
        doc.setFontSize(14);
        doc.setTextColor(148, 163, 184);
        doc.text('Quarterly Security Posture Review', 148.5, 85, { align: 'center' });
        doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 148.5, 95, { align: 'center' });
        doc.setFontSize(10);
        doc.text('CONFIDENTIAL — Board of Directors Only', 148.5, 115, { align: 'center' });

        // ─── Slide 2: Executive Summary ───
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 297, 210, 'F');
        doc.setTextColor(56, 189, 248); // sky-400
        doc.setFontSize(20);
        doc.text('Executive Summary', 20, 25);
        doc.setDrawColor(56, 189, 248);
        doc.line(20, 30, 277, 30);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        const metrics = [
            [`Compliance Score: ${complianceScore}%`, `Active Controls: ${controls.length}`],
            [`Open Risks: ${riskStore.entries.filter(e => e.status !== 'CLOSED').length}`, `Average Risk Score: ${riskStore.getAverageScore()}`],
            [`Total Vendors: ${vendors.length}`, `High/Critical Risk Vendors: ${vendorStore.getCriticalVendorCount()}`],
            [`Active Incidents: ${playbooks.length - resolvedIncidents}`, `Resolved This Period: ${resolvedIncidents}`],
            [`Evidence Items: ${evidenceStats.total}`, `Verified: ${evidenceStats.verified}`],
        ];

        metrics.forEach(([left, right], i) => {
            const y = 45 + (i * 22);
            doc.setFillColor(30, 41, 59);
            doc.roundedRect(20, y, 125, 18, 3, 3, 'F');
            doc.roundedRect(152, y, 125, 18, 3, 3, 'F');
            doc.setFontSize(11);
            doc.text(left, 30, y + 12);
            doc.text(right, 162, y + 12);
        });

        // ─── Slide 3: Top 5 Risks ───
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 297, 210, 'F');
        doc.setTextColor(251, 146, 60); // orange-400
        doc.setFontSize(20);
        doc.text('Top 5 Risk Scenarios (FAIR)', 20, 25);
        doc.setDrawColor(251, 146, 60);
        doc.line(20, 30, 277, 30);

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        doc.text(['SCENARIO', 'SCORE', 'ALE', 'STATUS', 'OWNER'], 20, 42);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        topRisks.forEach((risk, i) => {
            const y = 52 + (i * 18);
            doc.setFillColor(i % 2 === 0 ? 30 : 24, i % 2 === 0 ? 41 : 33, i % 2 === 0 ? 59 : 48);
            doc.roundedRect(20, y, 257, 15, 2, 2, 'F');
            doc.text(risk.scenario.assetName.substring(0, 35), 24, y + 10);
            doc.text(`${risk.analysis.riskScore}`, 145, y + 10);
            doc.text(`$${(risk.analysis.annualizedLossExpectancy / 1000).toFixed(0)}K`, 170, y + 10);
            doc.text(risk.status, 210, y + 10);
            doc.text(risk.owner, 245, y + 10);
        });

        // ─── Slide 4: Vendor Risk ───
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 297, 210, 'F');
        doc.setTextColor(168, 85, 247); // purple-400
        doc.setFontSize(20);
        doc.text('Vendor Risk Overview', 20, 25);
        doc.setDrawColor(168, 85, 247);
        doc.line(20, 30, 277, 30);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        vendors.forEach((vendor, i) => {
            const y = 42 + (i * 16);
            if (y > 180) return;
            doc.setFillColor(30, 41, 59);
            doc.roundedRect(20, y, 257, 13, 2, 2, 'F');
            doc.text(vendor.name, 24, y + 9);
            doc.text(`Risk: ${vendor.riskScore}`, 140, y + 9);
            doc.text(vendor.riskTier, 185, y + 9);
            doc.text(vendor.status.replace('_', ' '), 220, y + 9);
        });

        // ─── Slide 5: Recommendations ───
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 297, 210, 'F');
        doc.setTextColor(52, 211, 153); // emerald-400
        doc.setFontSize(20);
        doc.text('Strategic Recommendations', 20, 25);
        doc.setDrawColor(52, 211, 153);
        doc.line(20, 30, 277, 30);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        const recommendations = [
            '1. Complete vendor risk assessments for all HIGH/CRITICAL tier vendors',
            '2. Expand compliance controls coverage — target 90% across NIST CSF 2.0',
            '3. Reduce Mean Time to Resolve (MTTR) for incidents to under 4 hours',
            '4. Implement automated evidence collection for SOC 2 Type II readiness',
            '5. Deploy continuous monitoring for cloud infrastructure configurations',
        ];
        recommendations.forEach((rec, i) => {
            doc.text(rec, 24, 45 + (i * 18));
        });

        // Save
        doc.save(`CISO-Board-Report-${new Date().toISOString().split('T')[0]}.pdf`);

        setGenerating(false);
        setGenerated(true);

        setTimeout(() => setGenerated(false), 3000);
    };

    return (
        <Card className="bg-card/30 border-primary/20 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <FileBarChart className="h-4 w-4 text-primary" />
                    Board Deck Generator
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                    Generate a comprehensive 5-slide PDF board report with live data from all modules:
                    posture, compliance, risk register, vendor risk, and recommendations.
                </p>
                <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2">
                    {generating ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                    ) : generated ? (
                        <><CheckCircle className="h-4 w-4" /> Downloaded!</>
                    ) : (
                        <><Download className="h-4 w-4" /> Generate Board Deck</>
                    )}
                </Button>
                <div className="flex gap-2 mt-2">
                    {['Summary', 'Risks', 'Vendors', 'Actions'].map(s => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
