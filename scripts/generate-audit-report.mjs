/**
 * Astra-CISO Platform Audit Report — DOCX Generator
 * Run: node scripts/generate-audit-report.mjs
 */
import {
    Document, Packer, Paragraph, Table, TableRow, TableCell,
    TextRun, HeadingLevel, AlignmentType, BorderStyle,
    WidthType, ShadingType, TableLayoutType, Header, Footer,
    PageNumber, NumberFormat
} from "docx";
import { resolve } from "path";
import { writeFileSync } from "fs";

// ─── Colour palette ────────────────────────────────────────────
const CLR = {
    keep: "2ECC71",
    merge: "F1C40F",
    remove: "E74C3C",
    header: "1A1A2E",
    accent: "6C5CE7",
    subtle: "636E72",
    white: "FFFFFF",
    bg: "F8F9FA",
    border: "DEE2E6",
};

const thin = { style: BorderStyle.SINGLE, size: 1, color: CLR.border };
const borders = { top: thin, bottom: thin, left: thin, right: thin };

// ─── Helpers ───────────────────────────────────────────────────
function heading(text, level = HeadingLevel.HEADING_1) {
    return new Paragraph({ heading: level, spacing: { before: 300, after: 120 }, children: [new TextRun({ text, bold: true, color: CLR.header })] });
}

function body(text, opts = {}) {
    return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, size: 21, color: opts.color || "333333", bold: opts.bold, italics: opts.italic })] });
}

function bullet(text, level = 0) {
    return new Paragraph({
        bullet: { level },
        spacing: { after: 40 },
        children: [new TextRun({ text, size: 21, color: "333333" })],
    });
}

function headerCell(text) {
    return new TableCell({
        shading: { type: ShadingType.SOLID, color: CLR.header },
        borders,
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: CLR.white })] })],
    });
}

function cell(text, shade) {
    return new TableCell({
        shading: shade ? { type: ShadingType.SOLID, color: shade } : undefined,
        borders,
        children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })],
    });
}

function verdictCell(v) {
    const map = { "🟢 KEEP": CLR.keep, "🟡 MERGE": CLR.merge, "🔴 REMOVE": CLR.remove };
    const color = map[v] || CLR.bg;
    return new TableCell({
        shading: { type: ShadingType.SOLID, color },
        borders,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v, bold: true, size: 20, color: CLR.white })] })],
    });
}

function spacer() {
    return new Paragraph({ spacing: { before: 100, after: 100 }, children: [] });
}

