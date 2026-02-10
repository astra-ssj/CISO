"use client";

import { AlertTriangle, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
            <Card className="w-[500px] border-amber-500/20 bg-amber-500/5">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-amber-500/10 rounded-full w-fit">
                        <HardHat className="h-10 w-10 text-amber-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                    <CardDescription>
                        This module is currently under active development.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Our engineers are working hard to bring you the best security tools.
                        Check back soon for updates.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" onClick={() => window.history.back()}>
                            Go Back
                        </Button>
                        <Button>
                            Notify Me When Ready
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
