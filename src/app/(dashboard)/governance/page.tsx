import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activeControls, calculateComplianceScore } from "@/lib/governance";
import { ComplianceBadge } from "@/components/ui/compliance-badge";
import { CheckCircle, AlertCircle, XCircle, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ComplianceHeatmap } from "@/components/governance/compliance-heatmap";
import { AuditManager } from "@/components/governance/audit-manager";

export default function GovernancePage() {
    const score = calculateComplianceScore(activeControls);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Governance & Compliance</h1>
                <p className="text-muted-foreground">Manage frameworks (ISO 27001, NIST), policies, and audit artifacts.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Score Card */}
                <Card className="md:col-span-1 bg-card/30 border-primary/20 backdrop-blur-sm">
                    <CardHeader><CardTitle>Overall Compliance</CardTitle></CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-4 border-primary/20 bg-primary/5">
                            <span className="text-4xl font-bold text-primary">{score}%</span>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">Adjusted Score active across 4 frameworks</p>
                    </CardContent>
                </Card>

                {/* Audit Manager (Interactive) */}
                <div className="md:col-span-2">
                    <AuditManager />
                </div>
            </div>

            {/* Interactive Heatmap */}
            <ComplianceHeatmap />

            {/* Legacy Control List (Optional / Reference) */}

        </div>
    );
}
