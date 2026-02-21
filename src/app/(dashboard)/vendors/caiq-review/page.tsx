"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCAIQReviewStore,
  type CAIQReviewItem,
  type ReviewStatus,
} from "@/stores/caiq-review-store";
import {
  CAIQ_DOMAINS,
  CONFIDENCE_TIERS,
  type CAIQAnswerType,
  type CAIQGeneratedBy,
  type CAIQDomain,
} from "@/lib/caiq/types";
import {
  FileCheck,
  ClipboardList,
  AlertCircle,
  Flag,
  Gauge,
  Filter,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Edit3,
  Flag as FlagIcon,
  Download,
  FileSpreadsheet,
  FileText,
  ExternalLink,
} from "lucide-react";
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend } from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// Seed data for demo (in production, load from API)
// ─────────────────────────────────────────────────────────────────────────────

function buildSeedItems(): CAIQReviewItem[] {
  const domains: CAIQDomain[] = ["AIS", "AAC", "BCR", "CCC", "CEK", "DSP", "GRC", "HRS", "IAM", "IPY", "IVS", "LOG", "SEF", "STA", "TVM", "UEM"];
  const tiers = ["EXACT_MATCH", "SEMANTIC_MATCH", "AI_GENERATED", "FLAGGED"] as const;
  const statuses: ReviewStatus[] = ["Pending", "Approved", "Rejected", "Edited", "Flagged"];
  const answerTypes: CAIQAnswerType[] = ["YES", "NO", "NOT_APPLICABLE", "CONDITIONAL"];
  const generatedBy: CAIQGeneratedBy[] = ["KB_EXACT", "KB_SEMANTIC", "AI_PRIMARY", "AI_FALLBACK", "HUMAN"];

  return Array.from({ length: 24 }, (_, i) => {
    const d = domains[i % domains.length];
    const tier = tiers[i % tiers.length];
    const conf = tier === "EXACT_MATCH" ? 0.98 : tier === "SEMANTIC_MATCH" ? 0.82 : tier === "AI_GENERATED" ? 0.71 : 0.45;
    const status = statuses[i % statuses.length];
    return {
      questionId: `${d}-${String(i + 1).padStart(2, "0")}`,
      domain: d,
      questionText: `Does your organization have documented policies for ${d === "AIS" ? "AI system risk assessment" : d === "IAM" ? "identity and access management" : "this domain"}?`,
      answer: i % 4 === 0 ? "Yes. We maintain an internal policy document that is reviewed annually." : i % 4 === 1 ? "No." : "Conditional — see evidence.",
      answerType: answerTypes[i % answerTypes.length],
      confidence: conf,
      tier,
      sources: ["Internal policy doc"],
      evidenceRefs: i % 3 === 0 ? ["POL-001", "EVD-002"] : [],
      frameworkRefs: [
        { framework: "ISO 27001", controlId: "A.5.1.1", description: "Policies for information security" },
        ...(i % 2 === 0 ? [{ framework: "SOC 2", controlId: "CC1.1", description: "Control environment" }] : []),
      ],
      needsReview: conf < 0.6,
      auditId: `audit-${i + 1}`,
      generatedAt: new Date().toISOString(),
      generatedBy: generatedBy[i % generatedBy.length],
      reviewStatus: status,
      originalAnswer: undefined,
      reviewerNotes: undefined,
      evidenceLinkOverride: undefined,
    } as CAIQReviewItem;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function autonomyLabel(confidence: number): { label: string; badge: string; color: string } {
  if (confidence >= 0.95) return { label: "AI Approved", badge: "AUTO", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30" };
  if (confidence >= 0.6) return { label: "Needs Review", badge: "REVIEW", color: "text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30" };
  return { label: "Human Required", badge: "MANUAL", color: "text-red-600 dark:text-red-400 bg-red-500/15 border-red-500/30" };
}

function sourceLabel(by: CAIQGeneratedBy): string {
  const map: Record<CAIQGeneratedBy, string> = {
    KB_EXACT: "KB Exact",
    KB_SEMANTIC: "KB Semantic",
    AI_PRIMARY: "AI Generated",
    AI_FALLBACK: "AI Generated",
    HUMAN: "Human",
  };
  return map[by] ?? by;
}

function answerTypeDisplay(t: CAIQAnswerType): string {
  if (t === "NOT_APPLICABLE") return "NA";
  return t;
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Modal
// ─────────────────────────────────────────────────────────────────────────────

function EditModal({
  item,
  open,
  onOpenChange,
}: {
  item: CAIQReviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [answerType, setAnswerType] = useState<CAIQAnswerType>("YES");
  const [evidenceInput, setEvidenceInput] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setAnswer(item.answer);
      setAnswerType(item.answerType);
      setEvidenceInput(item.evidenceRefs.join(", "));
      setNotes(item.reviewerNotes ?? "");
    }
  }, [item]);

  if (!item) return null;

  const original = item.originalAnswer ?? item.answer;
  const evidenceRefs = evidenceInput ? evidenceInput.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const handleSave = () => {
    useCAIQReviewStore.getState().addAuditEntry({
      questionId: item.questionId,
      action: "edit",
      previousAnswer: original,
      newAnswer: answer,
      reviewerNotes: notes || undefined,
    });
    useCAIQReviewStore.getState().updateAnswer(item.questionId, {
      answer,
      answerType,
      evidenceRefs,
      reviewerNotes: notes || undefined,
    });
    useCAIQReviewStore.getState().setReviewStatus(item.questionId, "Edited");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit answer — {item.questionId}</DialogTitle>
          <DialogDescription>
            Changes are recorded in the audit log. Original vs edited view below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Original (AI)</Label>
              <div className="rounded-md border bg-muted/30 p-3 text-sm min-h-[80px] whitespace-pre-wrap">
                {original}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Edited version</Label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-[80px]"
                placeholder="Enter revised answer"
              />
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-2 w-40">
              <Label>Answer type</Label>
              <Select value={answerType} onValueChange={(v) => setAnswerType(v as CAIQAnswerType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">YES</SelectItem>
                  <SelectItem value="NO">NO</SelectItem>
                  <SelectItem value="NOT_APPLICABLE">NA</SelectItem>
                  <SelectItem value="CONDITIONAL">CONDITIONAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Evidence references (comma-separated)</Label>
              <Input
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                placeholder="POL-001, EVD-002"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reviewer notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Rationale for change (for auditors)"
              className="min-h-[60px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save & record audit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CAIQReviewPage() {
  const [editingItem, setEditingItem] = useState<CAIQReviewItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineAnswer, setInlineAnswer] = useState("");

  const {
    items,
    stats,
    selectedIds,
    filterDomain,
    filterTier,
    filterStatus,
    sortBy,
    sortDir,
    setItems,
    setStats,
    setReviewStatus,
    updateAnswer,
    toggleSelect,
    selectAll,
    clearSelection,
    setFilterDomain,
    setFilterTier,
    setFilterStatus,
    setSort,
    approveAllHighConfidence,
    bulkSetStatus,
    getFilteredAndSortedItems,
    addAuditEntry,
  } = useCAIQReviewStore();

  const filteredItems = useMemo(() => getFilteredAndSortedItems(), [items, filterDomain, filterTier, filterStatus, sortBy, sortDir, getFilteredAndSortedItems]);

  useEffect(() => {
    const seed = buildSeedItems();
    setItems(seed);
    const approved = seed.filter((i) => i.reviewStatus === "Approved").length;
    const pending = seed.filter((i) => i.reviewStatus === "Pending").length;
    const flagged = seed.filter((i) => i.reviewStatus === "Flagged").length;
    const avgAcc =
      seed.length > 0
        ? seed.reduce((a, b) => a + b.confidence, 0) / seed.length
        : 0;
    setStats({
      total: seed.length,
      approved,
      pending,
      flagged,
      estimatedAccuracy: Math.round(avgAcc * 100) / 100,
    });
  }, [setItems, setStats]);

  const completionPct = stats.total ? Math.round((stats.approved / stats.total) * 100) : 0;
  const gaugeData = [{ name: "Accuracy", value: Math.round((stats.estimatedAccuracy ?? 0) * 100), fill: "hsl(var(--primary))" }];

  const handleApprove = (id: string) => {
    setReviewStatus(id, "Approved");
    addAuditEntry({ questionId: id, action: "approve" });
  };
  const handleReject = (id: string) => {
    setReviewStatus(id, "Rejected");
    addAuditEntry({ questionId: id, action: "reject" });
  };
  const handleFlag = (id: string) => {
    setReviewStatus(id, "Flagged");
    addAuditEntry({ questionId: id, action: "flag" });
  };
  const handleEditClick = (item: CAIQReviewItem) => {
    setEditingItem({ ...item, originalAnswer: item.answer });
    setEditModalOpen(true);
  };

  const handleInlineSave = (questionId: string) => {
    updateAnswer(questionId, { answer: inlineAnswer });
    setReviewStatus(questionId, "Edited");
    addAuditEntry({ questionId, action: "edit", previousAnswer: items.find((i) => i.questionId === questionId)?.answer, newAnswer: inlineAnswer });
    setInlineEditId(null);
    setInlineAnswer("");
  };

  const highConfidenceIds = items.filter((i) => i.confidence >= 0.95 && i.reviewStatus === "Pending").map((i) => i.questionId);
  const selectedCount = selectedIds.size;
  const allFilteredIds = filteredItems.map((i) => i.questionId);

  const handleExportApprovedExcel = () => {
    const approved = items.filter((i) => i.reviewStatus === "Approved");
    const csv = [
      "questionId,domain,answer,answerType,confidence,reviewStatus",
      ...approved.map((a) =>
        [a.questionId, a.domain, `"${(a.answer ?? "").replace(/"/g, '""')}"`, a.answerType, a.confidence, a.reviewStatus].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CAIQ_Approved_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFullPdf = () => {
    window.alert("Full PDF export would open a print dialog or call a PDF API. Implement via your reporting service.");
  };

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            CAIQ Review Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Review, approve, and edit AI-generated CAIQ answers before export.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total answers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-emerald-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <FileCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-red-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Flag className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.flagged}</p>
                <p className="text-xs text-muted-foreground">Flagged</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50 md:col-span-2 flex flex-row items-stretch">
            <CardContent className="p-4 flex-1 flex items-center gap-4">
              <div className="w-24 h-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    data={gaugeData}
                    innerRadius="60%"
                    outerRadius="100%"
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar background dataKey="value" cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Gauge className="h-4 w-4" /> Overall accuracy / confidence
                </p>
                <p className="text-2xl font-bold">{(stats.estimatedAccuracy ?? 0).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{completionPct}%</span>
          </div>
          <Progress value={completionPct} className="h-2" />
        </div>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <Card className="bg-card/40 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters & sort
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Select value={filterDomain} onValueChange={(v) => setFilterDomain(v as CAIQDomain | "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              {CAIQ_DOMAINS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTier} onValueChange={(v) => setFilterTier(v as typeof filterTier)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Confidence tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              {CONFIDENCE_TIERS.map((t) => (
                <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ReviewStatus | "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Edited">Edited</SelectItem>
              <SelectItem value="Flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSort("confidence")}
              className="gap-1"
            >
              Confidence {sortBy === "confidence" && (sortDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSort("domain")} className="gap-1">
              Domain {sortBy === "domain" && (sortDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSort("questionId")} className="gap-1">
              Question ID {sortBy === "questionId" && (sortDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Bulk actions ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={() => approveAllHighConfidence(0.95)}
          disabled={highConfidenceIds.length === 0}
          className="gap-2"
        >
          <Check className="h-4 w-4" /> Approve All High Confidence (0.95+)
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportApprovedExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Export Approved to Excel
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportFullPdf} className="gap-2">
          <FileText className="h-4 w-4" /> Export Full Report (PDF)
        </Button>
        {selectedCount > 0 && (
          <>
            <span className="text-sm text-muted-foreground mx-2">{selectedCount} selected</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkSetStatus(Array.from(selectedIds), "Approved")}
              className="gap-1"
            >
              <Check className="h-3 w-3" /> Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkSetStatus(Array.from(selectedIds), "Rejected")}
              className="gap-1 text-destructive"
            >
              <X className="h-3 w-3" /> Reject
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
          </>
        )}
      </div>

      {/* ── Answer table ─────────────────────────────────────────────────── */}
      <Card className="bg-card/40 border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredItems.length > 0 && filteredItems.every((r) => selectedIds.has(r.questionId))}
                      onCheckedChange={(checked) =>
                        checked ? selectAll(allFilteredIds) : clearSelection()
                      }
                    />
                  </TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="w-28">Autonomy</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead className="w-24">Confidence</TableHead>
                  <TableHead className="w-32">Source</TableHead>
                  <TableHead className="w-40">Evidence / Frameworks</TableHead>
                  <TableHead className="text-right w-44">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((row) => {
                  const autonomy = autonomyLabel(row.confidence);
                  const isInlineEdit = inlineEditId === row.questionId;
                  return (
                    <TableRow key={row.questionId} className="align-top">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(row.questionId)}
                          onCheckedChange={() => toggleSelect(row.questionId)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-muted-foreground">{row.questionId}</div>
                        <p className="text-sm mt-0.5 line-clamp-2">{row.questionText}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs border ${autonomy.color}`}>
                          {row.confidence >= 0.95 ? "🟢" : row.confidence >= 0.6 ? "🟡" : "🔴"} {autonomy.badge} — {autonomy.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {isInlineEdit ? (
                          <div className="flex gap-2">
                            <Textarea
                              value={inlineAnswer}
                              onChange={(e) => setInlineAnswer(e.target.value)}
                              className="min-h-[60px] text-sm"
                              autoFocus
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="icon" className="h-7 w-7" onClick={() => handleInlineSave(row.questionId)}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setInlineEditId(null); setInlineAnswer(""); }}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="text-left text-sm text-foreground hover:bg-muted/50 rounded p-1 -m-1 w-full line-clamp-3"
                            onClick={() => {
                              setInlineEditId(row.questionId);
                              setInlineAnswer(row.answer);
                            }}
                          >
                            {row.answer || <span className="text-muted-foreground italic">No answer</span>}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {answerTypeDisplay(row.answerType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="text-xs font-mono">{row.confidence.toFixed(2)}</span>
                          <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${row.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted">
                          {sourceLabel(row.generatedBy)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.evidenceRefs.slice(0, 3).map((ref) => (
                            <Badge key={ref} variant="outline" className="text-[10px] font-mono">
                              <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
                              {ref}
                            </Badge>
                          ))}
                          {row.frameworkRefs.slice(0, 2).map((f, i) => (
                            <Badge key={`${f.framework}-${f.controlId}-${i}`} variant="outline" className="text-[10px]">
                              {f.framework} {f.controlId}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-emerald-600 hover:text-emerald-500"
                            onClick={() => handleApprove(row.questionId)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => handleEditClick(row)}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-destructive"
                            onClick={() => handleReject(row.questionId)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-amber-600"
                            onClick={() => handleFlag(row.questionId)}
                          >
                            <FlagIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredItems.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No answers match the current filters.
            </div>
          )}
        </CardContent>
      </Card>

      <EditModal
        item={editingItem}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />
    </div>
  );
}
