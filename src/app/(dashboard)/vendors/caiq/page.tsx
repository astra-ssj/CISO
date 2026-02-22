"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  Shield,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  ExternalLink,
  Zap,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useCAIQReviewStore } from "@/stores/caiq-review-store";
import type { CAIQAnswer, CAIQStats, OrganizationContext } from "@/lib/caiq/types";
import type { CAIQReviewItem } from "@/stores/caiq-review-store";
import { CAIQ_DOMAINS } from "@/lib/caiq/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = "upload" | "config" | "processing" | "results";

interface ParseResult {
  questionCount: number;
  domainBreakdown: Record<string, { count: number; name: string }>;
  sheets: { name: string; questionCount: number }[];
  fileName: string;
}

interface ProgressState {
  current: number;
  total: number;
  exactMatch: number;
  semanticMatch: number;
  aiGenerated: number;
  flagged: number;
  circuitState?: string;
  circuitProvider?: string;
}

interface AssessResult {
  answers: CAIQAnswer[];
  stats: CAIQStats;
  validationResults: { questionId: string; needsReview: boolean }[];
  questionSummaries: { id: string; text: string; domain: string }[];
}

const DOMAIN_ORDER = [...CAIQ_DOMAINS];
const TIER_COLORS = {
  EXACT_MATCH: "#22c55e",
  SEMANTIC_MATCH: "#3b82f6",
  AI_GENERATED: "#a855f7",
  FLAGGED: "#f59e0b",
};

// ─────────────────────────────────────────────────────────────────────────────
// Audit PDF generator (client-side)
// ─────────────────────────────────────────────────────────────────────────────

