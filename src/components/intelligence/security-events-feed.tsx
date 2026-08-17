"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";

/** Astra is not a SIEM. Empty is honest. */
export function SecurityEventsFeed() {
    return (
        <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-primary" />
                    SECURITY EVENTS
                </CardTitle>
                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                    NO SIEM
                </Badge>
            </CardHeader>
            <CardContent className="p-6 text-xs text-muted-foreground">
                No event ingest. This feed stays empty until a real connector writes Observations.
            </CardContent>
        </Card>
    );
}
