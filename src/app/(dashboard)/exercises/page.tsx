import { supplyChainScenario } from "@/lib/exercises/scenarios/supply-chain";
import { insiderScenario } from "@/lib/exercises/scenarios/insider";
import { ransomwareScenario } from "@/lib/exercises/scenarios/ransomware";
import { getLastRunPerScenario } from "@/lib/exercises/actions";
import type { Scenario } from "@/lib/exercises/types";
import { Shield } from "lucide-react";
import Link from "next/link";
import { ScenarioLibraryClient } from "./scenario-library-client";

const scenarios: Scenario[] = [supplyChainScenario, insiderScenario, ransomwareScenario];

export default async function ExercisesPage() {
    const lastRuns = await getLastRunPerScenario();

    return (
        <div className="space-y-8 p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">Tabletop Exercises</h1>
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl">
                    Test your incident response capabilities with realistic cyber crisis scenarios.
                    Choose a scenario to begin.
                </p>
                <div className="pt-2">
                    <Link
                        href="/exercises/guide"
                        className="inline-flex items-center gap-2 text-xs font-mono text-sky-400/70 hover:text-sky-400 transition-colors"
                    >
                        📖 Exercise Guide — How it works, scenario walkthroughs, scoring explained
                    </Link>
                </div>
            </div>

            <ScenarioLibraryClient scenarios={scenarios} lastRuns={lastRuns} />
        </div>
    );
}


