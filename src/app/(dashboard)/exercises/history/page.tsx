import { getSessionHistory, getExercisePatterns } from "@/lib/exercises/actions";
import { formatDollars } from "@/lib/exercises/scoring";
import { Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type SessionWithScenario = Awaited<ReturnType<typeof getSessionHistory>>[number];

const gradeColors: Record<string, string> = {
    A: "text-emerald-400 bg-emerald-500/10",
    B: "text-blue-400 bg-blue-500/10",
    C: "text-amber-400 bg-amber-500/10",
    D: "text-orange-400 bg-orange-500/10",
    F: "text-red-400 bg-red-500/10",
};

export default async function ExerciseHistoryPage() {
    const sessions = await getSessionHistory();
    const insights = await getExercisePatterns();

    return (
        <div className="space-y-6 p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Exercise History</h1>
            </div>

            {insights && (
                <div className="bg-card/50 border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">📊</span>
                        <h2 className="text-[13px] font-bold text-foreground font-mono uppercase tracking-wider">Performance Insights</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground leading-relaxed">
                            <p>
                                <span className="text-foreground font-medium">{insights.totalSessions} exercises</span> completed ·
                                Avg grade: <span className="font-mono font-medium text-foreground">{insights.avgGrade}</span> ·
                                Avg impact: <span className="font-mono font-medium text-red-400">-{formatDollars(Math.abs(insights.avgDollars))}</span>
                            </p>
                            <p>
                                Internal rep avg: <span className="font-mono text-foreground">{insights.avgInternal}%</span> ·
                                External rep avg: <span className="font-mono text-foreground">{insights.avgExternal}%</span>
                            </p>
                        </div>

                        {insights.patterns.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-border/50">
                                {insights.patterns.map((pattern, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-muted-foreground">
                                        <span className="shrink-0 text-amber-500">💡</span>
                                        <span className="leading-relaxed">{pattern}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {sessions.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-sm text-muted-foreground">No completed exercises yet. Start one from the scenario library.</p>
                    <a href="/exercises" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                        Browse Scenarios
                    </a>
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session: SessionWithScenario) => (
                        <div key={session.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/30">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-sm text-foreground truncate">{session.scenario.title}</h3>
                                    <span className={cn(
                                        "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded",
                                        session.mode === "decision" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-400"
                                    )}>
                                        {session.mode}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded",
                                        session.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                                    )}>
                                        {session.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                                    <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                                    {session.mode === "decision" && (
                                        <>
                                            <span>|</span>
                                            <span className={session.totalDollars < 0 ? "text-red-400" : "text-emerald-400"}>
                                                {formatDollars(session.totalDollars)}
                                            </span>
                                            <span>|</span>
                                            <span>INT: {session.finalRepInternal}%</span>
                                            <span>EXT: {session.finalRepExternal}%</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {session.grade && (
                                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center font-bold font-mono text-lg", gradeColors[session.grade] ?? "")}>
                                    {session.grade}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