async function downloadAuditReportPdf(
  answers: CAIQAnswer[],
  questionSummaries: { id: string; text: string; domain: string }[]
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CAIQ Assessment Audit Report", 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toISOString()}`, 40, 55);
  doc.text(`Total answers: ${answers.length}`, 40, 68);

  const map = new Map(questionSummaries.map((q) => [q.id, q]));
  const rows = answers.map((a) => {
    const q = map.get(a.questionId);
    return [
      a.questionId,
      (q?.domain ?? "").slice(0, 8),
      (q?.text ?? "").slice(0, 50) + (q?.text && q.text.length > 50 ? "…" : ""),
      a.tier,
      String(Math.round(a.confidence * 100)),
      a.generatedBy,
      a.generatedAt?.slice(0, 19) ?? "",
      a.answer?.slice(0, 60) + (a.answer && a.answer.length > 60 ? "…" : ""),
    ];
  });

  autoTable(doc, {
    startY: 85,
    head: [["Question ID", "Domain", "Question", "Tier", "Conf%", "Source", "Generated", "Answer"]],
    body: rows,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 20, right: 20 },
    tableWidth: "auto",
  });

  doc.save(`CAIQ_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CAIQAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [orgContext, setOrgContext] = useState<OrganizationContext | null>(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [configOverrides, setConfigOverrides] = useState<Partial<OrganizationContext>>({});
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(0.9);
  const [flagThreshold, setFlagThreshold] = useState(0.6);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [assessError, setAssessError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setReviewItems = useCAIQReviewStore((s) => s.setItems);
  const setReviewStats = useCAIQReviewStore((s) => s.setStats);

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setParseError(null);
    setParseResult(null);
    setParseLoading(true);
    const form = new FormData();
    form.append("file", f);
    fetch("/api/vendors/caiq/parse", { method: "POST", body: form })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setParseResult(data);
      })
      .catch((err) => setParseError(err instanceof Error ? err.message : "Parse failed"))
      .finally(() => setParseLoading(false));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f && (f.name.toLowerCase().endsWith(".xlsx") || f.name.toLowerCase().endsWith(".xls"))) {
        handleFileSelect(f);
      }
    },
    [handleFileSelect]
  );

  const handleStartAssessment = useCallback(() => {
    if (!file || !parseResult) return;
    setStep("config");
  }, [file, parseResult]);

  const fetchOrgContext = useCallback(async () => {
    setOrgLoading(true);
    try {
      const res = await fetch("/api/vendors/caiq/org-context");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load org context");
      setOrgContext(data);
      setConfigOverrides({
        industry: data.industry,
        cloudModel: data.cloudModel,
        jurisdictions: data.jurisdictions,
        frameworks: data.frameworks,
      });
    } catch {
      setOrgContext({
        name: "Organization",
        industry: "Technology",
        cloudModel: "Hybrid",
        jurisdictions: [],
        frameworks: ["ISO 27001:2022", "NIST CSF 2.0"],
        size: "SMB",
      });
    } finally {
      setOrgLoading(false);
    }
  }, []);

  const runAssessment = useCallback(async () => {
    if (!file) return;
    setStep("processing");
    setProgress({ current: 0, total: parseResult?.questionCount ?? 0, exactMatch: 0, semanticMatch: 0, aiGenerated: 0, flagged: 0 });
    setAssessError(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("autoApproveThreshold", String(autoApproveThreshold));
    form.append("flagThreshold", String(flagThreshold));
    form.append("orgContext", JSON.stringify(configOverrides));

    try {
      const res = await fetch(`/api/vendors/caiq/assess?stream=true`, {
        method: "POST",
        body: form,
        headers: { Accept: "text/event-stream" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Assessment failed: ${res.status}`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const dec = new TextDecoder();
      let buffer = "";
      let gotResult = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const block of chunks) {
          const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          const dataStr = dataLine.slice(6).trim();
          try {
            const data = JSON.parse(dataStr) as Record<string, unknown>;
            if (data.current != null && data.total != null) {
              setProgress((p) => ({
                ...(p ?? { current: 0, total: 1, exactMatch: 0, semanticMatch: 0, aiGenerated: 0, flagged: 0 }),
                current: data.current as number,
                total: data.total as number,
                exactMatch: (data.exactMatch as number) ?? p?.exactMatch ?? 0,
                semanticMatch: (data.semanticMatch as number) ?? p?.semanticMatch ?? 0,
                aiGenerated: (data.aiGenerated as number) ?? p?.aiGenerated ?? 0,
                flagged: (data.flagged as number) ?? p?.flagged ?? 0,
              }));
            } else if (Array.isArray(data) && data.length > 0 && (data[0] as { provider?: string }).provider != null) {
              const first = data[0] as { provider: string; state: string };
              setProgress((p) => ({ ...(p ?? {} as ProgressState), circuitProvider: first.provider, circuitState: first.state }));
            } else if (data.provider != null) {
              setProgress((p) => ({ ...(p ?? {} as ProgressState), circuitProvider: data.provider as string, circuitState: data.state as string }));
            } else if (data.answers && data.stats) {
              gotResult = true;
              setResult({
                answers: data.answers as CAIQAnswer[],
                stats: data.stats as CAIQStats,
                validationResults: (data.validationResults as AssessResult["validationResults"]) ?? [],
                questionSummaries: (data.questionSummaries as AssessResult["questionSummaries"]) ?? [],
              });
              setStep("results");
            } else if (data.error != null) {
              setAssessError(String(data.error));
            }
          } catch {
            // ignore parse errors for non-JSON lines
          }
        }
      }
      if (!gotResult && !assessError) {
        setAssessError("No result received from stream.");
      }
    } catch (err) {
      setAssessError(err instanceof Error ? err.message : String(err));
      setStep("config");
    }
  }, [file, parseResult?.questionCount, autoApproveThreshold, flagThreshold, configOverrides, assessError]);

  const goToReview = useCallback(() => {
    if (!result) return;
    const map = new Map(result.questionSummaries.map((q) => [q.id, q]));
    const items: CAIQReviewItem[] = result.answers.map((a) => {
      const q = map.get(a.questionId);
      return {
        ...a,
        questionText: q?.text ?? "",
        domain: (q?.domain ?? a.questionId.split("-")[0]) as import("@/lib/caiq/types").CAIQDomain,
        reviewStatus: "Pending" as const,
        originalAnswer: a.answer,
      };
    });
    setReviewItems(items);
    setReviewStats({
      total: result.stats.total,
      estimatedAccuracy: result.stats.estimatedAccuracy,
      flagged: result.stats.flagged,
      pending: items.filter((i) => i.reviewStatus === "Pending").length,
      approved: 0,
    });
    router.push("/vendors/caiq-review");
  }, [result, router, setReviewItems, setReviewStats]);

  const exportExcel = useCallback(async () => {
    if (!file || !result) return;
    const form = new FormData();
    form.append("file", file);
    form.append("answers", JSON.stringify(result.answers));
    const res = await fetch("/api/vendors/caiq/export", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Export failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file.name.replace(/\.xlsx?$/i, "") || "CAIQ") + "_Answered.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }, [file, result]);

  const downloadAuditPdf = useCallback(() => {
    if (!result) return;
    downloadAuditReportPdf(result.answers, result.questionSummaries);
  }, [result]);

  if (step === "config" && !orgContext && !orgLoading) {
    fetchOrgContext();
  }

  const tierPieData = result?.answers
    ? (() => {
        const counts = { EXACT_MATCH: 0, SEMANTIC_MATCH: 0, AI_GENERATED: 0, FLAGGED: 0 };
        for (const a of result.answers) counts[a.tier] = (counts[a.tier] ?? 0) + 1;
        return [
          { name: "Exact match", value: counts.EXACT_MATCH, color: TIER_COLORS.EXACT_MATCH },
          { name: "Semantic match", value: counts.SEMANTIC_MATCH, color: TIER_COLORS.SEMANTIC_MATCH },
          { name: "AI generated", value: counts.AI_GENERATED, color: TIER_COLORS.AI_GENERATED },
          { name: "Flagged", value: counts.FLAGGED, color: TIER_COLORS.FLAGGED },
        ].filter((d) => d.value > 0);
      })()
    : [];

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-zinc-900/60 to-indigo-950/40 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Shield className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">CAIQ Tiered Assessment</h1>
            <p className="text-sm text-zinc-400">Upload a CAIQ v4 Excel file and run the 4-tier answer engine</p>
          </div>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card className="bg-card/30 border-zinc-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-violet-400" />
              Upload CAIQ v4 Excel
            </CardTitle>
            <p className="text-sm text-zinc-500">Drag & drop or select a CAIQ v4 questionnaire (.xlsx)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging ? "border-violet-400 bg-violet-500/5" : file ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-700/50 hover:border-zinc-600"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              {file ? (
                <>
                  <FileSpreadsheet className="h-10 w-10 mx-auto text-emerald-400 mb-2" />
                  <p className="font-medium text-emerald-400">{file.name}</p>
                  <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-zinc-500 mb-2" />
                  <p className="text-zinc-400">Click or drag & drop CAIQ v4 Excel</p>
                </>
              )}
            </div>
            {parseResult && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                <p className="text-sm font-medium text-white">
                  Parsed: <span className="text-violet-400">{parseResult.questionCount}</span> questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(parseResult.domainBreakdown).map(([code, d]) => (
                    <span key={code} className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300">
                      {code}: {d.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={handleStartAssessment} disabled={!file || !parseResult || parseLoading} className="w-full gap-2 bg-violet-600 hover:bg-violet-500">
              {parseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Start Assessment
            </Button>
            {parseError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{parseError}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configuration */}
      {step === "config" && (
        <Card className="bg-card/30 border-zinc-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-indigo-400" />
              Configuration
            </CardTitle>
            <p className="text-sm text-zinc-500">Organization context and confidence thresholds</p>
            {parseResult && (
              <p className="text-xs text-zinc-400 mt-1">
                Assessment will run on <span className="text-violet-400 font-medium">{parseResult.questionCount}</span> questions
                {Object.keys(parseResult.domainBreakdown).length > 0 && ` across ${Object.keys(parseResult.domainBreakdown).length} domains`}.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {orgContext && (
              <div className="rounded-lg border border-zinc-800 p-4 space-y-2">
                <p className="text-xs font-medium text-zinc-400">Organization context (override below)</p>
                <p className="text-sm text-white">Name: {orgContext.name} · Industry: {orgContext.industry} · Cloud: {orgContext.cloudModel}</p>
                <p className="text-xs text-zinc-500">Jurisdictions: {orgContext.jurisdictions?.join(", ") || "—"} · Frameworks: {orgContext.frameworks?.slice(0, 3).join(", ")}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Industry</Label>
                <Input
                  value={(configOverrides.industry as string) ?? ""}
                  onChange={(e) => setConfigOverrides((o) => ({ ...o, industry: e.target.value }))}
                  placeholder="e.g. Technology"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Cloud model</Label>
                <Select
                  value={(configOverrides.cloudModel as string) ?? "Hybrid"}
                  onValueChange={(v) => setConfigOverrides((o) => ({ ...o, cloudModel: v as OrganizationContext["cloudModel"] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IaaS">IaaS</SelectItem>
                    <SelectItem value="PaaS">PaaS</SelectItem>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Jurisdictions (comma-separated)</Label>
              <Input
                value={Array.isArray(configOverrides.jurisdictions) ? configOverrides.jurisdictions.join(", ") : ""}
                onChange={(e) => setConfigOverrides((o) => ({ ...o, jurisdictions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
                placeholder="e.g. EU, US"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Frameworks (comma-separated)</Label>
              <Input
                value={Array.isArray(configOverrides.frameworks) ? configOverrides.frameworks.join(", ") : ""}
                onChange={(e) => setConfigOverrides((o) => ({ ...o, frameworks: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
                placeholder="e.g. ISO 27001:2022, NIST CSF 2.0"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Auto-approve threshold (0–1)</Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={autoApproveThreshold}
                  onChange={(e) => setAutoApproveThreshold(parseFloat(e.target.value) || 0.9)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Flag threshold (0–1)</Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={flagThreshold}
                  onChange={(e) => setFlagThreshold(parseFloat(e.target.value) || 0.6)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={runAssessment} className="gap-2 bg-violet-600 hover:bg-violet-500">
                <Zap className="h-4 w-4" />
                Run CAIQ Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Processing */}
      {step === "processing" && (
        <Card className="bg-card/30 border-zinc-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
              Processing
            </CardTitle>
            <p className="text-sm text-zinc-500">Real-time progress from the tiered engine</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {progress && (
              <>
                <p className="text-lg font-medium text-white">
                  Processing question {progress.current} / {progress.total}
                </p>
                <Progress value={progress.total ? (progress.current / progress.total) * 100 : 0} className="h-3" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{progress.exactMatch}</p>
                    <p className="text-xs text-zinc-500">Exact matches</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-2xl font-bold text-blue-400">{progress.semanticMatch}</p>
                    <p className="text-xs text-zinc-500">Semantic matches</p>
                  </div>
                  <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-center">
                    <p className="text-2xl font-bold text-violet-400">{progress.aiGenerated}</p>
                    <p className="text-xs text-zinc-500">AI generated</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-2xl font-bold text-amber-400">{progress.flagged}</p>
                    <p className="text-xs text-zinc-500">Flagged</p>
                  </div>
                </div>
                {progress.circuitProvider != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-500">Circuit breaker:</span>
                    <span className={progress.circuitState === "open" ? "text-amber-400" : "text-emerald-400"}>
                      {progress.circuitProvider} — {progress.circuitState ?? "closed"}
                    </span>
                  </div>
                )}
              </>
            )}
            {assessError && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {assessError}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === "results" && result && (
        <div className="space-y-6">
          <Card className="bg-card/30 border-zinc-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-lg border border-zinc-800 text-center">
                  <p className="text-2xl font-bold text-white">{Math.round((result.stats.estimatedAccuracy ?? 0) * 100)}%</p>
                  <p className="text-xs text-zinc-500">Estimated accuracy</p>
                </div>
                <div className="p-4 rounded-lg border border-emerald-500/20 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{result.stats.highConfidence}</p>
                  <p className="text-xs text-zinc-500">Exact match</p>
                </div>
                <div className="p-4 rounded-lg border border-blue-500/20 text-center">
                  <p className="text-2xl font-bold text-blue-400">{result.stats.mediumConfidence}</p>
                  <p className="text-xs text-zinc-500">Semantic</p>
                </div>
                <div className="p-4 rounded-lg border border-violet-500/20 text-center">
                  <p className="text-2xl font-bold text-violet-400">{result.stats.lowConfidence}</p>
                  <p className="text-xs text-zinc-500">AI generated</p>
                </div>
                <div className="p-4 rounded-lg border border-amber-500/20 text-center">
                  <p className="text-2xl font-bold text-amber-400">{result.stats.flagged}</p>
                  <p className="text-xs text-zinc-500">Flagged</p>
                </div>
              </div>

              {tierPieData.length > 0 && (
                <div className="h-64">
                  <p className="text-sm font-medium text-zinc-400 mb-2">Tier breakdown</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={tierPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name}: ${e.value}`}>
                        {tierPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-zinc-400 mb-2">Domain coverage</p>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {DOMAIN_ORDER.map((d) => {
                    const cov = result.stats.coverageByDomain?.[d as keyof typeof result.stats.coverageByDomain];
                    const total = cov?.total ?? 0;
                    const answered = cov?.answered ?? 0;
                    const pct = total ? Math.round((answered / total) * 100) : 0;
                    return (
                      <div key={d} className="p-2 rounded border border-zinc-800 text-center" title={`${answered}/${total}`}>
                        <p className="text-xs font-medium text-zinc-300">{d}</p>
                        <p className="text-lg font-bold text-white">{pct}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={goToReview} className="gap-2 bg-amber-600 hover:bg-amber-500">
                  <ExternalLink className="h-4 w-4" />
                  Review Flagged Answers
                </Button>
                <Button onClick={exportExcel} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export All (Excel)
                </Button>
                <Button onClick={downloadAuditPdf} variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Download Audit Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
