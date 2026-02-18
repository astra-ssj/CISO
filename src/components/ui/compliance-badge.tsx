import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ComplianceStandard } from "@/lib/store";

const standardConfig: Record<ComplianceStandard, { label: string; color: string }> = {
    ISO_27001: { label: 'ISO 27001', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    NIST_CSF: { label: 'NIST CSF', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    SOC2: { label: 'SOC 2', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    GDPR: { label: 'GDPR', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    EU_AI_ACT: { label: 'EU AI Act', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    NIS2: { label: 'NIS2', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' }
};

interface ComplianceBadgeProps {
    standard: ComplianceStandard;
    className?: string;
}

export function ComplianceBadge({ standard, className }: ComplianceBadgeProps) {
    const config = standardConfig[standard];

    return (
        <Badge variant="outline" className={cn("font-mono text-[10px] tracking-tight border", config.color, className)}>
            {config.label}
        </Badge>
    );
}
