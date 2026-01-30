import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { ComplianceBadge } from "@/components/ui/compliance-badge";
import { ComplianceStandard, RiskLevel } from "@/lib/store";

interface DecisionCardProps {
    id: string;
    title: string;
    description: string;
    requester: string;
    riskLevel: RiskLevel;
    standards: ComplianceStandard[];
    onApprove: () => void;
    onDeny: () => void;
}

export function DecisionCard({
    id,
    title,
    description,
    requester,
    riskLevel,
    standards,
    onApprove,
    onDeny
}: DecisionCardProps) {

    const riskColor = {
        CRITICAL: "text-red-500 bg-red-500/10 border-red-500/20",
        HIGH: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        MEDIUM: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        LOW: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    }[riskLevel];

    return (
        <Card className="border-l-4 border-l-primary bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">{id}</span>
                            <Badge variant="outline" className={`text-[10px] ${riskColor} border`}>
                                {riskLevel} RISK
                            </Badge>
                        </div>
                        <CardTitle className="text-lg leading-tight">{title}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground mb-4">{description}</p>

                <div className="flex flex-wrap gap-2 mb-3">
                    {standards.map(s => (
                        <ComplianceBadge key={s} standard={s} />
                    ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
                    <Info className="h-3 w-3" />
                    <span>Requested by: <span className="font-semibold text-foreground">{requester}</span></span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2 border-t border-border/50 bg-secondary/10">
                <Button variant="ghost" size="sm" onClick={onDeny} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <XCircle className="h-4 w-4 mr-1" />
                    Deny
                </Button>
                <Button size="sm" onClick={onApprove} className="bg-primary/90 hover:bg-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                </Button>
            </CardFooter>
        </Card>
    );
}