// ─── Route data ────────────────────────────────────────────────
const routes = [
    { r: "/", label: "Command Center", lines: 479, verdict: "🟢 KEEP", reason: "Core landing page. Dashboard with real GitHub data, metrics, quick actions. Every CISO opens this daily." },
    { r: "/executive-brief", label: "Executive Brief", lines: 289, verdict: "🟡 MERGE", reason: "Overlaps with Command Center — both show posture scores, risk summaries, and decision data. → Tab inside Command Center." },
    { r: "/strategy", label: "Strategy & OKRs", lines: 366, verdict: "🟢 KEEP", reason: "OKR management, KPI cross-reference. Core CISO planning tool." },
    { r: "/strategy/matrix", label: "Defense Matrix", lines: 355, verdict: "🟡 MERGE", reason: "Valuable threat-vs-safeguard matrix but has inline Zustand store with hardcoded threats. → Tab inside /strategy." },
    { r: "/kpis", label: "KPI Dashboard", lines: 244, verdict: "🟡 MERGE", reason: "KPI visualization with upload. Overlaps with /strategy which already uses the KPI engine. → Tab inside /strategy." },
    { r: "/projects", label: "Program Tracker", lines: 305, verdict: "🟡 MERGE", reason: "Project + OKR tracking. Overlaps with /strategy OKRs. → Tab inside /strategy." },
    { r: "/decisions", label: "Decision Center", lines: 132, verdict: "🟢 KEEP", reason: "AI decision queue with approve/defer. Unique workflow, well-built." },
    { r: "/risk", label: "Risk Register", lines: 333, verdict: "🟡 MERGE", reason: "FAIR assessment + risk register. Overlaps with /governance. → Tab inside /governance." },
    { r: "/governance", label: "Governance & Risk", lines: 142, verdict: "🟢 KEEP", reason: "Compliance controls, evidence vault, legal intelligence tabs. Well-structured." },
    { r: "/policies", label: "Policy Engine", lines: 317, verdict: "🟡 MERGE", reason: "Policy CRUD + templates. Closely related to Governance. → Tab inside /governance." },
    { r: "/incidents", label: "Incidents", lines: 177, verdict: "🟢 KEEP", reason: "Playbook management + incident timeline. Core IR tool." },
    { r: "/incidents/war-room", label: "War Room", lines: 363, verdict: "🟡 MERGE", reason: "Uses MOCK_INCIDENT hardcoded data. Half-built. → Tab inside /incidents once connected to real data." },
    { r: "/wargames", label: "Wargames", lines: 564, verdict: "🔴 REMOVE", reason: "75KB of hardcoded scenario data. Gamification, not weekly CISO tool. Not connected to real threat data." },
    { r: "/intelligence", label: "Threat Intelligence", lines: 693, verdict: "🟢 KEEP", reason: "AI threat briefing, strategic initiatives, framework mapping. Core value." },
    { r: "/intelligence/ransomware", label: "Ransomware Monitor", lines: 110, verdict: "🟢 KEEP", reason: "Real external API data. Compact and well-built." },
    { r: "/vendors", label: "Vendor Risk", lines: 404, verdict: "🟢 KEEP", reason: "Multi-tab vendor management (Registry, CAIQ, Knowledge). Core procurement tool." },
    { r: "/vendors/knowledge", label: "Knowledge Base", lines: 0, verdict: "🟡 MERGE", reason: "Already a tab in /vendors. Remove from sidebar — access via Vendor Risk tabs." },
    { r: "/tickets", label: "Tickets", lines: 436, verdict: "🟡 MERGE", reason: "Jira-style ticket creation. Essentially an action outbox. → Tab inside /decisions." },
    { r: "/budget", label: "Budget", lines: 177, verdict: "🔴 REMOVE", reason: "100% hardcoded mock data. Not connected to any store or API." },
    { r: "/reporting", label: "Reporting", lines: 498, verdict: "🟡 MERGE", reason: "Report generation + board deck. Overlaps with Executive Brief. → Tab inside Command Center." },
    { r: "/appsec", label: "AppSec Dashboard", lines: 349, verdict: "🟢 KEEP", reason: "SAST scanning, Trivy integration, code upload. Specialized." },
    { r: "/infrastructure", label: "Infrastructure", lines: 11, verdict: "🔴 REMOVE", reason: "Pure placeholder page — 'coming soon'. Zero functionality." },
    { r: "/privacy", label: "Privacy", lines: 11, verdict: "🔴 REMOVE", reason: "Pure placeholder page — 'GDPR/CCPA coming soon'. Zero functionality." },
    { r: "/admin/economics", label: "AI Economics", lines: 209, verdict: "🟡 MERGE", reason: "AI cost tracking. Niche admin tool. → Tab inside /settings." },
    { r: "/settings", label: "Settings", lines: 386, verdict: "🟢 KEEP", reason: "AI provider config, appearance, notifications. Essential." },
    { r: "/help", label: "Help Center", lines: 698, verdict: "🟢 KEEP", reason: "Comprehensive module docs with search. Useful for onboarding." },
];

