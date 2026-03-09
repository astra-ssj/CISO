// =============================================================================
// Tabletop Exercise Module — Type Definitions
// =============================================================================

export type RoleId = "cfo" | "legal" | "vptech" | "auditor" | "impl";
export type Grade = "A" | "B" | "C" | "D" | "F";

// -----------------------------------------------------------------------------
// Scenario Definition
// -----------------------------------------------------------------------------

export interface ScenarioMeta {
    estimatedDuration: string;     // "~90 min"
    difficulty: "Standard" | "Advanced" | "Expert";
    commsExerciseCount: number;    // count steps where comms is defined
    injectEventCount: number;      // count steps where inject is defined
    themes: { icon: string; label: string }[];
}

export interface Scenario {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM";
    icon: string;
    color: string;
    briefing: string;
    stakes: {
        revenue: number;          // in millions
        customers: number;
        entities: number;
        auditIn: string;
    };
    startDollars: number;
    startRepInternal: number;   // 0-100
    startRepExternal: number;   // 0-100
    modes: ("decision" | "discussion")[];
    steps: Step[];
    meta?: ScenarioMeta;
}

// -----------------------------------------------------------------------------
// Steps & Step Content
// -----------------------------------------------------------------------------

export interface Step {
    id: number;
    time: string;
    title: string;
    situation: string;
    // Decision mode
    decisions?: Decision[];
    // Discussion mode
    questions?: RoleQuestion[];
    // Both modes
    inject?: InjectEvent | null;
    deadline?: Deadline[] | null;
    comms?: CommsExercise | null;
}

export interface Decision {
    id: string;                 // "a", "b", "c"
    label: string;
    role: RoleId;
    dollars: number;
    repInt: number;             // delta, can be negative
    repExt: number;             // delta, can be negative
    consequence: string;
    cascadeFlag?: string;       // for future branching
    isBlunder?: boolean;        // marks communication blunders
}

export interface RoleQuestion {
    role: RoleId;
    q: string;
    tension: string;
    hint?: string;
}

export interface InjectEvent {
    time: string;
    event: string;
    severity: "CRITICAL" | "HIGH" | "POSITIVE";
}

export interface CommsExercise {
    audience: string;
    template: string;
}

export interface Deadline {
    label: string;
    hoursRemaining: number;
    isOverdue: boolean;
}

// -----------------------------------------------------------------------------
// Roles
// -----------------------------------------------------------------------------

export interface Role {
    id: RoleId;
    name: string;
    icon: string;
    color: string;
    focus: string;
}

export const ROLES: Role[] = [
    { id: "cfo", name: "CFO", icon: "💰", color: "#fbbf24", focus: "Financial impact & board communication" },
    { id: "legal", name: "Legal Counsel", icon: "⚖️", color: "#a78bfa", focus: "Regulatory compliance & legal exposure" },
    { id: "vptech", name: "VP Technology", icon: "🔧", color: "#38bdf8", focus: "Technical containment & remediation" },
    { id: "auditor", name: "ISO Auditor", icon: "📋", color: "#10b981", focus: "ISMS conformity & evidence collection" },
    { id: "impl", name: "Implementer", icon: "🛠️", color: "#fb923c", focus: "Operational execution & team coordination" },
];

export function getRoleById(id: RoleId): Role {
    return ROLES.find(r => r.id === id) ?? ROLES[0];
}

// -----------------------------------------------------------------------------
// Session State (client-side)
// -----------------------------------------------------------------------------

export interface SessionState {
    sessionId: string;
    scenarioSlug: string;
    mode: "decision" | "discussion";
    currentStep: number;
    dollars: number;
    repInternal: number;
    repExternal: number;
    decisions: Record<number, { choiceId: string; confidence: "low" | "medium" | "high" }>;   // stepId -> { choiceId, confidence }
    responses: Record<string, string>;   // "stepId-roleId" -> text
    commsDrafts: Record<string, string>; // "stepId-comms" -> draft text
    history: DecisionRecord[];
}

export interface DecisionRecord {
    stepId: number;
    time: string;
    title: string;
    choiceId: string;
    choiceLabel: string;
    role: RoleId;
    dollars: number;
    repInt: number;
    repExt: number;
    consequence: string;
    confidence: "low" | "medium" | "high";
}

// -----------------------------------------------------------------------------
// Final Assessment
// -----------------------------------------------------------------------------

export interface FinalAssessment {
    grade: Grade;
    totalDollars: number;
    finalRepInternal: number;
    finalRepExternal: number;
    history: DecisionRecord[];
    strengths: string[];
    failures: string[];
    recommendations: string[];
}
