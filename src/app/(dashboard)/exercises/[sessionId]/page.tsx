import { getSession } from "@/lib/exercises/actions";
import { ExerciseEngine } from "@/components/exercises/ExerciseEngine";
import { supplyChainScenario } from "@/lib/exercises/scenarios/supply-chain";
import { insiderScenario } from "@/lib/exercises/scenarios/insider";
import { ransomwareScenario } from "@/lib/exercises/scenarios/ransomware";
import { redirect } from "next/navigation";
import type { Scenario } from "@/lib/exercises/types";

const scenarioMap: Record<string, Scenario> = {
    "supply-chain": supplyChainScenario,
    "insider": insiderScenario,
    "ransomware": ransomwareScenario,
};

interface PageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function ExerciseSessionPage({ params }: PageProps) {
    const { sessionId } = await params;
    const session = await getSession(sessionId);

    if (!session) redirect("/exercises");
    if (session.status === "completed") redirect("/exercises");

    const scenario = scenarioMap[session.scenario.slug];
    if (!scenario) redirect("/exercises");

    return (
        <ExerciseEngine
            scenario={scenario}
            sessionId={session.id}
            mode={session.mode as "decision" | "discussion"}
        />
    );
}