// ─── Build the document ────────────────────────────────────────
const doc = new Document({
    styles: {
        default: {
            document: { run: { font: "Aptos", size: 22, color: "333333" } },
            heading1: { run: { font: "Aptos", size: 36, bold: true, color: CLR.header } },
            heading2: { run: { font: "Aptos", size: 28, bold: true, color: CLR.accent } },
            heading3: { run: { font: "Aptos", size: 24, bold: true, color: CLR.header } },
        },
    },
    sections: [
        {
            headers: {
                default: new Header({
                    children: [new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: "ASTRA-CISO — CONFIDENTIAL", size: 16, color: CLR.subtle, italics: true })],
                    })],
                }),
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: "Page ", size: 16, color: CLR.subtle }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: CLR.subtle }),
                        ],
                    })],
                }),
            },
            children: [
                // ── Title ──
                new Paragraph({ spacing: { before: 600, after: 100 }, children: [new TextRun({ text: "🔍", size: 52 })] }),
                new Paragraph({
                    spacing: { after: 40 },
                    children: [new TextRun({ text: "Astra-CISO Platform Audit Report", size: 48, bold: true, color: CLR.header, font: "Aptos" })],
                }),
                new Paragraph({
                    spacing: { after: 200 },
                    children: [new TextRun({ text: "Date: 2026-02-24  •  Codebase: 260 files · ~44,800 LOC", size: 22, color: CLR.subtle, italics: true })],
                }),
                body("This report evaluates every route and feature in the Astra-CISO platform against four criteria: weekly CISO usage, module overlap, implementation completeness, and whether it could be a tab inside another page."),
                spacer(),

                // ── Section 1: Route-by-Route ──
                heading("1. Route-by-Route Verdict", HeadingLevel.HEADING_1),
                body("Each route is categorised as KEEP (core value), MERGE (useful but should be a tab elsewhere), or REMOVE (low-value, mock data, or placeholder)."),
                spacer(),

                new Table({
                    layout: TableLayoutType.FIXED,
                    columnWidths: [1400, 2200, 600, 1200, 5200],
                    rows: [
                        new TableRow({ children: [headerCell("Route"), headerCell("Label"), headerCell("LOC"), headerCell("Verdict"), headerCell("Reasoning")] }),
                        ...routes.map(r =>
                            new TableRow({
                                children: [
                                    cell(r.r),
                                    cell(r.label),
                                    cell(String(r.lines)),
                                    verdictCell(r.verdict),
                                    cell(r.reason),
                                ],
                            })
                        ),
                    ],
                }),

                spacer(),

                // ── Section 2: Summary Counts ──
                heading("2. Summary Counts", HeadingLevel.HEADING_1),
                new Table({
                    columnWidths: [1600, 800, 8200],
                    rows: [
                        new TableRow({ children: [headerCell("Verdict"), headerCell("Count"), headerCell("Routes")] }),
                        new TableRow({ children: [verdictCell("🟢 KEEP"), cell("10"), cell("/, /strategy, /decisions, /governance, /incidents, /intelligence, /intelligence/ransomware, /vendors, /appsec, /settings, /help")] }),
                        new TableRow({ children: [verdictCell("🟡 MERGE"), cell("10"), cell("/executive-brief, /strategy/matrix, /kpis, /projects, /risk, /policies, /incidents/war-room, /vendors/knowledge, /tickets, /reporting, /admin/economics")] }),
                        new TableRow({ children: [verdictCell("🔴 REMOVE"), cell("4"), cell("/wargames, /budget, /infrastructure, /privacy")] }),
                    ],
                }),

                spacer(),

                // ── Section 3: REMOVE Justification ──
                heading("3. REMOVE — Detailed Justification", HeadingLevel.HEADING_1),

                heading("/wargames — Wargames", HeadingLevel.HEADING_3),
                bullet("Gamification / training simulator, not a weekly CISO tool."),
                bullet("wargames-data.ts is 74,984 bytes of hardcoded scenario scripts."),
                bullet("Has sub-routes /wargames/ai and /wargames/builder adding more complexity."),
                bullet("No connection to real threat data or the platform's risk posture."),
                bullet("Impact: Removes ~600+ lines of page code + 75KB data file + 2 sub-route pages."),
                spacer(),

                heading("/budget — Budget & Financials", HeadingLevel.HEADING_3),
                bullet("Entirely fake data. INVESTMENT_DATA, VELOCITY_DATA, and VENDOR_DATA are all hardcoded inline constants."),
                bullet("Not connected to any store, API, or real financial data."),
                bullet("Source code comment literally says '// Mock Data'."),
                bullet("Impact: Removes ~177 lines. Associated components may become orphaned."),
                spacer(),

                heading("/infrastructure — Infrastructure Security", HeadingLevel.HEADING_3),
                bullet("Literally just <PlaceholderPage> with 'coming soon'. 11 lines. Zero functionality."),
                spacer(),

                heading("/privacy — Privacy & Data Protection", HeadingLevel.HEADING_3),
                bullet("Identical to infrastructure — <PlaceholderPage> with 'GDPR/CCPA coming soon'. 11 lines."),
                spacer(),

                // ── Section 4: MERGE Targets ──
                heading("4. MERGE — Target Destinations", HeadingLevel.HEADING_1),
                new Table({
                    columnWidths: [2600, 3200, 4800],
                    rows: [
                        new TableRow({ children: [headerCell("Source Route"), headerCell("Merge Into"), headerCell("As")] }),
                        ...[
                            ["/executive-brief", "/ (Command Center)", "\"Executive Brief\" tab or export button"],
                            ["/strategy/matrix", "/strategy", "\"Defense Matrix\" tab"],
                            ["/kpis", "/strategy", "\"KPI Dashboard\" tab"],
                            ["/projects", "/strategy", "\"Program Tracker\" tab"],
                            ["/risk", "/governance", "\"Risk Register\" tab"],
                            ["/policies", "/governance", "\"Policy Engine\" tab"],
                            ["/incidents/war-room", "/incidents", "\"War Room\" tab"],
                            ["/vendors/knowledge", "/vendors", "Already a tab — remove sidebar entry"],
                            ["/tickets", "/decisions", "\"Action Queue\" tab"],
                            ["/reporting", "/ (Command Center)", "\"Reports & Board Deck\" tab"],
                            ["/admin/economics", "/settings", "\"AI Economics\" tab"],
                        ].map(row => new TableRow({ children: row.map(t => cell(t)) })),
                    ],
                }),

                spacer(),

                // ── Section 5: Dead Code ──
                heading("5. Dead Code Inventory", HeadingLevel.HEADING_1),

                heading("Orphaned Lib Files (zero imports)", HeadingLevel.HEADING_2),
                new Table({
                    columnWidths: [4400, 1200, 5000],
                    rows: [
                        new TableRow({ children: [headerCell("File"), headerCell("Size"), headerCell("Reason")] }),
                        new TableRow({ children: [cell("lib/threat-engine.ts"), cell("4.5KB"), cell("Zero imports anywhere in the codebase")] }),
                        new TableRow({ children: [cell("lib/config-scanner.ts"), cell("6.5KB"), cell("Zero imports anywhere")] }),
                        new TableRow({ children: [cell("lib/pii-scanner.ts"), cell("5.2KB"), cell("Zero imports anywhere")] }),
                    ],
                }),
                spacer(),

                heading("Orphaned Components (never rendered)", HeadingLevel.HEADING_2),
                new Table({
                    columnWidths: [5400, 5200],
                    rows: [
                        new TableRow({ children: [headerCell("Component"), headerCell("Reason")] }),
                        new TableRow({ children: [cell("components/secops/net-flow-table.tsx"), cell("Zero imports outside its directory")] }),
                        new TableRow({ children: [cell("components/secops/network-topology-map.tsx"), cell("Zero imports outside its directory")] }),
                        new TableRow({ children: [cell("components/security/audit-log-viewer.tsx"), cell("Zero imports outside its file")] }),
                        new TableRow({ children: [cell("components/nexus/nexus-graph.tsx"), cell("Only imported by compliance-weave.ts (circular orphan)")] }),
                    ],
                }),
                spacer(),

                heading("Duplicate Store Concerns", HeadingLevel.HEADING_2),
                bullet("vendor-store.ts (3.3KB) vs vendor-risk-store.ts (5.7KB) — both manage vendor entities"),
                bullet("stores/compliance-store.ts vs lib/governance.ts — both compute compliance scores"),
                bullet("lib/store.ts (17KB) is the main Astra store but many modules have split into their own stores"),
                spacer(),

                // ── Section 6: Proposed Sidebar ──
                heading("6. Proposed Sidebar Structure (11 items)", HeadingLevel.HEADING_1),
                body("Down from 20 sidebar items → 11 (including Settings, Help, Logout)", { bold: true }),
                spacer(),
                bullet("📊  Command Center  /  — includes Executive Brief & Reporting tabs"),
                bullet("⚡  Decision Center — includes Tickets tab"),
                bullet("🎯  Strategy & OKRs — includes KPIs, Projects, Defense Matrix tabs"),
                bullet("📜  Governance & Risk — includes Policies, Risk Register tabs"),
                bullet("🏢  Vendor Risk — includes CAIQ, Knowledge Base tabs"),
                bullet("🚨  Incidents — includes War Room tab"),
                bullet("🧠  Threat Intelligence — includes Ransomware sub-page"),
                bullet("🛡️  AppSec Dashboard"),
                bullet("────────────────────"),
                bullet("⚙️  Settings — includes AI Economics tab"),
                bullet("❓  Help Center"),
                bullet("🔓  Log Out"),
                spacer(),

                // ── Section 7: Estimated Reduction ──
                heading("7. Estimated Code Reduction", HeadingLevel.HEADING_1),
                new Table({
                    columnWidths: [5400, 5200],
                    rows: [
                        new TableRow({ children: [headerCell("Category"), headerCell("Lines Removed")] }),
                        new TableRow({ children: [cell("Deleted routes (pages)"), cell("~800")] }),
                        new TableRow({ children: [cell("Deleted lib files (incl. wargames-data)"), cell("~2,355")] }),
                        new TableRow({ children: [cell("Deleted components"), cell("~475")] }),
                        new TableRow({ children: [cell("Deleted stores"), cell("~70")] }),
                        new TableRow({ children: [cell("API routes (wargame, notebook)"), cell("~200")] }),
                        new TableRow({
                            children: [
                                new TableCell({ shading: { type: ShadingType.SOLID, color: CLR.accent }, borders, children: [new Paragraph({ children: [new TextRun({ text: "Total Estimated Deletion", bold: true, size: 20, color: CLR.white })] })] }),
                                new TableCell({ shading: { type: ShadingType.SOLID, color: CLR.accent }, borders, children: [new Paragraph({ children: [new TextRun({ text: "~3,900 lines (8.7%)", bold: true, size: 20, color: CLR.white })] })] }),
                            ],
                        }),
                    ],
                }),
                spacer(),
                body("Current total: ~44,800 lines. After merging & store deduplication, an additional ~5-10% reduction is achievable.", { italic: true, color: CLR.subtle }),
            ],
        },
    ],
});

// ─── Write ─────────────────────────────────────────────────────
const buf = await Packer.toBuffer(doc);
const outPath = resolve(process.cwd(), "Astra-CISO_Platform_Audit_Report.docx");
writeFileSync(outPath, buf);
console.log(`✅  Report written to ${outPath}`);
