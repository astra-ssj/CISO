import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PlaceholderPageProps {
    title: string;
    description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="p-4 rounded-full bg-secondary/50">
                <Construction className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2 max-w-md">
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
            </div>
            <Link href="/">
                <Button variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Return to Command Center
                </Button>
            </Link>
        </div>
    );
}
